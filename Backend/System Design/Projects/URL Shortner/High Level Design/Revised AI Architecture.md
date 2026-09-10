
Agreed. We should **remove the AI summarization feature** from Route.io. It adds significant cost and architectural complexity without providing enough product value for the core URL-shortening/analytics platform.

Instead, AI should be integrated directly into the **critical-event workflow**, where it has a much clearer purpose:

> **Route.io detects an important event using deterministic analytics/rules, then AI determines the significance/context and drafts the notification message that will be sent to the customer.**

This is a much stronger project story because AI is not being used as a decorative feature. It is attached to an actual operational workflow.

---

## 7.105 Revised Critical-Event Pipeline

We now divide critical-event processing into **three distinct stages**:

```text
Analytics Events
       |
       v
Stream Aggregation
       |
       v
Deterministic Detection
       |
       v
Critical Event
       |
       v
AI Analysis + Message Drafting
       |
       v
Notification Policy
       |
       v
Email / Webhook / Push
```

The key architectural decision is that **AI does not determine whether the raw click stream crosses a basic numerical threshold**.

For example:

```text
500,000 clicks
within 5 minutes
```

should be detected deterministically.

We should not send 500,000 raw events to an LLM and ask:

> "Is this a critical event?"

That would be expensive, slow, nondeterministic, and operationally unnecessary.

Instead:

```text
Stream Processor
        |
        | deterministic computation
        v
clicks_5m = 125,000

configured threshold = 100,000

125,000 >= 100,000
        |
        v
Critical Event
```

Only after the event has been established do we invoke AI.

---

# 7.106 What AI Actually Does

Suppose Route.io detects:

```text
URL:
route.io/summer-sale

Event:
125,000 clicks in 5 minutes

Previous baseline:
8,000 clicks / 5 minutes

Increase:
+1,462%

Countries:
India 52%
US 21%
UK 12%

Top referrer:
instagram.com

Device distribution:
Mobile 91%
Desktop 9%
```

The deterministic system produces a structured event:

```json
{
  "eventId": "evt_8f31",
  "urlId": "url_72ab",
  "eventType": "traffic_spike",
  "window": "5m",
  "currentClicks": 125000,
  "threshold": 100000,
  "baselineClicks": 8000,
  "increasePercent": 1462,
  "topCountries": [
    "IN",
    "US",
    "GB"
  ],
  "topReferrer": "instagram.com"
}
```

AI receives **this compact context**, not the raw click stream.

Its job is to produce something like:

```text
Subject:
Unusual traffic spike detected for your campaign

Message:
Your summer-sale short URL received 125,000 clicks
in the last 5 minutes, approximately 15.6× your
recent baseline. Most traffic is coming from mobile
users, with Instagram currently the largest referrer.
```

This provides genuine product value.

---

# 7.107 Why AI Should Not Be in the Detection Path

This is an important interview point.

Consider:

```text
Click Event
    |
    v
LLM
    |
    v
"Is this critical?"
```

This creates several problems.

|Problem|Consequence|
|---|---|
|Cost|One model invocation per event would be prohibitively expensive|
|Latency|External model inference is much slower than in-memory counters|
|Determinism|Same input can potentially produce different interpretations|
|Reliability|AI provider outage would affect detection|
|Rate limits|Model APIs have bounded throughput|
|False positives|AI should not be the authoritative threshold engine|
|Debugging|Numeric rules are much easier to audit|

Instead:

```text
Raw events
    ↓
Deterministic aggregation
    ↓
Critical event
    ↓
AI
```

This gives us a very clean separation:

**Deterministic system = truth.**

**AI system = interpretation and communication.**

That is an excellent architectural boundary to explain during a project presentation.

---

# 7.108 AI Invocation Rate Is Dramatically Smaller

This is where the architecture becomes economically interesting.

We previously had:

```text
~579,000 analytics events/sec
```

We absolutely do **not** want:

```text
579,000 AI calls/sec
```

Instead suppose only:

```text
0.01%
```

of traffic contributes to a critical event requiring AI processing.

Then:

```text
579,000 × 0.0001
≈ 58 AI invocations/sec
```

That's approximately:

```text
58 AI requests/sec
```

rather than:

```text
579,000 AI requests/sec
```

That's roughly a:

```text
10,000×
```

reduction in AI invocation volume.

This is exactly how you should present the AI integration:

> "AI operates on critical-event aggregates, not individual analytics events."

---

# 7.109 AI Should Be Asynchronous

We also should not make the redirect request wait for AI.

The architecture should be:

```text
Redirect
   |
   v
Analytics Event
   |
   v
Stream Aggregation
   |
   v
Critical Event
   |
   v
AI Job Queue
   |
   v
AI Worker
   |
   v
Draft Message
   |
   v
Notification Queue
   |
   v
Notification Worker
```

Not:

```text
Redirect
   |
   v
Analytics
   |
   v
AI
   |
   v
Email
   |
   v
Redirect response
```

The second architecture would violate one of our most important principles:

> **A non-critical asynchronous feature must never sit on the redirect critical path.**

If the AI provider goes down for 30 minutes:

```text
AI Provider DOWN
```

Route.io must still be able to:

```text
create URL
redirect URL
record analytics
detect critical event
```

Only:

```text
AI-generated notification drafting
```

should be delayed.

---

# 7.110 AI Worker Architecture

We can introduce a dedicated AI worker:

```text
                    Critical Event
                          |
                          v
                    AI Job Queue
                          |
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Worker 1     Worker 2     Worker 3
             |            |            |
             └────────────┼────────────┘
                          |
                          v
                    AI Provider
                          |
                          v
                    Draft Message
```

The workers can be horizontally scaled independently from:

```text
Node.js API servers
stream processors
notification workers
```

This is important because their workloads are fundamentally different.

---

# 7.111 What Data Should AI Receive?

We should avoid sending unnecessary customer or event data to the model.

The AI context should be a **structured critical-event summary**.

For example:

```json
{
  "eventType": "traffic_spike",
  "url": {
    "shortCode": "abc123",
    "destinationDomain": "example.com"
  },
  "metrics": {
    "currentClicks": 125000,
    "windowMinutes": 5,
    "baselineClicks": 8000,
    "increasePercent": 1462
  },
  "traffic": {
    "topCountry": "IN",
    "topDevice": "mobile",
    "topReferrer": "instagram.com"
  },
  "severity": "high"
}
```

We should **not** send:

```text
10 million individual click events
```

to the AI model.

The stream-processing layer has already transformed those events into the small amount of information necessary for interpretation.

---

# 7.112 AI Output Must Be Structured

Another important architectural decision:

Do not let the AI worker return arbitrary prose that is immediately sent to customers.

Instead require structured output:

```json
{
  "subject": "Unusual traffic spike detected",
  "message": "Your short URL received 125,000 clicks...",
  "severity": "high",
  "recommendedAction": "Review campaign traffic sources",
  "confidence": 0.94
}
```

Then Route.io validates the result.

For example:

```text
AI response
    |
    v
Schema validation
    |
    +── invalid → retry/fallback
    |
    +── valid
           |
           v
      Notification
```

This is particularly important because **the AI output is an untrusted dependency**, even though it is an internal system component.

---

# 7.113 Deterministic Fallback

We should also design the system so that AI failure does not prevent notifications.

Suppose:

```text
Critical Event:
125,000 clicks in 5 minutes
```

and:

```text
AI Provider:
timeout
```

Route.io can generate a deterministic fallback:

```text
Subject:
Critical traffic alert for abc123

Message:
Your URL received 125,000 clicks in the last 5 minutes,
exceeding your configured threshold of 100,000 clicks.
```

Therefore:

```text
AI available
    ↓
AI-generated message

AI unavailable
    ↓
Template-generated message
```

This gives the notification system much stronger availability.

---

# 7.114 Notification Delivery

After AI produces the message:

```text
AI Worker
    |
    v
Draft
    |
    v
Notification Queue
    |
    ├── Email Worker
    |
    ├── Webhook Worker
    |
    └── Push Worker
```

This allows different channels to have independent retry and rate-limiting policies.

For example:

```text
Email
→ provider API

Webhook
→ customer's endpoint

Push
→ push provider
```

A failed webhook should not block an email notification.

---

# 7.115 Exactly-Once User Notification

We should be precise with terminology here.

Across a distributed system, **exactly-once processing end-to-end is difficult to guarantee**.

Instead, design for:

> **At-least-once processing + idempotent notification delivery.**

For example:

```text
criticalEventId = evt_8f31
channel = email
```

Generate:

```text
notificationId =
evt_8f31:email
```

Before sending:

```text
notificationId
       |
       v
Idempotency Store
       |
       +── already sent → skip
       |
       +── not sent → send
```

If the worker crashes and retries:

```text
retry
 ↓
same notificationId
 ↓
already processed
 ↓
don't send duplicate
```

The exact guarantee ultimately depends on the external email/webhook provider's idempotency support, so in an interview I would explicitly say **"we make our internal delivery idempotent and use provider-side idempotency where available."**

---

# 7.116 Revised Route.io Architecture

The overall system now looks like this:

```text
                                  INTERNET
                                     |
                                     v
                                  CDN
                                     |
                              Cache HIT / MISS
                                     |
                                     v
                              Load Balancer
                                     |
                         ┌───────────┼───────────┐
                         ▼           ▼           ▼
                      Node.js     Node.js     Node.js
                         |
              ┌──────────┴───────────┐
              |                      |
              v                      v
           Redis              URL Shard Router
                                     |
                              PostgreSQL Shards
```

The analytics path is independent:

```text
Redirect
   |
   v
Analytics Event
   |
   v
Message Queue
   |
   v
Stream Aggregator
   |
   v
Windowed Metrics
   |
   v
Critical Event Detection
   |
   v
Critical Event
   |
   v
AI Job Queue
   |
   v
AI Workers
   |
   v
AI Provider
   |
   v
Validated Draft
   |
   v
Notification Queue
   |
   ├─────────────┬─────────────┐
   ▼             ▼             ▼
 Email         Webhook        Push
 Worker        Worker         Worker
```

---

# 7.117 Why This Is Better Than AI Summarization

For the project presentation, I would describe the change this way:

> **"I initially considered an AI summarization feature, but it wasn't strongly coupled to the core product value. Instead, I integrated AI into the critical-event pipeline, where it provides actionable value. The deterministic streaming layer identifies events such as traffic spikes or unusual behavior, while AI receives only the aggregated event context and drafts a customer-facing notification. This keeps AI asynchronous, cost-controlled, independently scalable, and non-critical to URL redirection."**

That is a much stronger engineering story than:

> "Route.io has an AI summarization feature."

The first demonstrates **product judgment + system design + cost awareness**.

---

# 7.118 Final Workload Separation

Route.io now has four logically independent workloads:

|Workload|Main requirement|Scaling mechanism|
|---|---|---|
|URL creation|Durable writes|PostgreSQL primary/shards|
|URL redirection|Extremely high read throughput + low latency|CDN + Redis + DB shards|
|Analytics|High-volume asynchronous ingestion|Message queue + consumers + analytics storage|
|Critical events + AI notifications|Real-time aggregation + asynchronous AI/provider calls|Stream processors + AI workers + notification workers|

And this gives us a clean principle for the entire architecture:

> **The redirect path is optimized for latency; analytics is optimized for throughput; critical-event detection is optimized for real-time stateful computation; AI and notifications are optimized for asynchronous reliability and cost control.**

That is the architecture we should continue with.

### Next bottleneck

The next thing we should examine is **critical-event rule management itself**. At 100M users, if users can configure thresholds such as "100K clicks in 5 minutes," "traffic increases 500%," or "traffic from a specific country exceeds X%," we need to determine how rules are indexed and evaluated without checking every rule against every event.

That will let us quantify whether the current stream processor is sufficient or whether we need a dedicated **rule-index/rule-evaluation layer**.