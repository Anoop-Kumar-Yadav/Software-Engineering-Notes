
The next bottleneck is **not URL lookup capacity**. We already addressed that with read replicas.

The problem now shifts to the **analytics workload**. At 10M users, Route.io receives approximately **1 billion redirect events/day**, and if every redirect generates a click event, the analytics system is attempting to persist roughly **11,574 events/sec on average and ~57,850 events/sec at peak**.

This workload is fundamentally different from the URL metadata workload.

---

## 7.26 Quantifying the Analytics Problem

Assume a click event contains approximately:

```text
url_id
timestamp
country
region
city
device_type
browser
os
referrer
ip_hash
user_agent_metadata
```

Suppose the average serialized event is approximately:

```text
1 KB
```

Then:

```text
1,000,000,000 events/day × 1 KB
≈ 1,000 GB/day
≈ 1 TB/day
```

Therefore:

```text
1 day       ≈ 1 TB
30 days     ≈ 30 TB
365 days   ≈ 365 TB
```

And this is **before** considering:

```text
PostgreSQL row overhead
indexes
WAL
replication
vacuum overhead
backups
temporary space
```

So the actual PostgreSQL storage requirement could be substantially larger.

This is the point where storing every raw analytics event indefinitely in the same PostgreSQL database becomes inefficient.

---

# 7.27 Why the Read Replica Does Not Solve This

A common interview mistake is to say:

> "We already added read replicas, so PostgreSQL can handle more analytics."

The replica primarily helps with **read capacity**.

Our problem is now:

```text
Redirect
    ↓
analytics event
    ↓
INSERT click_events
    ↓
PostgreSQL write workload
```

A read replica doesn't make the primary capable of accepting unlimited writes.

The primary still has to process:

```text
~57,850 analytics writes/sec peak
```

and those writes generate:

```text
WAL
index updates
page writes
replication traffic
vacuum work
```

Therefore the bottleneck is now **high-volume analytics ingestion and storage**, not URL lookup reads.

---

# 7.28 The Architectural Change

We introduce exactly **one** architectural change:

> **Separate analytics ingestion from the transactional PostgreSQL workload using a durable message queue.**

For Route.io, a technology such as Kafka would be appropriate at this scale, but the architectural decision is more important than the specific product.

The new flow becomes:

```text
Redirect
   |
   +--------------------> User receives 302
   |
   v
Analytics Event
   |
   v
Message Queue
   |
   v
Analytics Consumer
   |
   v
Analytics Storage
```

This is the first point where introducing a **message broker** is justified.

---

# 7.29 Updated Architecture

The architecture now becomes:

```text
                              Internet
                                 |
                                 v
                        ┌─────────────────┐
                        │  Load Balancer  │
                        └────────┬────────┘
                                 |
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
                 Node.js      Node.js      Node.js
                    │            │            │
                    └────────────┼────────────┘
                                 |
                    ┌────────────┴────────────┐
                    │                         │
                  URL READS                WRITES
                    │                         │
                    ▼                         ▼
             PostgreSQL Replicas       PostgreSQL Primary
                    │                         │
                    │                         │
                    │                         │
                    │              URL creation / updates
                    │
                    │
                    └───────────────┐
                                    │
                                    ▼
                            Analytics Event
                                    │
                                    ▼
                            ┌──────────────┐
                            │ Message      │
                            │ Queue        │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │ Analytics    │
                            │ Consumers    │
                            └──────┬───────┘
                                   │
                                   ▼
                         Analytics Storage
```

The critical architectural distinction is now:

```text
PostgreSQL
    ↓
transactional Route.io data

Analytics Storage
    ↓
large-volume historical event data
```

---

# 7.30 Why the Queue Is Between Redirect and Analytics

Consider this peak event:

```text
57,850 redirects/sec
```

If the redirect request directly performs:

```sql
INSERT INTO click_events ...
```

then the redirect path becomes dependent on PostgreSQL's ability to process analytics writes.

That violates our latency isolation principle.

Instead:

```text
Browser
   |
   | GET /abc123
   v
Node.js
   |
   +------> PostgreSQL Replica
   |             |
   |             +---- destination URL
   |
   +------> Queue
                 |
                 +---- analytics event
   |
   v
302
```

The HTTP request no longer needs to wait for analytics persistence.

The queue accepts the event quickly, and the analytics consumer processes it independently.

---

# 7.31 The Critical Reliability Question

Now we have introduced an important problem:

> **What happens if the analytics consumer is slower than the incoming event rate?**

Suppose:

```text
Incoming:
57,850 events/sec
```

but consumers can process:

```text
40,000 events/sec
```

Then the backlog grows:

```text
57,850 - 40,000
= 17,850 events/sec
```

After one minute:

```text
17,850 × 60
≈ 1,071,000 events
```

of backlog.

This is why the queue is not simply "for asynchronous processing."

It provides **buffering and workload decoupling**, but the consumer layer still needs sufficient aggregate throughput.

---

# 7.32 Consumer Scaling

Suppose one analytics consumer processes:

```text
20,000 events/sec
```

At peak:

```text
57,850 events/sec
```

Required consumers:

```text
57,850
──────
20,000

≈ 2.89
```

Therefore we need at least:

```text
3 consumers
```

with theoretical capacity:

```text
3 × 20,000
= 60,000 events/sec
```

That is technically enough, but leaves almost no headroom.

Using four consumers:

```text
4 × 20,000
= 80,000 events/sec
```

gives:

```text
80,000 - 57,850
= 22,150 events/sec
```

of theoretical headroom.

Again, these numbers must eventually come from benchmark results.

---

# 7.33 Partitioning the Analytics Stream

At this scale, the analytics stream should be partitionable.

A natural partition key is:

```text
url_id
```

Conceptually:

```text
                     Analytics Topic
                           |
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
        Partition 0    Partition 1    Partition 2
            │              │              │
            ▼              ▼              ▼
        Consumer 1     Consumer 2     Consumer 3
```

Using `url_id` as the partition key provides an important property:

> Events belonging to the same URL can consistently go to the same partition.

That becomes useful when maintaining per-URL counters or ordered event processing.

However, partitioning is an implementation detail of the queue architecture. The architectural change we're introducing here is still simply:

**decouple analytics ingestion from transactional PostgreSQL using a durable event stream.**

---

# 7.34 What Happens to `click_events`?

This is an important evolution.

At V1:

```text
PostgreSQL
└── click_events
```

At 10M users, we should no longer treat the raw event table as ordinary transactional data.

The flow becomes:

```text
Redirect
   ↓
Queue
   ↓
Analytics Consumers
   ↓
Analytics Storage
```

The analytics storage could eventually be a column-oriented analytical database or an object-storage-based data lake depending on the query requirements.

For example, analytical queries such as:

```sql
SELECT
    country,
    COUNT(*)
FROM click_events
WHERE url_id = ?
AND timestamp >= ?
GROUP BY country;
```

are fundamentally different from transactional queries such as:

```sql
SELECT destination_url
FROM urls
WHERE short_code = ?;
```

We don't want a huge historical event dataset competing with the transactional URL lookup workload.

---

# 7.35 New Scale Ceiling

Suppose our queue + consumer + analytics-storage pipeline supports:

```text
80,000 events/sec
```

while maintaining the required ingestion latency.

Our peak workload:

```text
57,850 events/sec
```

Therefore:

```text
capacity = 80,000 events/sec
demand   = 57,850 events/sec
```

The analytics ingestion layer now has approximately:

```text
22,150 events/sec
```

of theoretical headroom.

This is a significant architectural improvement because the transactional database is no longer responsible for absorbing the entire raw analytics stream.

---

# 7.36 Cost of Introducing the Queue

We have now paid a substantial complexity cost.

|Cost|Consequence|
|---|---|
|Message broker|Additional infrastructure|
|Consumer fleet|Additional compute|
|Delivery semantics|Need to define at-least-once/exactly-once behavior|
|Duplicates|Consumers must be idempotent|
|Ordering|Must define ordering guarantees|
|Monitoring|Consumer lag becomes critical|
|Retry handling|Failed events require retry/dead-letter handling|
|Operational complexity|Another distributed subsystem|
|Analytics storage|Separate storage and retention lifecycle|

The most important new metric is:

```text
consumer lag
```

For example:

```text
Queue lag = 0–5 seconds
```

may be healthy.

But:

```text
Queue lag = 20 minutes
```

means analytics processing has fallen behind.

Notice that the redirect service itself can still be healthy while analytics is degraded.

That is exactly the isolation we wanted.

---

# 7.37 Route.io Architecture After 10M Users

The architecture has now evolved to:

```text
                                  Internet
                                     |
                                     v
                            ┌─────────────────┐
                            │  Load Balancer  │
                            └────────┬────────┘
                                     |
                       ┌─────────────┼─────────────┐
                       ▼             ▼             ▼
                    Node.js       Node.js       Node.js
                       │             │             │
                       └─────────────┼─────────────┘
                                     |
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
             PostgreSQL Cluster                 Analytics Stream
                    │                                 │
          ┌─────────┴─────────┐                       ▼
          │                   │                 ┌──────────────┐
          ▼                   ▼                 │ Message      │
       Primary            Read Replicas         │ Queue        │
          │                   │                 └──────┬───────┘
          │                   │                        │
          │                   │                 ┌──────┴──────┐
          │                   │                 ▼             ▼
          │                   │             Consumer       Consumer
          │                   │                 │             │
          │                   │                 └──────┬──────┘
          │                   │                        ▼
          │                   │                Analytics Storage
          │
          └── Transactional data
              users
              urls
              summaries
              alerts
              notifications
```

The architecture now has **three distinct workload paths**:

```text
1. Redirect path
   Node.js → PostgreSQL read replica

2. Transactional path
   Node.js → PostgreSQL primary

3. Analytics path
   Node.js → message queue → analytics consumers → analytics storage
```

This separation is the major architectural milestone at the 10M-user tier.

---

# 7.38 Interview Explanation

If asked:

> **"Why did you introduce Kafka/a message queue?"**

Don't answer:

> "Because Kafka handles high traffic."

Instead:

> "At approximately 10M users, our proportional workload reaches around 57,850 peak redirects and therefore potentially 57,850 analytics events per second. Persisting every event synchronously into the transactional PostgreSQL database couples the latency-sensitive redirect path to a high-volume write workload and causes significant storage and I/O pressure. I therefore decouple analytics ingestion using a durable message stream. The redirect service publishes an event and returns the redirect independently, while scalable consumers persist the events into analytics storage. This introduces eventual consistency and operational complexity, but it isolates the redirect SLA from analytics processing."

That is the reasoning an interviewer is looking for.

---

# Current Evolution

We have now crossed three architectural boundaries:

|Scale|Bottleneck|Architectural change|New capability|
|---|---|---|---|
|≤100K|Single application/database eventually approaches resource limits|Modular Node.js monolith + PostgreSQL|Simple transactional system|
|~1M|Node.js CPU/event-loop saturation|Load balancer + horizontal Node.js instances|Application-tier scaling|
|~10M|PostgreSQL read pressure|PostgreSQL read replicas|Read scaling|
|~10M|Analytics ingestion/storage contaminates transactional workload|Durable message queue + analytics consumers/storage|Independent analytics scaling|

The key lesson is that **10M users did not cause us to add "more infrastructure" in one step**. We added infrastructure in response to distinct resource constraints: application CPU, database reads, and finally analytics ingestion.

---

# Next Scale Checkpoint — 100M Users

Now we move to the next major tier.

If behavior continues proportionally:

```text
100M users
10M URLs/day
10B redirects/day

Average redirects:
≈ 115,741/sec

Peak redirects:
≈ 578,500/sec
```

Analytics becomes approximately:

```text
10B events/day
≈ 115,741 events/sec average
≈ 578,500 events/sec peak
```

At this point, **do not immediately assume sharding**.

There are several possible bottlenecks now:

```text
Node.js fleet size
PostgreSQL primary write capacity
PostgreSQL replica capacity
shortCode lookup throughput
analytics stream throughput
analytics storage
network bandwidth
connection management
hot URLs / traffic skew
```

### Your next prediction

At approximately **578,500 peak redirects/sec**, with:

```text
multiple Node.js instances
PostgreSQL primary
multiple PostgreSQL read replicas
separate analytics stream
separate analytics storage
```

what do you expect to become the next fundamental bottleneck in the **URL redirect path**?

Pick **one**, and give me the metric you would use to prove it.

Then we will determine whether Route.io actually needs **sharding**, or whether another architectural change should come first.