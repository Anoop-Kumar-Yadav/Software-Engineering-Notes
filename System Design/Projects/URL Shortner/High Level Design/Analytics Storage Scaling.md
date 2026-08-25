

We now need to solve one of the most important architectural problems in Route.io: **where the analytics events actually live**.

The redirect system and analytics system have fundamentally different access patterns:

```text
URL metadata
→ small records
→ transactional
→ point lookups
→ strong durability

Analytics events
→ enormous volume
→ append-heavy
→ time-series/event queries
→ aggregations
→ retention policies
```

This difference is why we should **not automatically put analytics events into the same PostgreSQL tables that serve URL redirection**.

---

## 7.178 Start With the Actual Event Volume

Our current peak assumption is:

```text
Analytics events:
≈ 579,000 events/sec
```

Let's calculate the daily volume.

```text
579,000 × 60 × 60 × 24
```

which gives approximately:

```text
≈ 50.0 billion events/day
```

That is already an enormous analytics workload.

Now assume an average normalized analytics event occupies:

```text
300 bytes
```

This includes fields such as:

```text
event_id
url_id
timestamp
country
region
device
browser
OS
referrer
IP-derived metadata
status
user-agent-derived attributes
```

Raw event storage:

```text
50B × 300 bytes
≈ 15 TB/day
```

So:

```text
≈ 15 TB/day raw analytics data
```

and:

```text
15 TB × 365
≈ 5.5 PB/year
```

before considering:

```text
indexes
replication
compression overhead
metadata
backups
```

This is the point where architecture must change.

---

# 7.179 Why PostgreSQL Is No Longer the Right Primary Analytics Store

PostgreSQL is excellent for:

```text
URL
User
Project
API Key
Alert Rule
Notification
```

because these are transactional entities.

But imagine:

```text
50 billion INSERTs/day
```

into a PostgreSQL table.

Even if we partition the table, we now have enormous pressure from:

```text
WAL
indexes
vacuum
replication
storage
checkpointing
backup
random analytical reads
```

And analytics queries are fundamentally different from URL lookups.

For example:

```sql
SELECT country, COUNT(*)
FROM analytics_events
WHERE url_id = 'abc123'
  AND timestamp >= ...
GROUP BY country;
```

This query wants to scan and aggregate potentially millions of events.

Meanwhile the redirect path wants:

```sql
SELECT destination
FROM urls
WHERE short_code = 'abc123';
```

Those workloads should not compete for the same database resources.

---

# 7.180 First Architectural Separation

We therefore separate:

```text
                    Route.io
                       |
             ┌─────────┴─────────┐
             |                   |
        Transactional         Analytics
             |                   |
             v                   v
        PostgreSQL          Analytics Store
```

PostgreSQL remains authoritative for:

```text
users
urls
projects
rules
notifications
```

The analytics system becomes:

```text
Click Event
    ↓
Message Queue
    ↓
Analytics Consumers
    ↓
Analytics Storage
```

This separation was already partially introduced when we moved analytics ingestion off the redirect request.

Now we're making the **storage boundary** explicit.

---

# 7.181 But We Shouldn't Immediately Store 50B Raw Events Forever

The previous calculation reveals another issue.

At:

```text
15 TB/day
```

retaining everything indefinitely produces:

```text
≈ 5.5 PB/year
```

That's a lot of storage.

More importantly, customers generally don't need arbitrary raw click events forever.

So we need a **retention strategy**.

For example:

```text
Raw events:
30 days

Hourly aggregates:
12 months

Daily aggregates:
multiple years
```

The exact retention policy is a product requirement, but the architectural principle is important:

> **Keep high-cardinality raw data for a limited period and retain compact aggregates much longer.**

---

# 7.182 Raw Events vs Aggregates

Suppose we have these 1 million clicks:

```text
1,000,000 individual events
```

A customer may ultimately ask:

```text
How many clicks did I receive today?
```

We don't need to scan one million rows every time.

Instead, the stream processor can maintain:

```text
url_id
date
hour
country
device
click_count
```

For example:

```text
abc123
2026-08-19
14:00
IN
mobile
125,430
```

One aggregate record represents thousands or millions of raw events.

---

# 7.183 The Analytics Data Lifecycle

The architecture becomes:

```text
                         Click Event
                              |
                              v
                         Message Queue
                              |
                              v
                     Stream Aggregation
                       /             \
                      /               \
                     v                 v
              Raw Event Store     Aggregate Store
                   |                   |
              30-day TTL          Long retention
```

This gives us two different analytical datasets.

### Raw event store

Used for:

```text
forensics
detailed analytics
debugging
reprocessing
unusual-event investigation
```

### Aggregate store

Used for:

```text
dashboards
charts
daily reports
country breakdown
device breakdown
click trends
```

---

# 7.184 Why We Still Need Raw Events

It might be tempting to store only aggregates.

That would reduce storage dramatically, but we would lose information.

Suppose a customer asks:

> "Why did my traffic spike at 14:32?"

If we only have:

```text
14:00 → 100K
15:00 → 300K
```

we can't investigate the event precisely.

Raw events allow us to inspect:

```text
14:32:01
14:32:02
14:32:03
...
```

and determine:

```text
country
referrer
device
IP-derived attributes
HTTP status
```

So the correct architecture is usually **both raw and aggregated data**, with different retention periods.

---

# 7.185 Compression Changes the Storage Calculation

Our initial:

```text
300 bytes/event
```

was the logical record size.

Analytics storage engines can compress repetitive columns very effectively.

Suppose compression achieves:

```text
4:1
```

Then:

```text
15 TB/day / 4
≈ 3.75 TB/day
```

Annual compressed storage:

```text
3.75 TB × 365
≈ 1.37 PB/year
```

Still large, but substantially more manageable.

This is why an analytics-oriented columnar store can be much more appropriate than a general-purpose transactional table.

---

# 7.186 Why Columnar Storage Fits

Our analytics queries commonly look like:

```text
SELECT
    country,
    COUNT(*)
FROM events
WHERE
    url_id = ?
    AND timestamp BETWEEN ? AND ?
GROUP BY country;
```

We don't necessarily need every column.

We may only need:

```text
url_id
timestamp
country
```

A column-oriented storage engine can read those columns without loading unrelated fields such as:

```text
user_agent
referrer
browser
OS
IP metadata
```

This reduces I/O.

The important concept is:

> **Analytics queries often scan many rows but only a subset of columns.**

That access pattern strongly favors columnar analytical storage.

---

# 7.187 Query Patterns Define the Data Model

Before choosing the actual analytics database, we need to identify Route.io's common queries.

For example:

```text
1. Total clicks for URL over time

2. Clicks by country

3. Clicks by device

4. Clicks by browser

5. Clicks by referrer

6. Unique visitors over time

7. Traffic anomaly detection

8. Top URLs by clicks

9. Conversion/engagement metrics if introduced later
```

These queries are aggregation-heavy.

They are very different from:

```text
GET /urls/abc123
```

which is a point lookup.

---

# 7.188 Analytics Partitioning

The natural partition key is usually time.

For example:

```text
2026-08-18
2026-08-19
2026-08-20
```

or:

```text
month
```

depending on the storage system and retention requirements.

A query such as:

```text
last 24 hours
```

then only touches the relevant partitions.

This is called **partition pruning**.

Instead of scanning:

```text
5 PB
```

the query may scan:

```text
15 TB
```

or, with additional filtering and aggregation structures, substantially less.

---

# 7.189 But Time Partitioning Alone Isn't Enough

Suppose we partition by:

```text
day
```

and have:

```text
50B events/day
```

A query for:

```text
URL abc123
last 24 hours
```

still potentially touches an enormous partition.

We therefore need the storage layout to support filtering by:

```text
url_id
timestamp
```

and potentially other frequently queried dimensions.

This is where the distinction between:

```text
partitioning
```

and:

```text
ordering / clustering
```

becomes important.

Partitioning determines **which large physical chunks are considered**.

Ordering/clustering determines **how efficiently data inside those chunks can be filtered**.

---

# 7.190 Aggregation Layer

We can reduce dashboard query cost even further.

Suppose:

```text
50B raw events/day
```

but customers mostly request:

```text
clicks per URL per hour
```

The stream processor can maintain:

```text
HourlyClickAggregate
---------------------
url_id
hour
click_count
```

Instead of scanning:

```text
50B events
```

the dashboard might query:

```text
24 aggregate records
```

for a single URL.

That's an enormous reduction.

---

# 7.191 Aggregation Example

Raw events:

```text
abc123
14:00:01 → click
14:00:02 → click
14:00:03 → click
...
14:59:59 → click
```

Stream processor:

```text
abc123
2026-08-19 14:00
clicks = 125,430
```

Dashboard:

```text
GET /urls/abc123/analytics?range=24h
```

becomes effectively:

```text
SELECT *
FROM hourly_clicks
WHERE url_id = 'abc123'
  AND hour >= ...
```

The query workload is now tiny.

---

# 7.192 Architecture After Analytics Storage Separation

The Route.io architecture now looks like:

```text
                         Redirect Request
                               |
                               v
                         Node.js API
                               |
                    ┌──────────┴──────────┐
                    |                     |
                    v                     v
                 Redis              PostgreSQL
                    |                URL Metadata
                    |
                    |
                    v
              Analytics Event
                    |
                    v
               Message Queue
                    |
          ┌─────────┴─────────┐
          |                   |
          v                   v
    Stream Processor      Raw Event Writer
          |
          ├───────────────→ Aggregate Store
          |
          └───────────────→ Critical Event Detection
```

Notice that the redirect request doesn't wait for:

```text
analytics storage
aggregation
AI
notifications
```

That remains critical.

---

# 7.193 Analytics Backpressure

Now consider a failure.

Suppose analytics consumers can process:

```text
500,000 events/sec
```

but traffic temporarily reaches:

```text
800,000 events/sec
```

Then:

```text
incoming = 800K/sec
processing = 500K/sec
```

Backlog increases by:

```text
300K events/sec
```

After 60 seconds:

```text
300K × 60
= 18M queued events
```

This is why the message queue is valuable.

The redirect service doesn't need to stop because the analytics store is temporarily slow.

The queue absorbs the difference.

---

# 7.194 Queue Capacity Calculation

Suppose the queue cluster can retain:

```text
100M events
```

and backlog is increasing at:

```text
300K/sec
```

Then approximate buffer time is:

```text
100M / 300K
≈ 333 seconds
```

So:

```text
≈ 5.5 minutes
```

of buffer.

This is a useful operational number.

Instead of saying:

> "We have a scalable queue."

we can say:

> "At a 300K events/sec processing deficit, the current queue capacity provides approximately 5.5 minutes of buffering."

That's the level of reasoning we want in the Route.io design.

---

# 7.195 Consumer Scaling

Suppose one analytics consumer can process:

```text
50,000 events/sec
```

Our normal peak:

```text
579,000 events/sec
```

requires:

```text
579K / 50K
≈ 11.6
```

Therefore:

```text
12 consumers
```

is the theoretical minimum.

At 60% target utilization:

```text
579K / (50K × 0.60)
≈ 19.3
```

So approximately:

```text
20 consumers
```

would provide reasonable headroom under these assumptions.

This is another reason we need partitioned consumption from the queue: consumers can scale horizontally.

---

# 7.196 Partitioning the Analytics Stream

We don't want every consumer processing every event.

We can partition events by:

```text
url_id
```

Conceptually:

```text
                 Analytics Queue
                 /      |      \
                /       |       \
          Partition 1 Partition 2 ... Partition N
             |           |             |
          Consumer     Consumer      Consumer
```

Events for the same URL should ideally be routed consistently.

For example:

```text
partition =
hash(url_id) % N
```

Then:

```text
abc123 → partition 4
abc123 → partition 4
abc123 → partition 4
```

This has a major advantage for our stream-processing workload:

> **Events belonging to the same URL can be processed by the same consumer, simplifying windowed aggregation and rule state management.**

---

# 7.197 Hot-Key Problem

But now we discover another bottleneck.

Suppose one URL becomes viral:

```text
abc123
```

and receives:

```text
200,000 events/sec
```

If:

```text
hash(abc123) → partition 4
```

then partition 4 gets:

```text
200K/sec
```

while other partitions may receive:

```text
20K/sec
```

This is a **hot partition / hot key** problem.

We cannot simply keep increasing the number of partitions because the same URL still hashes to one partition.

This is our next bottleneck.

---

# 7.198 The Tradeoff

We want:

```text
same URL
→ same stream-processing state
```

because window aggregation becomes simpler.

But a viral URL may produce:

```text
200K+ events/sec
```

which could exceed the capacity of a single consumer.

Therefore we have a fundamental tradeoff:

```text
Key affinity
      vs
Parallelism
```

This is an important distributed-stream-processing problem.

---

# 7.199 Possible Solution

We could split a hot URL into subkeys:

```text
abc123:0
abc123:1
abc123:2
...
abc123:15
```

using something like:

```text
hash(event_id) % 16
```

Then:

```text
abc123
   |
   ├── shard 0
   ├── shard 1
   ├── shard 2
   ├── ...
   └── shard 15
```

Each substream can be processed independently.

But now aggregation requires a second stage:

```text
Raw Events
    ↓
Hot-key partitioning
    ↓
Parallel partial aggregates
    ↓
Merge Aggregator
    ↓
Final URL metrics
```

We should **not introduce this yet for every URL** because most URLs won't be hot.

The correct design is likely:

```text
Normal URL
→ one partition

Hot URL
→ adaptive subpartitioning
```

This is the same philosophy we've followed throughout Route.io: **don't pay the complexity cost before the workload requires it.**

---

# 7.200 Current Analytics Architecture

We now have:

```text
                          CLICK
                            |
                            v
                      Node.js Redirect
                            |
                            v
                    Analytics Event
                            |
                            v
                       Message Queue
                            |
                  ┌─────────┴─────────┐
                  |                   |
                  v                   v
             Raw Events         Stream Processor
                  |                   |
                  v             ┌─────┴─────┐
           Analytics Store       |           |
                                 v           v
                            Aggregation   Critical
                              Store        Events
                                 |
                                 v
                          Analytics API
                                 |
                                 v
                             Dashboard
```

And the data lifecycle is:

```text
Raw events
→ short retention

Hourly/daily aggregates
→ long retention
```

---

# 7.201 Scale Ceiling

At our current assumed workload:

```text
579K events/sec
```

and benchmark:

```text
50K events/sec/consumer
```

we need approximately:

```text
20 consumers
```

at 60% utilization.

If a single URL exceeds:

```text
~50K events/sec
```

then it becomes a candidate for hot-key handling.

So our next scale boundary is not simply:

```text
"more users"
```

It is:

> **Does any individual partition key exceed the processing capacity of one stream consumer?**

That is a much more useful engineering metric.

---

## Checkpoint

Consider this workload:

```text
Total analytics traffic:
600,000 events/sec

Consumers:
50,000 events/sec each

One viral URL:
150,000 events/sec
```

Answer these three questions:

1. **How many consumers do we need for the total workload if we target 60% utilization?**
    
2. **Why doesn't simply increasing the number of queue partitions solve the viral URL problem if all events for that URL use `hash(url_id)` as the partition key?**
    
3. **What tradeoff do we introduce if we split that URL across 16 subpartitions?**
    

Once you answer, we'll continue with **hot-key handling and the final analytics architecture**, including unique visitors, approximate counting, retention, and why Route.io should not calculate expensive analytics synchronously during redirects.