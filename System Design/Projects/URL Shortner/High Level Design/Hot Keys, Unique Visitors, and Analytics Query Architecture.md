

We'll continue from the analytics bottleneck we identified: **partition-level hot keys**.

At this point, Route.io is handling approximately:

```text
Total analytics traffic:
≈ 579,000 events/sec

Average consumer capacity:
≈ 50,000 events/sec

Target utilization:
60%
```

The theoretical consumer requirement is:

```text
579,000 / (50,000 × 0.60)
≈ 19.3

≈ 20 consumers
```

But one URL can independently become a problem. If one viral URL generates `150,000 events/sec`, a single partition assigned using `hash(url_id)` cannot process that URL with a `50K events/sec` consumer.

---

# 7.202 Hot-Key Handling

The first question is whether **every URL should be split into multiple partitions**.

No.

That would introduce unnecessary complexity because the overwhelming majority of URLs won't generate enough traffic to justify it.

Instead, Route.io should use **adaptive hot-key partitioning**.

```text
                    Analytics Event
                           |
                           v
                     Determine URL
                           |
                  ┌────────┴────────┐
                  |                 |
             Normal URL          Hot URL
                  |                 |
                  v                 v
            hash(url_id)       hash(url_id +
                  |             sub-shard)
                  |                 |
                  v                 v
             One stream        Multiple streams
```

For example:

```text
Normal URL:
abc123
→ shard 4

Hot URL:
viral123
→ shard 4:0
→ shard 4:1
→ ...
→ shard 4:15
```

---

# 7.203 How Do We Detect a Hot URL?

We cannot know beforehand which URL will become viral.

The stream processor can maintain a short-lived counter:

```text
url_id
window
event_count
```

For example:

```text
URL        1-min events       Rate
abc123       12,000            200/sec
xyz999       30,000            500/sec
viral123   9,000,000        150K/sec
```

If:

```text
event_rate > hot_key_threshold
```

the URL becomes a candidate for adaptive sharding.

The threshold should be based on **consumer capacity**, not an arbitrary number.

If one consumer safely handles:

```text
50K events/sec
```

then a URL producing:

```text
150K/sec
```

requires approximately:

```text
150K / 50K
= 3
```

parallel processing units.

With headroom, we might use four sub-shards.

---

# 7.204 The Second-Stage Aggregator

Once events for a URL are split across multiple workers, each worker maintains a partial aggregate.

Suppose:

```text
viral123 → 4 sub-shards
```

Then:

```text
Shard 0 → 38K clicks
Shard 1 → 37K clicks
Shard 2 → 40K clicks
Shard 3 → 35K clicks
```

The final aggregation layer merges:

```text
38K + 37K + 40K + 35K
= 150K
```

So the architecture becomes:

```text
Raw Events
    |
    v
Partitioning
    |
    ├── Sub-shard 0
    ├── Sub-shard 1
    ├── Sub-shard 2
    └── Sub-shard 3
          |
          v
   Partial Aggregates
          |
          v
    Merge Aggregator
          |
          v
    Final Metrics
```

The cost is additional state and an extra aggregation stage.

Therefore we only activate it for hot keys.

---

# 7.205 Ordering Tradeoff

There is another consequence.

With:

```text
hash(url_id)
```

events for one URL naturally arrive through the same partition.

With:

```text
hash(url_id + sub_shard)
```

events are distributed across multiple partitions.

Therefore **global ordering for that URL is no longer guaranteed**.

For Route.io analytics, this is acceptable because most metrics don't require strict event ordering.

For example:

```text
click_count
country_count
device_count
referrer_count
```

are commutative aggregations.

We can process:

```text
event A
event B
event C
```

in different orders and still obtain the same count.

This is an important reason the architecture works.

---

# 7.206 Analytics Exactly-Once vs At-Least-Once

Now we need to discuss delivery semantics.

Suppose:

```text
Analytics Consumer
      ↓
Update aggregate
      ↓
Consumer crashes
      ↓
Message gets processed again
```

We could accidentally count the same click twice.

There are three broad approaches:

|Semantics|Behavior|Route.io choice|
|---|---|---|
|At-most-once|Event may be lost|Not acceptable for analytics durability|
|At-least-once|Event may be processed repeatedly|Practical ingestion model|
|Exactly-once|Each event affects state once|More expensive/complex|

For Route.io, a practical architecture is:

> **At-least-once event delivery + idempotent/deduplicated aggregation where the business metric requires it.**

We should not claim "exactly once" casually in an interview.

Exactly-once semantics across:

```text
queue
+
consumer
+
storage
```

require coordination and have significant implementation complexity.

---

# 7.207 Event IDs

Every analytics event should have a unique identifier:

```text
event_id
```

For example:

```text
evt_01J...
```

If the same event is delivered twice:

```text
evt_123
evt_123
```

the consumer can detect the duplicate.

But there's an important engineering tradeoff.

Deduplicating every raw event requires maintaining a potentially enormous set of event IDs.

At:

```text
50B events/day
```

a permanent deduplication table is impractical.

Therefore deduplication must have a bounded scope.

For example:

```text
Deduplication window:
5–30 minutes
```

depending on queue retry behavior.

---

# 7.208 Unique Visitors

Now we reach another analytics problem: **click count is easy; unique visitors are not.**

Suppose:

```text
10 million clicks
```

come from:

```text
2 million unique visitors
```

We cannot simply count rows.

We need a visitor identity strategy.

Potential signals include:

```text
IP-derived identifier
user agent
cookie
device identifier
```

But each has privacy, accuracy, and product implications.

For a URL shortener, we should avoid storing unnecessary raw personal data.

A more appropriate approach is to derive a privacy-conscious visitor fingerprint or use a first-party cookie where product requirements permit it.

---

# 7.209 Exact Unique Counting

Suppose we want:

```text
unique visitors/day
```

for a URL.

The naive approach is:

```text
SET(visitor_id)
```

For:

```text
10M unique visitors
```

even a compact representation can become expensive.

At Route.io's global scale, maintaining exact sets for every:

```text
URL × day
```

can become extremely expensive.

Therefore we need approximate cardinality.

---

# 7.210 HyperLogLog

A common approach is **HyperLogLog**.

Conceptually:

```text
Visitor IDs
    |
    v
Hash
    |
    v
HyperLogLog
    |
    v
Approximate cardinality
```

Instead of storing every visitor ID, HLL maintains a small probabilistic data structure.

The important property is:

```text
memory ≪ exact set
```

while providing an approximate unique count with a configurable error rate.

For example, if the product can tolerate approximately:

```text
~1% error
```

then an HLL-style structure is extremely attractive.

This is an excellent interview point:

> **Exact cardinality is expensive at massive scale; approximate cardinality is often the correct product-engineering tradeoff for analytics dashboards.**

---

# 7.211 Why We Don't Need HLL Everywhere

Again, don't introduce it universally.

If a small Route.io installation has:

```text
10,000 clicks/day
```

an exact set is perfectly reasonable.

At:

```text
50B events/day
```

approximate cardinality becomes much more valuable.

This is exactly the scale-driven architecture we're following.

---

# 7.212 Analytics API

Now let's define how customers retrieve analytics.

For example:

```http
GET /v1/urls/{urlId}/analytics
```

Parameters:

```text
from
to
granularity
country
device
```

Example:

```text
GET /v1/urls/abc123/analytics?from=2026-08-18&to=2026-08-19&granularity=hour
```

The API should **not query raw events by default**.

Instead:

```text
Analytics API
      |
      v
Aggregate Store
```

For example:

```text
HourlyClickAggregate
DailyClickAggregate
CountryAggregate
DeviceAggregate
```

---

# 7.213 Query Routing

We can select the smallest dataset capable of answering the query.

```text
Request range
      |
      ├── < 24 hours → hourly aggregate
      |
      ├── < 90 days → daily aggregate
      |
      └── > 90 days → long-term aggregate
```

This dramatically reduces query cost.

Suppose the user requests:

```text
last 7 days
```

Instead of:

```text
50B raw events
```

we might query:

```text
7 × 24 = 168 hourly records
```

for one URL and one metric.

---

# 7.214 Multi-Dimensional Analytics

However, the user might ask:

> "Show clicks by country and device."

Now the aggregate key might be:

```text
url_id
time_bucket
country
device
```

For example:

```text
abc123
2026-08-19 14:00
IN
mobile
125,430
```

But high-dimensional aggregation causes a combinatorial explosion.

Consider:

```text
200 countries
×
5 device classes
×
10 browser classes
```

That's:

```text
200 × 5 × 10
= 10,000 combinations
```

per URL per time bucket.

If we have millions of URLs, storing every possible combination becomes wasteful.

---

# 7.215 Don't Precompute Every Dimension

Instead, define the most valuable dimensions:

```text
country
device
referrer
browser
```

and only materialize combinations that customers actually query frequently.

Another option is to store a columnar event store and let analytical queries compute less-common combinations on demand.

This creates a useful hybrid:

```text
Frequently requested:
→ pre-aggregated

Rare / exploratory:
→ raw or semi-aggregated analytics store
```

---

# 7.216 Analytics Cache

Now consider a popular dashboard.

Suppose one URL has:

```text
100 dashboard requests/sec
```

all asking:

```text
last 24 hours
```

The underlying aggregate query may be cheap, but there is no reason to execute the same query 100 times per second.

At this scale we introduce a cache.

```text
Analytics API
      |
      v
Redis
      |
      ├── HIT → return
      |
      └── MISS
            ↓
      Aggregate Store
```

But this component is justified by **repeated dashboard reads**, not by raw event ingestion.

---

# 7.217 Cache TTL

Analytics are not necessarily strongly consistent.

Suppose:

```text
cache TTL = 30 seconds
```

A dashboard might display:

```text
100,420 clicks
```

while the actual aggregate is:

```text
100,531 clicks
```

for a few seconds.

For analytics, this is generally acceptable because the dashboard isn't part of the redirect critical path.

This is an important consistency distinction:

```text
Redirect:
strong correctness

Analytics dashboard:
eventual consistency acceptable
```

---

# 7.218 Analytics Data Retention

Let's establish a concrete example policy.

```text
Raw events:
30 days

Hourly aggregates:
12 months

Daily aggregates:
5 years
```

Then after 30 days:

```text
Raw Event Store
      ↓
expiration
```

while:

```text
Hourly Aggregate
      ↓
continues
```

and eventually:

```text
Hourly Aggregate
      ↓
compaction
      ↓
Daily Aggregate
```

This reduces long-term storage dramatically.

---

# 7.219 Why Retention Must Be a Product Requirement

We shouldn't arbitrarily choose:

```text
30 days
5 years
```

in a production design.

The actual value depends on:

```text
customer plans
compliance requirements
analytics usefulness
storage cost
privacy requirements
```

For an interview, we can say:

> "I'll assume 30 days of raw events and five years of daily aggregates for capacity planning; the retention period should ultimately be configurable by product tier and compliance requirements."

That's much stronger than presenting those numbers as universal truth.

---

# 7.220 Analytics Failure Isolation

Now consider the worst case.

Analytics storage completely fails.

The desired behavior is:

```text
Redirect
   ↓
SUCCESS
```

while:

```text
Analytics
   ↓
Queue
   ↓
BACKLOG
```

The redirect service must continue operating.

This gives Route.io a critical isolation boundary:

```text
                Redirect Path
                     |
                PostgreSQL
                     |
                Redis
                     |
                     X
                Analytics
                     |
                  Queue
                     |
              Analytics Store
```

The analytics system is **downstream of the user-critical redirect operation**.

That is one of the most important architectural decisions in the entire project.

---

# 7.221 Final Analytics Architecture

We can now consolidate the entire analytics subsystem:

```text
                         ┌────────────────────┐
                         │   Redirect API     │
                         │    Node.js         │
                         └─────────┬──────────┘
                                   |
                                   v
                             Analytics Event
                                   |
                                   v
                           ┌───────────────┐
                           │ Message Queue │
                           └───────┬───────┘
                                   |
                    ┌──────────────┴──────────────┐
                    |                             |
                    v                             v
             Raw Event Writer              Stream Processor
                    |                             |
                    v                    ┌────────┴────────┐
             Raw Event Store             |                 |
                                         v                 v
                                  Aggregation        Critical Event
                                         |             Detection
                                         v                 |
                                  Aggregate Store          v
                                         |            AI / Template
                                         |                 |
                                         v                 v
                                  Analytics API      Notification
                                         |
                                         v
                                      Redis
                                         |
                                         v
                                    Dashboard
```

This is now a proper separation between:

```text
transactional data
event ingestion
stream processing
analytical storage
analytics serving
critical-event detection
notification delivery
```

---

# 7.222 Current Route.io Architecture

At this point, our complete high-level architecture has become:

```text
                              CLIENT
                                |
                    ┌───────────┴───────────┐
                    |                       |
                 Dashboard               Redirect
                    |                       |
                    v                       v
               API Gateway / Load Balancer
                            |
                            v
                     Node.js API Layer
                            |
             ┌──────────────┼───────────────┐
             |              |               |
             v              v               v
           Redis        PostgreSQL       Event Queue
             |          Transactional          |
             |              Data               |
             |                               |
             |                         ┌───────┴────────┐
             |                         |                |
             |                         v                v
             |                   Raw Analytics    Stream Processor
             |                   Storage               |
             |                                      ┌──┴──┐
             |                                      |     |
             |                                      v     v
             |                                  Aggregates
             |                                  Critical Events
             |                                      |     |
             |                                      |     v
             |                                      |    AI
             |                                      |     |
             |                                      |     v
             |                                      | Notification
             |                                      |   Queues
             |                                      |     |
             |                                      |  ┌──┼──┐
             |                                      |  |  |  |
             |                                      | Email Webhook Push
             |                                      |
             └──────────────────────────────────────┘
```

The architecture is becoming complex, but importantly **each major component exists because we crossed a measurable workload boundary**.

---

# 7.223 Scale-Tier Summary So Far

|Scale|Architecture addition|Why it becomes necessary|
|---|---|---|
|Small|Node.js + PostgreSQL|Core transactional workload|
|API growth|Horizontal Node.js instances|Single-process CPU/concurrency limit|
|Read growth|Redis / read scaling|Database read pressure|
|Analytics growth|Event queue|Decouple redirect from analytics|
|High analytics volume|Stream processors|Process events continuously|
|Massive analytics volume|Dedicated analytics storage|PostgreSQL unsuitable for tens of billions of events/day|
|Dashboard growth|Aggregate tables|Avoid scanning raw events|
|Repeated dashboard reads|Redis analytics cache|Reduce repeated aggregate queries|
|Hot URLs|Adaptive subpartitioning|One URL can overload one stream partition|
|Massive unique counting|HLL-style approximation|Exact cardinality becomes memory-expensive|
|Critical-event growth|Rule evaluation pipeline|Avoid scanning all rules per event|
|AI workload|AI queue/workers|External model latency and rate limits|
|Notification growth|Per-channel queues|Failure isolation|
|Delivery growth|Tenant/provider rate limits|Protect providers and prevent noisy neighbors|

---

## The Important Interview-Level Insight

Route.io is no longer simply:

```text
URL Shortener + Database
```

It is now better understood as **three different systems sharing one product**:

```text
1. Transactional URL system
   → PostgreSQL + Redis

2. High-volume analytics system
   → Event Queue + Stream Processing + Analytics Storage

3. Event intelligence and notification system
   → Rule Engine + AI Workers + Notification Queues
```

The key is that these systems are **loosely coupled**.

A failure in:

```text
AI
```

must not break:

```text
analytics
```

A failure in:

```text
analytics storage
```

must not break:

```text
redirects
```

A failure in:

```text
email provider
```

must not stop:

```text
webhook delivery
```

That failure-domain separation is one of the strongest architectural characteristics of the current Route.io design.

---

## Next Step

The next major piece is **the critical-event rule engine itself**.

We need to answer a harder question:

> With potentially millions of active rules and roughly 579K events/sec, how does Route.io determine _which rules are relevant to each event_ without evaluating every rule against every event?

That takes us into **rule indexing, event-to-rule routing, state machines, sliding windows, threshold crossing, hysteresis, and eventually distributed rule evaluation**.