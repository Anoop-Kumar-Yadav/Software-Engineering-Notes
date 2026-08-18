
At 10M users, the workload becomes approximately:

```text
1B redirects/day
≈ 11,574 average redirects/sec
≈ 57,850 peak redirects/sec

1M URL creations/day
≈ 11.6 URL writes/sec average
≈ 58 URL writes/sec peak
```

Our application tier is already horizontally scaled, so Node.js is no longer the first architectural concern.

The critical question is now what happens to the **single PostgreSQL instance**.

---

## 7.14 Identify the Bottleneck

At 57,850 peak redirects/sec, every redirect performs an indexed lookup:

```sql
SELECT destination_url, status, expires_at
FROM urls
WHERE short_code = $1;
```

Assume our PostgreSQL benchmark shows:

```text
Indexed URL lookup CPU        ≈ 0.08 ms/query
```

Then peak database CPU consumed by redirects is approximately:

```text
57,850 × 0.08 ms
= 4.628 CPU-seconds/sec
```

So the database requires approximately:

```text
≈ 4.6 CPU cores
```

just for the redirect lookups.

Now add analytics.

At peak:

```text
57,850 click events/sec
```

Suppose each analytics insert consumes:

```text
0.15 ms CPU
```

Then:

```text
57,850 × 0.15 ms
≈ 8.68 CPU-seconds/sec
```

That's another:

```text
≈ 8.7 CPU cores
```

The approximate combined CPU demand becomes:

```text
Redirect reads       ≈ 4.6 cores
Analytics writes     ≈ 8.7 cores
Other DB operations   ≈ 1–2 cores
--------------------------------
Total                 ≈ 14–15 cores
```

At this point, a single PostgreSQL instance is approaching a serious resource boundary.

But there is an even more important issue.

---

# 7.15 The Read/Write Conflict

Route.io has approximately a:

```text
100 : 1
read : URL-creation-write
```

ratio.

However, analytics changes the database workload considerably.

The database is now doing two fundamentally different things:

```text
Redirect path
    ↓
READ urls
    ↓
latency-sensitive
```

while simultaneously:

```text
Analytics
    ↓
WRITE click_events
    ↓
high-volume
```

So PostgreSQL has to serve:

```text
~57,850 URL reads/sec
+
~57,850 analytics writes/sec
+
URL creation
+
AI summary state changes
+
critical-event writes
+
notification state changes
```

The problem is no longer simply "PostgreSQL has lots of reads."

The database is becoming the shared bottleneck for **two workloads with different performance characteristics**.

The redirect path requires:

```text
very low latency
```

while analytics requires:

```text
high sustained write throughput
```

That is exactly the kind of contention that eventually forces us to separate workloads.

---

# 7.16 But We Must Not Introduce Two Components

There are several possible solutions:

```text
Redis
Read replica
Analytics database
Kafka
Sharding
Database partitioning
```

But our rule is:

> **One bottleneck → one architectural change.**

The immediate bottleneck we're addressing is **read pressure on PostgreSQL affecting the latency-sensitive redirect workload**.

Therefore, our next architectural change is:

# **Add a PostgreSQL Read Replica**

Not Redis.

Not Kafka.

Not sharding.

---

# 7.17 Architectural Change #2 — Read Replica

The architecture becomes:

```text
                         Load Balancer
                              |
                 ┌────────────┼────────────┐
                 │            │            │
                 ▼            ▼            ▼
              Node.js      Node.js      Node.js
                 │            │            │
                 └────────────┼────────────┘
                              |
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
             PostgreSQL Primary   PostgreSQL Replica
                    │                   │
                    │ replication      │
                    └──────────────────►│
```

The important routing decision is:

```text
WRITE
  ↓
PostgreSQL Primary

READ
  ↓
PostgreSQL Read Replica
```

For Route.io:

```text
URL creation
      ↓
Primary

URL update
      ↓
Primary

URL deletion/disable
      ↓
Primary

Redirect lookup
      ↓
Replica
```

---

# 7.18 Why This Helps

Before:

```text
                  PostgreSQL
                     │
          ┌──────────┴──────────┐
          │                     │
       READS                  WRITES
          │                     │
     redirects             analytics
          │                     │
          └──────────┬──────────┘
                     │
               same instance
```

After:

```text
               PostgreSQL Primary
                     │
                   writes
                     │
                     ▼
              PostgreSQL Replica
                     │
                   reads
                     │
                     ▼
                Redirects
```

The replica absorbs the high-volume URL lookup workload.

The primary can concentrate more of its resources on:

```text
URL creation
analytics writes
summary state
critical events
notifications
```

However, there is an important consistency problem.

---

# 7.19 Read Replica Consistency Problem

Suppose a user creates:

```text
shortCode = abc123
```

The request goes:

```text
Client
  ↓
Node.js
  ↓
Primary
```

The URL now exists on the primary.

But replication is asynchronous.

For a brief period:

```text
Primary:
abc123 → https://example.com
```

while:

```text
Replica:
abc123 → not found
```

If the next redirect request immediately goes to the replica:

```text
GET /abc123
       ↓
Replica
       ↓
404
```

even though the URL was successfully created.

That is a **read-after-write consistency problem**.

For Route.io, we therefore need a routing policy.

---

# 7.20 Read Routing Strategy

For normal redirects:

```text
GET /abc123
       ↓
Read Replica
```

But immediately after URL creation, we can temporarily route reads to the primary for that user/request context, or use another consistency strategy.

For example:

```text
POST /urls
    ↓
Primary
    ↓
createdAt/version
    ↓
client receives URL
```

Then requests requiring guaranteed read-after-write consistency can be routed to:

```text
Primary
```

while normal redirects use:

```text
Replica
```

The exact mechanism depends on the product requirement.

Our stated requirement allows a newly created URL to have a very small propagation delay, so we could also explicitly accept **eventual consistency for replica reads**.

That is a product-level decision, not merely a database decision.

---

# 7.21 New Scale Ceiling

Suppose one PostgreSQL replica can sustainably handle:

```text
≈ 40,000 redirect reads/sec
```

while maintaining our latency target.

Our peak workload is:

```text
57,850 reads/sec
```

One replica is insufficient.

So under this benchmark we would need:

```text
2 replicas
```

giving:

```text
2 × 40,000
= 80,000 read QPS
```

against:

```text
57,850 peak read QPS
```

That gives approximately:

```text
80,000 - 57,850
= 22,150 QPS
```

of theoretical read capacity headroom.

Again, these numbers are **capacity assumptions that must be validated by benchmarking**, not universal PostgreSQL limits.

---

# 7.22 Updated Architecture

Our architecture now looks like:

```text
                              Internet
                                 |
                                 ▼
                        ┌─────────────────┐
                        │  Load Balancer  │
                        └────────┬────────┘
                                 |
                  ┌──────────────┼──────────────┐
                  ▼              ▼              ▼
             ┌─────────┐    ┌─────────┐    ┌─────────┐
             │ Node.js │    │ Node.js │    │ Node.js │
             │    #1   │    │    #2   │    │    #3   │
             └────┬────┘    └────┬────┘    └────┬────┘
                  │              │              │
                  └──────────────┼──────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
            WRITE PATH                      READ PATH
                 │                               │
                 ▼                               ▼
        ┌─────────────────┐            ┌─────────────────┐
        │ PostgreSQL      │ replication│ PostgreSQL      │
        │ Primary         │───────────►│ Read Replica    │
        │                 │            │                 │
        │ writes          │            │ redirect reads  │
        │ analytics       │            │ URL lookups     │
        │ URL creation    │            │                 │
        └─────────────────┘            └─────────────────┘
```

This is the first point where Route.io becomes a **distributed data architecture** rather than simply a horizontally scaled application.

---

# 7.23 What Did We Actually Solve?

At 1M users:

```text
Bottleneck:
Node.js CPU

Solution:
Horizontal Node.js scaling
```

At 10M users:

```text
Bottleneck:
PostgreSQL read pressure affecting latency-sensitive redirects

Solution:
PostgreSQL read replica
```

Notice the progression:

```text
100K
 │
 │ Node.js + PostgreSQL
 │
 ▼
1M
 │
 │ Node.js CPU breaks
 │
 ▼
Horizontal Node.js scaling
 │
 ▼
10M
 │
 │ PostgreSQL read pressure breaks
 │
 ▼
Read replica
```

This is exactly how I would want you to explain the architecture in an interview: **each component exists because a measurable workload characteristic justified it.**

---

# 7.24 Cost of the Read Replica

The read replica introduces several real costs.

|Cost|Impact|
|---|---|
|Infrastructure|Additional PostgreSQL instance|
|Replication|WAL/network traffic between primary and replica|
|Consistency|Replica may lag behind primary|
|Routing|Application must distinguish reads from writes|
|Failover|Replica promotion becomes an operational concern|
|Monitoring|Replication lag must be monitored|
|Operational complexity|More database infrastructure to manage|

The most important new metric is:

```text
replication_lag
```

For example:

```text
replication lag = 50 ms
```

may be acceptable.

But:

```text
replication lag = 5 seconds
```

could produce unacceptable stale redirects after URL creation or updates.

---

# 7.25 Interview Answer

If asked:

> **"Why did you introduce a read replica at 10M users?"**

Answer:

> "At 10M users, our estimated workload reaches roughly 57,850 peak redirects per second. Redirects are indexed reads from the URL table, while analytics simultaneously produces roughly 57,850 peak click-event writes per second. Load testing shows the single PostgreSQL instance approaching its CPU and I/O limits, with redirect latency becoming sensitive to analytics write pressure. Since the dominant issue is read pressure on the latency-sensitive redirect path, I introduce a PostgreSQL read replica and route normal URL lookups there while keeping writes on the primary. This improves read capacity, but introduces replication lag and therefore an eventual-consistency tradeoff."

That's the level of reasoning you want in a system-design interview.

---

# Next Bottleneck: You Predict Again

We now have:

```text
10M users
1B redirects/day
~57,850 peak redirects/sec

Node.js:
multiple instances

PostgreSQL:
1 primary
2 read replicas
```

The architecture is now:

```text
                    Load Balancer
                         |
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Node.js     Node.js     Node.js
             │           │           │
             └───────────┼───────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
           WRITES                  READS
              │                     │
              ▼                     ▼
        PostgreSQL             Read Replicas
          Primary             ┌──────┴──────┐
                              ▼             ▼
                           Replica 1     Replica 2
```

Now look at the workload we're generating:

```text
~1B click events/day
```

That is approximately:

```text
1,000,000,000 × ~1 KB
≈ 1 TB/day
```

of raw click-event data **before indexes, PostgreSQL page overhead, WAL, replication, backups, and metadata**.

Over one year:

```text
≈ 365 TB/year raw event payload
```

This is dramatically different from our URL metadata.

So the next question is:

> **At 10M users, what do you think becomes the next architectural bottleneck: database storage, analytics write throughput, query performance on historical analytics, or something else?**

Pick **one bottleneck and one metric you would monitor to prove it**.