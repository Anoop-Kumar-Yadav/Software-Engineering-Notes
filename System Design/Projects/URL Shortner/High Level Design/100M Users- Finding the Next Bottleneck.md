

We now reach the **100M-user tier**. This is where the architecture starts becoming substantially more interesting because the redirect workload is now large enough that we have to examine not only raw throughput, but also **traffic distribution, database write capacity, connection management, and key distribution**.

Our current workload assumptions are:

|Metric|10M users|100M users|
|---|--:|--:|
|URLs created/day|1M|10M|
|Redirects/day|1B|10B|
|Avg redirect QPS|11,574|115,741|
|Peak redirect QPS|57,850|578,500|
|Avg analytics events/sec|11,574|115,741|
|Peak analytics events/sec|57,850|578,500|

The read/write ratio for URL creation remains approximately:

```text
10B redirects/day
─────────────────
 10M URL writes/day

≈ 1,000 : 1
```

That is an extremely read-heavy URL-resolution workload.

---

# 7.39 First Question: Can Read Replicas Simply Scale Further?

At 10M users we introduced PostgreSQL read replicas.

Suppose our benchmark says:

```text
1 PostgreSQL read replica
≈ 40,000 redirect lookups/sec
```

At 100M users:

```text
578,500 peak redirects/sec
```

Required replicas:

```text
578,500
────────
40,000

≈ 14.46
```

So we need at least:

```text
15 replicas
```

just to theoretically handle the lookup workload.

But this creates another problem.

A PostgreSQL replica isn't simply a stateless HTTP server that we can duplicate indefinitely. Every replica requires:

```text
storage
CPU
RAM
WAL replication
network bandwidth
monitoring
backup strategy
failover management
```

The primary must also generate and ship WAL to all those replicas.

If one write generates `W` bytes of WAL, approximately:

```text
Primary WAL generation
        ↓
15 replication streams
        ↓
15 network/storage consumers
```

The primary's replication workload itself becomes significant.

So at this point, **"just add more read replicas" is no longer an efficient scaling strategy**.

But we still need to identify the precise bottleneck.

---

# 7.40 The URL Table Is Becoming Very Large

At 100M users, we're creating:

```text
10M URLs/day
```

Assume the average persistent URL record is approximately:

```text
500 bytes
```

including the core row data but excluding larger secondary structures.

Then:

```text
10M × 500 bytes
= 5 GB/day
```

Raw URL data growth:

```text
5 GB × 365
≈ 1.825 TB/year
```

That's not inherently impossible for PostgreSQL.

So **storage capacity alone does not justify sharding yet**.

This distinction matters.

A staff engineer shouldn't say:

> "The table is 2 TB, therefore shard it."

A 2 TB indexed table can be perfectly manageable depending on workload, hardware, access patterns, and operational requirements.

The real issue is **throughput and contention**.

---

# 7.41 Examine the Redirect Query

Our critical query remains:

```sql
SELECT destination_url, status, expires_at
FROM urls
WHERE short_code = $1;
```

We have a unique index:

```sql
CREATE UNIQUE INDEX idx_urls_short_code
ON urls(short_code);
```

The lookup complexity is approximately:

```text
O(log N)
```

for a B-tree index.

But the important point is that the query is already indexed.

So at 578,500 QPS, the problem isn't:

> "PostgreSQL doesn't know how to find the row."

The problem becomes:

> **Can one PostgreSQL data set sustain this many concurrent indexed lookups while maintaining the redirect latency SLO?**

---

# 7.42 Let's Put Numbers on It

Suppose our read-replica benchmark is:

```text
40,000 QPS
```

at:

```text
p95 latency < 100 ms
CPU ≈ 65%
```

If we push the same replica to:

```text
60,000 QPS
```

we observe:

```text
CPU ≈ 90%
p95 ≈ 140 ms
p99 ≈ 280 ms
```

Our SLO is:

```text
redirect p95 < 100 ms
```

Therefore:

```text
60,000 QPS
```

is not acceptable.

The replica's practical ceiling is approximately:

```text
40,000 QPS
```

under our benchmark.

At 578,500 QPS:

```text
578,500 / 40,000
≈ 14.46
```

So approximately 15 replicas are required.

That is a strong signal that **the current single logical URL dataset is becoming an inefficient scaling unit**.

---

# 7.43 But Here Is the Important Interview Question

Should we immediately shard PostgreSQL?

**Not necessarily.**

There is another problem we must inspect first:

### Traffic skew.

Suppose Route.io has:

```text
100M active URLs
```

but a small number of URLs receive disproportionate traffic.

For example:

```text
Top 1% of URLs
→ 50% of all redirects
```

Then even if we shard by `url_id`, those hot URLs may still overload individual partitions.

This is called a **hot-key problem**.

Therefore, before introducing sharding, we need to establish whether traffic is reasonably distributed across URL keys.

---

# 7.44 The Metric I Want

The key metrics are:

```text
QPS per URL
QPS per database partition
p95/p99 lookup latency
CPU per replica
buffer-cache hit ratio
replication lag
```

Especially:

```text
QPS distribution by shortCode/urlId
```

Suppose our traffic analysis shows:

```text
95% of URLs
→ relatively uniform traffic

5% of URLs
→ disproportionately hot
```

Then sharding can distribute the overall dataset, but it **doesn't automatically solve hot keys**.

That distinction becomes important later.

---

# 7.45 Architectural Change #3 — Database Sharding

Under our current assumptions, the next justified architectural change is:

> **Partition the URL dataset horizontally across multiple PostgreSQL shards.**

The key reason is no longer merely storage.

It is:

**the single logical PostgreSQL dataset has become too large a throughput domain for the redirect workload.**

The architecture changes from:

```text
                 PostgreSQL
                     |
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Replica    Replica    Replica
```

to something conceptually like:

```text
                         Node.js
                            |
                            v
                     Shard Router
                            |
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
          Shard 0        Shard 1        Shard 2
             │              │              │
        replicas       replicas       replicas
```

For example:

```text
Shard 0:
hash(shortCode) % 4 = 0

Shard 1:
hash(shortCode) % 4 = 1

Shard 2:
hash(shortCode) % 4 = 2

Shard 3:
hash(shortCode) % 4 = 3
```

This is only an example. The actual partitioning strategy needs to account for rebalancing, key distribution, operational tooling, and future growth.

---

# 7.46 Why Hash-Based Sharding?

Consider:

```text
shortCode = abc123
```

The application computes:

```text
hash("abc123") % 4
```

Suppose:

```text
hash("abc123") % 4 = 2
```

Then:

```text
GET /abc123
       ↓
Node.js
       ↓
hash(shortCode)
       ↓
Shard 2
       ↓
SELECT destination_url ...
```

The application knows where the record belongs without querying every shard.

This is essential.

A terrible sharding design would be:

```text
Request
   ↓
Shard 1?
   ↓
not found
   ↓
Shard 2?
   ↓
not found
   ↓
Shard 3?
```

That would turn one lookup into multiple network/database operations.

We want:

```text
shortCode
    ↓
deterministic routing
    ↓
exactly one shard
```

---

# 7.47 Four Shards: What Does That Buy Us?

Suppose one shard supports:

```text
40,000 redirect QPS
```

Then four shards theoretically provide:

```text
4 × 40,000
= 160,000 QPS
```

Our workload is:

```text
578,500 QPS
```

So four shards are nowhere near enough.

Suppose we use:

```text
16 shards
```

Then:

```text
16 × 40,000
= 640,000 QPS
```

Our demand:

```text
578,500 QPS
```

So:

```text
640,000 - 578,500
= 61,500 QPS
```

of theoretical headroom exists.

This is much more aligned with our workload.

And importantly, each shard now owns approximately:

```text
100M URLs / 16
≈ 6.25M URL records
```

assuming reasonably uniform hash distribution.

---

# 7.48 Architecture After Sharding

The redirect architecture now becomes:

```text
                                  Internet
                                     |
                                     v
                            ┌─────────────────┐
                            │  Load Balancer  │
                            └────────┬────────┘
                                     |
                          ┌──────────┼──────────┐
                          ▼          ▼          ▼
                       Node.js    Node.js    Node.js
                          │          │          │
                          └──────────┼──────────┘
                                     |
                                     v
                              Shard Router
                                     |
          ┌──────────────┬───────────┼───────────┬──────────────┐
          ▼              ▼           ▼           ▼              ▼
       Shard 0        Shard 1     Shard 2     Shard 3       ... Shard 15
          │              │           │           │
       replicas       replicas    replicas    replicas
```

The important request path is:

```text
GET /abc123
      ↓
Node.js
      ↓
hash(shortCode)
      ↓
Shard N
      ↓
indexed lookup
      ↓
destination URL
      ↓
302
```

No cross-shard query is necessary.

---

# 7.49 What Did Sharding Actually Solve?

Before:

```text
578,500 peak redirects/sec
             ↓
single logical PostgreSQL dataset
             ↓
~15+ replicas required
             ↓
large replication / operational domain
```

After:

```text
578,500 peak redirects/sec
             ↓
16 independent URL shards
             ↓
~36,156 QPS/shard average at peak
             ↓
each shard below ~40K benchmark ceiling
```

The average theoretical load per shard is:

```text
578,500 / 16
≈ 36,156 QPS
```

That gives us approximately:

```text
40,000 - 36,156
≈ 3,844 QPS
```

of headroom per shard.

This is substantially healthier than asking one logical database system to absorb the entire workload.

---

# 7.50 But Sharding Introduces a Serious New Problem

We have now made the architecture more scalable, but significantly more complicated.

The application must now know:

```text
Which shard owns this URL?
```

And more importantly:

> **What happens when we need to change from 16 shards to 32?**

With:

```text
hash(shortCode) % 16
```

changing to:

```text
hash(shortCode) % 32
```

would move approximately half the keys.

That creates a massive data-rebalancing problem.

Therefore, a production implementation would likely use a more sophisticated partitioning scheme such as:

```text
consistent hashing
```

or:

```text
logical partitions → physical shards
```

where logical partitions can be reassigned between physical database nodes.

For example:

```text
ShortCode
   ↓
Partition ID
   ↓
Shard mapping
   ↓
PostgreSQL node
```

This separates the application's routing scheme from the physical database topology.

---

# 7.51 Cost of Sharding

This is one of the most expensive architectural changes we've introduced.

|Cost|Impact|
|---|---|
|Routing layer|Application must determine shard|
|Rebalancing|Moving partitions becomes operationally complex|
|Cross-shard queries|Become expensive or impossible|
|Transactions|Cross-shard transactions are difficult|
|Backups|Must manage multiple databases|
|Monitoring|Per-shard health and capacity|
|Schema migrations|Must coordinate across shards|
|Hot keys|A single hot URL can still overload one shard|
|Failover|Every shard needs independent HA|
|Operational complexity|Significantly higher|

This is why we **did not shard Route.io at 100K or 1M users**.

At those scales, sharding would have been engineering overhead without a corresponding requirement.

---

# 7.52 Interview Explanation

If the interviewer asks:

> **"Why did you shard Route.io?"**

A strong answer is:

> "At the 100M-user tier, our assumed peak redirect traffic reaches approximately 578,500 requests per second. Our benchmark indicates a PostgreSQL URL-lookup replica can sustain around 40,000 requests per second while maintaining the redirect latency SLO. Scaling the existing architecture vertically or adding a large number of replicas becomes an inefficient scaling domain, so I horizontally partition the URL dataset across shards. With 16 shards, the average peak load is approximately 36,000 lookups per shard, below the measured 40,000-QPS ceiling. The tradeoff is substantial operational complexity around routing, rebalancing, migrations, and cross-shard operations."

That answer demonstrates **cause → measurement → architectural decision → capacity → tradeoff**.

---

# 7.53 Route.io Evolution So Far

|Scale|Primary bottleneck|Change|
|---|---|---|
|≤100K|Basic application/database resource limits|Node.js modular monolith + PostgreSQL|
|~1M|Node.js CPU/event-loop saturation|Load balancer + horizontal Node.js scaling|
|~10M|PostgreSQL read pressure|PostgreSQL read replicas|
|~10M|Analytics write/storage workload|Durable event stream + analytics consumers|
|~100M|URL lookup scaling domain|Horizontal database sharding|

The important pattern is:

```text
Requirements
     ↓
Scale estimation
     ↓
Measured bottleneck
     ↓
One architectural change
     ↓
New capacity ceiling
     ↓
New tradeoff
     ↓
Repeat
```

That is the core of the Route.io system-design story.

---

# 7.54 We Are Not Done Yet

At 100M users, Route.io now has a considerably more sophisticated architecture:

```text
                                  Internet
                                     |
                                     v
                            ┌─────────────────┐
                            │  Load Balancer  │
                            └────────┬────────┘
                                     |
                         ┌───────────┼───────────┐
                         ▼           ▼           ▼
                      Node.js     Node.js     Node.js
                         │           │           │
                         └───────────┼───────────┘
                                     |
                 ┌───────────────────┼────────────────────┐
                 │                   │                    │
                 ▼                   ▼                    ▼
           URL Router          Transactional         Analytics
                 │              PostgreSQL             Stream
                 │                   │                    │
       ┌─────────┼─────────┐         │              ┌─────┴─────┐
       ▼         ▼         ▼         │              ▼           ▼
    Shard 0   Shard 1    ...       Primary       Consumer    Consumer
       │         │                  │                 │           │
    replicas  replicas              │                 └─────┬─────┘
       │         │                  │                       ▼
       └─────────┴──────────────┐   │              Analytics Storage
                                │   │
                                ▼   ▼
                              Route.io
                           transactional data
```

And there are still several major engineering questions:

```text
1. How do we handle extremely hot URLs?
2. How do custom aliases interact with sharding?
3. How do we generate globally unique short codes?
4. How do we handle URL expiration efficiently?
5. How do we prevent analytics from becoming expensive during traffic spikes?
6. How do AI-summary jobs scale independently?
7. How do critical-event notifications avoid duplicate delivery?
8. How do we perform shard rebalancing?
9. What happens when a shard fails?
10. Where does caching become justified?
```

The **next particularly interesting bottleneck is hot URLs**. Sharding solves _distribution of the dataset_, but it does **not** guarantee distribution of traffic. One URL can theoretically receive hundreds of thousands of requests per second and concentrate almost all of that traffic on a single shard.

That is the point where we can finally justify introducing **a cache**, rather than saying "URL shorteners usually use Redis."