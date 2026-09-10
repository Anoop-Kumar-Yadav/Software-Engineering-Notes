

We have now reached the next bottleneck in the critical-event pipeline. Detection is deterministic, AI drafting is asynchronous, and the AI output is validated. The remaining problem is **reliable delivery to customers**.

The important distinction is that generating a notification and successfully delivering it are two different distributed-system problems.

```text
Critical Event
      ↓
AI / Template
      ↓
Notification
      ↓
Notification Queue
      ↓
Delivery System
      ↓
Email / Webhook / Push Provider
```

We need to calculate this workload before deciding how sophisticated the notification infrastructure needs to be.

---

## 7.155 Notification Workload

Let's retain our previous assumption:

```text
Critical events:
≈ 58/sec
```

Now suppose each critical event produces:

```text
1 notification
```

Then:

```text
58 notifications/sec
```

But Route.io supports multiple channels.

Suppose the average customer has:

```text
Email:   enabled
Webhook: enabled
Push:    disabled
```

Therefore approximately two delivery attempts are created per event:

```text
58 × 2
= 116 delivery jobs/sec
```

Per day:

```text
116 × 86,400
≈ 10 million delivery jobs/day
```

So our notification system potentially processes:

```text
≈ 10M delivery jobs/day
```

That is manageable, but there is a major issue: **delivery providers are external systems with their own capacity limits and failure behavior.**

---

# 7.156 Why One Notification Queue Is Not Enough

Consider:

```text
Notification Queue
       |
       ├── Email
       ├── Webhook
       └── Push
```

Suppose email processing suddenly becomes slow.

```text
Email provider:
200ms → 5 seconds
```

If all channels share the same queue, email jobs can consume worker capacity and delay webhooks.

For example:

```text
Email backlog
████████████████████████

Webhook
Push
```

A webhook notification that normally takes 100ms could now wait behind thousands of email jobs.

That violates an important principle:

> **Independent delivery channels should have independent failure domains.**

Therefore we split the queue.

---

# 7.157 Architectural Change — Per-Channel Queues

The architecture becomes:

```text
                         Notification
                              |
                  ┌───────────┼───────────┐
                  ↓           ↓           ↓
             Email Queue  Webhook Queue Push Queue
                  ↓           ↓           ↓
             Email Worker Webhook Worker Push Worker
                  ↓           ↓           ↓
             Provider       Customer      Push
```

This is our next justified architectural change.

The previous architecture is sufficient while notification volume is small and channel failures are unlikely to interfere materially.

Once we reach approximately:

```text
100+ delivery jobs/sec
```

with multiple independent external providers, isolating the workloads becomes valuable because the failure and latency characteristics differ significantly.

---

# 7.158 Why the Queues Should Be Separate

Suppose:

```text
Email:
80 jobs/sec

Webhook:
30 jobs/sec

Push:
6 jobs/sec
```

Total:

```text
116 jobs/sec
```

If email provider latency increases dramatically, only:

```text
Email Queue
```

should grow.

The system should still process:

```text
Webhook Queue
Push Queue
```

normally.

This gives us **failure isolation**.

---

# 7.159 Webhooks Are a Particularly Difficult Channel

Email providers usually accept a message and then handle downstream delivery.

Webhooks are different.

Route.io must directly call:

```text
https://customer.example.com/webhook
```

The customer's server may return:

```text
200
```

or:

```text
429
500
502
503
504
```

or simply timeout.

Therefore webhook delivery requires:

```text
timeout
retry
backoff
rate limiting
circuit breaking
idempotency
```

---

# 7.160 Webhook Timeout

Never allow a webhook worker to wait indefinitely.

Suppose:

```text
Webhook timeout = 5 seconds
```

and:

```text
100 concurrent webhook requests
```

If the customer endpoint stops responding, those 100 workers can remain occupied for five seconds.

At large scale this can exhaust worker concurrency.

Therefore:

```text
Webhook Request
      |
      v
Timeout Controller
      |
      ├── 2xx → success
      |
      ├── 429 → retry later
      |
      ├── 5xx → retry later
      |
      └── timeout → retry later
```

The timeout is part of our resource-protection strategy.

---

# 7.161 Webhook Retry Policy

Suppose the customer returns:

```text
503 Service Unavailable
```

We shouldn't immediately send the request again.

Use exponential backoff:

```text
Attempt 1 → immediately
Attempt 2 → +1 sec
Attempt 3 → +2 sec
Attempt 4 → +4 sec
Attempt 5 → +8 sec
```

The exact schedule is configurable.

After the maximum retry count:

```text
Webhook Queue
      ↓
Retry exhausted
      ↓
Dead Letter Queue
```

The customer can inspect or replay failed deliveries.

---

# 7.162 Webhook Idempotency

This is critical.

Suppose Route.io sends:

```text
notificationId = notif_123
```

Customer receives it and processes it successfully.

But the response is lost:

```text
Route.io → Customer
             ↓
          processed
             ↓
        response lost
```

Route.io sees:

```text
timeout
```

and retries.

The customer now receives:

```text
notif_123
```

twice.

Therefore every webhook request should include an identifier such as:

```text
X-Route-Event-ID: evt_123
X-Route-Notification-ID: notif_123
```

The customer's endpoint should ideally treat the notification ID as an **idempotency key**.

Route.io should document this contract explicitly.

---

# 7.163 Webhook Security

We also need to authenticate webhook requests.

A straightforward mechanism is an HMAC signature.

Conceptually:

```text
signature =
HMAC-SHA256(
    customer_secret,
    request_body
)
```

Route.io sends:

```text
X-Route-Signature
```

The customer verifies the signature using their secret.

The important property is:

```text
same payload
+
same secret
→
same signature
```

This allows the receiving system to verify that the request was generated by Route.io and wasn't modified in transit.

We should also include a timestamp to reduce replay attacks:

```text
timestamp + payload
```

and reject requests outside an allowed time window.

---

# 7.164 Per-Customer Rate Limiting

Now imagine one customer creates:

```text
10,000 URLs
```

and all of them suddenly generate events.

Without tenant-level rate limiting:

```text
Customer A
    ↓
10,000 notifications/sec
    ↓
Webhook workers
```

One tenant can consume the entire delivery capacity.

Therefore the notification layer needs a **tenant-aware rate limiter**.

Conceptually:

```text
Notification
     |
     v
tenantId
     |
     v
Rate Limiter
     |
     +── allowed → send
     |
     +── over quota → delay
```

For example:

```text
Tenant A:
100 notifications/sec

Tenant B:
20 notifications/sec

Tenant C:
500 notifications/sec
```

The exact quota can depend on the customer's plan.

---

# 7.165 Why Global Rate Limiting Is Insufficient

Suppose global capacity is:

```text
10,000 notifications/sec
```

and one customer produces:

```text
9,900/sec
```

Then:

```text
Customer A → 9,900/sec
Customer B → 50/sec
Customer C → 50/sec
```

Technically the global limit isn't exceeded.

But Customer A is effectively starving everyone else.

Therefore we need **two levels of protection**:

```text
Tenant Rate Limit
        ↓
Global Provider Rate Limit
```

For example:

```text
Tenant limit:
500/sec

Provider limit:
10,000/sec
```

Both must be respected.

---

# 7.166 Provider Rate Limits

External providers also impose limits.

Suppose:

```text
Email provider:
5,000 requests/sec
```

Route.io should never allow its email workers to exceed that rate.

The flow becomes:

```text
Email Queue
     ↓
Tenant Rate Limiter
     ↓
Global Email Rate Limiter
     ↓
Email Workers
     ↓
Provider
```

The same concept applies to webhooks and push.

---

# 7.167 Notification State

We now need persistent delivery state.

A notification should not simply disappear after leaving the queue.

We need to know:

```text
Was it generated?
Was AI used?
Was it queued?
Was it sent?
Did the provider accept it?
Did it fail?
How many retries occurred?
```

A simplified entity could be:

```text
Notification
------------
id
event_id
tenant_id
channel
status
subject
message
attempt_count
provider_message_id
last_error
scheduled_at
sent_at
created_at
```

Possible states:

```text
PENDING
   ↓
PROCESSING
   ↓
SENT
```

Failure path:

```text
PROCESSING
   ↓
FAILED
   ↓
RETRY_PENDING
   ↓
PROCESSING
```

Terminal failure:

```text
RETRY_PENDING
   ↓
DEAD_LETTER
```

---

# 7.168 Notification Idempotency

We previously discussed AI-job idempotency.

Now we need another idempotency boundary.

Suppose:

```text
eventId:
evt_123

channel:
email
```

Generate:

```text
notificationId:
evt_123:email
```

Then enforce uniqueness:

```text
UNIQUE(event_id, channel)
```

or an equivalent idempotency key.

This prevents:

```text
evt_123
   ↓
email notification
   ↓
email notification
   ↓
email notification
```

from being created accidentally by duplicate event processing.

---

# 7.169 The Notification Database Is Not the Queue

This distinction is important in an interview.

We should not use PostgreSQL itself as the high-throughput delivery queue.

Instead:

```text
PostgreSQL
→ durable notification state

Message Queue
→ delivery work

Redis
→ rate-limit / ephemeral state
```

Each system has a different responsibility.

```text
Database:
"What happened?"

Queue:
"What needs to happen?"

Redis:
"What is the current temporary limit/state?"
```

This separation keeps the system scalable.

---

# 7.170 Delivery Flow

The complete webhook flow now looks like:

```text
Critical Event
      ↓
Notification Created
      ↓
Webhook Queue
      ↓
Tenant Rate Limiter
      ↓
Global Provider Rate Limiter
      ↓
Webhook Worker
      ↓
HTTP Request
      |
      ├── 2xx
      |    ↓
      |  SENT
      |
      ├── 429
      |    ↓
      |  RETRY
      |
      ├── 5xx
      |    ↓
      |  RETRY
      |
      └── Timeout
           ↓
         RETRY
           ↓
      Max retries?
           |
       ┌───┴───┐
       ↓       ↓
      NO      YES
       |       |
       ↓       ↓
     Retry   DLQ
```

---

# 7.171 Email Delivery Is Different

Email should not behave exactly like webhooks.

For email:

```text
Route.io
   ↓
Email Provider
   ↓
Provider accepts message
   ↓
Provider handles delivery
```

The provider may later report:

```text
delivered
bounced
complained
rejected
```

So Route.io should distinguish:

```text
accepted by provider
```

from:

```text
delivered to recipient
```

These are not the same state.

For example:

```text
EMAIL_ACCEPTED
      ↓
provider_message_id
      ↓
provider webhook
      ↓
DELIVERED
```

or:

```text
EMAIL_ACCEPTED
      ↓
BOUNCED
```

This is a better model than simply marking the notification as `SENT`.

---

# 7.172 Notification Architecture After This Change

Our current system becomes:

```text
                           Critical Event
                                 |
                                 v
                         AI / Template
                                 |
                                 v
                       Notification Store
                                 |
                                 v
                      Notification Dispatcher
                                 |
               ┌─────────────────┼─────────────────┐
               |                 |                 |
               v                 v                 v
          Email Queue       Webhook Queue      Push Queue
               |                 |                 |
               v                 v                 v
         Email Workers     Webhook Workers    Push Workers
               |                 |                 |
               v                 v                 v
         Email Provider    Customer Endpoint   Push Provider
```

Each channel independently handles:

```text
rate limiting
retry
failure
provider integration
delivery state
```

This is much safer than one universal worker pool.

---

# 7.173 New Scale Ceiling

Let's use a concrete worker benchmark.

Suppose one webhook worker can sustain:

```text
200 requests/sec
```

with:

```text
100ms average latency
```

and:

```text
50 concurrent requests
```

At:

```text
58 webhook jobs/sec
```

we technically need:

```text
58 / 200
= 0.29 workers
```

So a single worker has enough raw capacity.

But production doesn't provision exactly at the theoretical minimum.

With:

```text
3× headroom
```

we would provision:

```text
1 worker minimum
```

but likely run:

```text
2–3 workers
```

for availability and rolling deployments.

Now imagine a major traffic event increases webhook workload to:

```text
1,000 jobs/sec
```

Then:

```text
1,000 / 200
= 5 workers
```

At 60% target utilization:

```text
1,000 / (200 × 0.60)
≈ 8.3
```

So:

```text
9 workers
```

would be appropriate under these assumptions.

This gives us a clear autoscaling signal:

```text
queue depth
+
processing latency
+
provider rate limit
```

rather than CPU alone.

---

# 7.174 Queue Depth Is a Better Autoscaling Signal

For a normal Node.js API:

```text
CPU utilization
```

is often useful.

For notification workers:

```text
CPU = 30%
```

doesn't necessarily mean the system has enough capacity.

Suppose:

```text
Queue:
500,000 pending jobs

CPU:
30%
```

Workers may simply be waiting on external providers.

Therefore we monitor:

```text
queue_depth
oldest_message_age
processing_latency
success_rate
retry_rate
provider_429_rate
```

The strongest scaling signal is often:

> **How long is the oldest notification waiting before processing?**

If:

```text
oldest message age = 500ms
```

the system is healthy.

If:

```text
oldest message age = 60 seconds
```

we have a capacity or provider problem even if CPU is only 20%.

---

# 7.175 Notification Storm Protection

There's another failure mode.

Suppose one customer's URL suddenly receives:

```text
10M clicks
```

and the critical-event system detects several anomalies.

Without protection, Route.io could produce:

```text
100,000 notifications
```

for the same customer.

That is technically successful processing but **terrible product behavior**.

Therefore we need notification aggregation at the event-policy layer.

For example:

```text
Traffic spike
Country anomaly
Referrer anomaly
Device anomaly
```

occurring within:

```text
5 minutes
```

can be grouped into:

```text
One critical notification
```

with AI receiving all four signals.

This reduces:

```text
notification volume
AI calls
email volume
webhook traffic
```

simultaneously.

---

# 7.176 Final Notification Design

At this point, Route.io's notification subsystem has a clear architecture:

```text
                    Critical Event
                           |
                           v
                  Event Deduplication
                           |
                           v
                  Notification Policy
                           |
                           v
                  AI / Template Draft
                           |
                           v
                  Notification Store
                           |
                           v
                    Dispatcher
                           |
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
     Email Queue      Webhook Queue      Push Queue
          ↓                ↓                ↓
     Rate Limiter      Rate Limiter      Rate Limiter
          ↓                ↓                ↓
     Email Worker     Webhook Worker    Push Worker
          ↓                ↓                ↓
       Provider       Customer API       Provider
          ↓
   Delivery Status
```

The key engineering principle is:

> **Queues isolate asynchronous workloads, rate limiters protect external dependencies, idempotency prevents duplicates, and persistent notification state gives us recoverability and observability.**

---

# 7.177 Updated Route.io Scale Map

|Scale tier|Architecture|Primary bottleneck solved|
|---|---|---|
|Small|Node.js + PostgreSQL|Core application|
|~1M users|Horizontal Node.js scaling|API CPU/concurrency|
|~10M|Read replicas / caching|Database read throughput|
|~10M|Analytics queue|Analytics isolation|
|~100M|Redis + database partitioning/sharding|Hot reads + database capacity|
|~100M+|Stream aggregation|Real-time analytics|
|~100M+|Rule index/cache|Alert-rule evaluation|
|~100M+|AI queue + workers|AI latency and provider isolation|
|~100M+|Per-channel notification queues|Channel failure isolation|
|~100M+|Tenant/provider rate limiting|Noisy-neighbor + provider protection|
|~100M+|Delivery state + DLQ|Reliable recovery|

We should **not** deploy all of this for a 10K-user Route.io deployment. At that scale, PostgreSQL-backed notification jobs and a small worker pool may be entirely sufficient. The architecture becomes justified progressively as the measured workload crosses the corresponding capacity boundary.

---

## Next Bottleneck: Analytics Storage

The next major subsystem we need to scale is **where Route.io stores the enormous volume of analytics events**.

This is particularly important because we have deliberately separated:

```text
URL metadata
```

from:

```text
raw analytics events
```

At our current peak assumption:

```text
≈ 579,000 analytics events/sec
```

we need to calculate:

```text
events/day
events/month
storage/day
storage/year
write bandwidth
query patterns
retention requirements
```

Then we'll determine **exactly when PostgreSQL stops being an appropriate analytics store**, rather than simply declaring that "we need a data warehouse because analytics is large."