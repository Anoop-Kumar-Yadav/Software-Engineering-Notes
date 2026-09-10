

We now have Redis protecting the PostgreSQL shards from hot-key traffic. The next bottleneck is **no longer primarily database capacity**. At extreme traffic levels, the redirect path itself starts consuming substantial **application, network, and regional capacity**, particularly when a small number of URLs become viral.

This is the point where an **edge/CDN layer** can become justified. But, following our design rule, we should first quantify the problem rather than adding a CDN simply because "large systems use CDNs."

---

## 7.72 Quantifying the Edge Problem

Consider an extreme but plausible viral event:

```text
1,000,000 redirects/sec
```

Suppose the HTTP redirect response is approximately:

```text
500 bytes
```

Then outbound response bandwidth is:

```text
1,000,000 × 500 bytes
= 500,000,000 bytes/sec
≈ 500 MB/sec
```

In bits:

```text
500 MB/sec × 8
≈ 4 Gbps
```

That's only the response payload.

The actual network requirement is higher because we also have:

```text
TCP/TLS overhead
HTTP headers
request payload
load-balancer traffic
Node.js network traffic
internal Redis traffic
```

Suppose the effective network cost is approximately 1 KB per request in both directions.

Then:

```text
1,000,000 requests/sec × 1 KB
≈ 1 GB/sec
≈ 8 Gbps
```

A single regional deployment now needs to accommodate **multiple gigabits per second of traffic for one viral URL**.

At larger spikes:

```text
5M redirects/sec
```

we could approach:

```text
≈ 40 Gbps
```

of effective network traffic.

At this point, continuing to push every redirect through:

```text
Internet
   ↓
Load Balancer
   ↓
Node.js
   ↓
Redis
```

is inefficient.

---

# 7.73 What the CDN Actually Changes

A CDN moves the redirect-resolution cache closer to the client.

Before:

```text
Client
   |
   v
Load Balancer
   |
   v
Node.js
   |
   v
Redis
   |
   v
PostgreSQL
```

After:

```text
Client
   |
   v
CDN / Edge
   |
   ├── HIT ───────> 302
   |
   └── MISS
          |
          v
       Origin
          |
          v
       Node.js
          |
          v
        Redis
```

The important distinction is:

```text
Redis
→ reduces origin database traffic.

CDN
→ reduces origin application traffic and moves response handling toward the network edge.
```

They solve different bottlenecks.

---

# 7.74 Can a CDN Cache a 302 Redirect?

Yes, but this requires careful cache-control semantics.

Suppose Route.io returns:

```http
HTTP/1.1 302 Found
Location: https://example.com/article
Cache-Control: public, max-age=300
```

The CDN can cache the redirect response for:

```text
300 seconds
```

A subsequent request for:

```text
https://route.io/abc123
```

can terminate at the edge without reaching Route.io's origin.

Conceptually:

```text
First request:

Client
 ↓
CDN MISS
 ↓
Route.io origin
 ↓
302 + Cache-Control
 ↓
CDN stores response
 ↓
Client
```

Then:

```text
Next 100,000 requests:

Client
 ↓
CDN HIT
 ↓
302
```

The origin doesn't process those 100,000 requests.

---

# 7.75 The Scale Calculation

Suppose:

```text
1,000,000 redirects/sec
```

and the CDN achieves:

```text
90% cache hit ratio
```

Then origin traffic becomes:

```text
1,000,000 × 10%
= 100,000 requests/sec
```

We have therefore reduced origin request volume by:

```text
1,000,000 - 100,000
= 900,000 requests/sec
```

That's a **10× reduction**.

If the CDN achieves 99%:

```text
1,000,000 × 1%
= 10,000 origin requests/sec
```

That's a **100× reduction**.

This is the numerical reason an edge cache becomes valuable.

---

# 7.76 Why Redis Still Exists

It is important not to confuse CDN and Redis.

Consider this request:

```text
Client in Mumbai
      ↓
CDN edge
      ↓
MISS
      ↓
Route.io origin
      ↓
Redis
      ↓
destination
```

Redis remains valuable because it protects the origin database.

The CDN protects the **entire origin stack**:

```text
CDN
 ↓
Load balancer
 ↓
Node.js
 ↓
Redis
 ↓
PostgreSQL
```

Redis protects primarily:

```text
Redis
 ↓
PostgreSQL
```

Therefore the layers are complementary:

```text
CDN
→ edge/origin traffic reduction

Redis
→ origin/database traffic reduction

PostgreSQL
→ authoritative URL state
```

---

# 7.77 But Analytics Changes the CDN Decision

There is a major problem.

Route.io wants click analytics.

If a CDN handles:

```text
1,000,000 redirects/sec
```

and returns the cached response without contacting Route.io, then our Node.js application doesn't see those requests.

That means:

```text
CDN HIT
   ↓
302
```

could bypass our analytics generation completely.

We cannot simply say:

> "Put redirects behind a CDN."

because doing so may destroy our click-event collection.

This is a **fundamental product/architecture interaction**.

---

# 7.78 Separating Redirect Delivery From Analytics Collection

We need to distinguish:

```text
Redirect delivery
```

from:

```text
Analytics event collection
```

The CDN can serve the redirect while analytics is generated through a separate mechanism.

One possible architecture is:

```text
Client
   |
   v
CDN
   |
   ├──────────────> 302
   |
   └── analytics mechanism
```

However, the exact mechanism depends on what data Route.io requires.

For server-side analytics, a CDN can potentially emit logs or request telemetry that is asynchronously exported to Route.io's analytics pipeline.

Then:

```text
CDN
 ↓
Edge/request logs
 ↓
Analytics stream
 ↓
Analytics consumers
 ↓
Analytics storage
```

This means the CDN becomes another producer of analytics events.

---

# 7.79 Important Consistency Tradeoff

Suppose the URL destination changes:

```text
abc123
old.example.com
       ↓
new.example.com
```

PostgreSQL updates immediately.

But the CDN might still have:

```text
abc123 → old.example.com
```

for:

```text
max-age=300
```

Therefore the old destination can remain cached for up to five minutes.

That means a CDN introduces another **eventual-consistency window**.

For Route.io, we need a product decision:

> **How quickly must a URL destination update become globally effective?**

If the requirement is:

```text
destination update propagation < 1 second
```

then aggressive CDN caching becomes difficult.

If:

```text
propagation within 5 minutes is acceptable
```

then CDN caching becomes much easier.

This is exactly why requirements must precede architecture.

---

# 7.80 URL Expiration and CDN Caching

The same issue exists with expiration.

Suppose:

```text
URL expires:
12:00:00
```

but the CDN cached:

```text
302 response
TTL = 10 minutes
```

If the CDN doesn't know the expiration boundary, it could continue returning the redirect after the URL has expired.

Therefore the origin should provide a cache lifetime constrained by the URL expiration:

```text
CDN TTL
=
min(
    configured cache TTL,
    expiresAt - currentTime
)
```

For example:

```text
Configured TTL = 10 minutes
URL expires in = 3 minutes

Effective CDN TTL = 3 minutes
```

This maintains the semantic requirement.

---

# 7.81 Architectural Change #5 — CDN / Edge Cache

Under our current workload assumptions, we can now justify the CDN.

The architecture becomes:

```text
                                  Internet
                                     |
                                     v
                              ┌────────────┐
                              │    CDN     │
                              │ Edge Cache │
                              └─────┬──────┘
                                    |
                         ┌──────────┴──────────┐
                         │                     │
                        HIT                   MISS
                         │                     │
                         │                     ▼
                         │              Load Balancer
                         │                     |
                         │              Node.js fleet
                         │                     |
                         │                   Redis
                         │                     |
                         │              Sharded PostgreSQL
                         │
                         ▼
                       302
```

Analytics is now conceptually separated:

```text
CDN / Origin request telemetry
             |
             v
       Analytics Stream
             |
             v
      Analytics Consumers
             |
             v
      Analytics Storage
```

---

# 7.82 New Scale Ceiling

Suppose our CDN configuration supports:

```text
10M edge requests/sec
```

and our measured cache hit ratio is:

```text
90%
```

At:

```text
5M redirects/sec
```

origin traffic becomes:

```text
5M × 10%
= 500K requests/sec
```

So the CDN absorbs:

```text
4.5M requests/sec
```

without requiring the origin application to process them.

The important thing is that the **system's effective scale ceiling is now largely determined by edge capacity and cache efficiency**, rather than PostgreSQL alone.

---

# 7.83 Cost of the CDN

The CDN introduces another substantial tradeoff.

|Cost|Consequence|
|---|---|
|CDN infrastructure|Additional per-request/bandwidth cost|
|Cache invalidation|Destination changes may propagate slowly|
|Analytics|CDN hits bypass the application|
|TTL management|Must respect URL expiration|
|Debugging|Request may never reach origin|
|Configuration|Cache-control behavior becomes critical|
|Vendor dependency|Increased reliance on edge provider|
|Security|Need to correctly protect origin from direct access|
|Cache fragmentation|Different headers/variants can reduce hit ratio|

The key metric becomes:

```text
CDN cache hit ratio
```

along with:

```text
origin requests/sec
edge latency
origin latency
cache stale rate
bandwidth
```

If the CDN hit ratio is only:

```text
20%
```

while introducing substantial cost and consistency complexity, it may not justify itself.

If the hit ratio is:

```text
95–99%
```

for highly popular immutable redirects, the economics and performance become dramatically better.

---

# 7.84 Route.io at 100M Users

Our architecture has now evolved into:

```text
                                  Internet
                                     |
                                     v
                              ┌────────────┐
                              │    CDN     │
                              │ Edge Cache │
                              └─────┬──────┘
                                    |
                              Cache MISS
                                    |
                                    v
                            ┌─────────────────┐
                            │  Load Balancer  │
                            └────────┬────────┘
                                     |
                     ┌───────────────┼───────────────┐
                     ▼               ▼               ▼
                  Node.js         Node.js         Node.js
                     │               │               │
                     └───────────────┼───────────────┘
                                     |
                           ┌─────────┴─────────┐
                           │                   │
                           ▼                   ▼
                        Redis              Shard Router
                           │                   │
                           │          ┌────────┼────────┐
                           │          ▼        ▼        ▼
                           │       Shard 0  Shard 1  ... Shard 15
                           │
                           │
                           └──── URL resolution
```

Analytics remains decoupled:

```text
Redirect telemetry
       |
       v
Message Queue
       |
       v
Analytics Consumers
       |
       v
Analytics Storage
```

And the asynchronous product workflows remain separate:

```text
AI Summary
    ↓
Background Worker
    ↓
External AI Provider
    ↓
PostgreSQL

Critical Event
    ↓
Alert Evaluation
    ↓
Notification Worker
    ↓
Email / Webhook / Push
```

---

# 7.85 The Architecture Has Now Become Layered by Workload

This is an important point for your **Route.io interview/project presentation**.

Don't describe the architecture as simply:

> "Route.io has Node.js, Redis, PostgreSQL, Kafka and CDN."

That sounds like a technology shopping list.

Instead explain the architecture as **workload isolation**:

```text
                     ROUTE.IO
                         |
        ┌────────────────┼─────────────────┐
        │                │                 │
        ▼                ▼                 ▼
   Redirect Path    Analytics Path    Async Workflows
        │                │                 │
        ▼                ▼                 ▼
      CDN              Queue          Background Worker
        │                │                 │
        ▼                ▼                 ▼
      Redis         Analytics DB      AI Provider
        │
        ▼
   URL Shards
        │
        ▼
   PostgreSQL
```

Each subsystem exists because a different workload has different requirements.

---

# 7.86 Scale-Tier Summary So Far

|Scale|Workload problem|Component introduced|Approximate new capability|
|---|---|---|---|
|≤100K|Low/moderate workload|Node.js + PostgreSQL|Simple V1|
|~1M|Node.js CPU saturation|Load balancer + horizontal Node.js|~8K peak app QPS under our assumed benchmark|
|~10M|DB read contention|Read replicas|Tens of thousands of reads/sec per replica|
|~10M|Analytics ingestion|Message queue + consumers|Independent analytics throughput|
|~100M|DB scaling domain|Sharding|Parallel URL lookup capacity|
|~100M|Hot-key concentration|Redis|Removes most hot-read traffic from DB|
|~100M+|Origin/network saturation|CDN|Moves high-volume redirects to edge|

These numbers are **illustrative engineering assumptions**, not hard limits. In a real system-design interview, explicitly say that the ceilings must be validated through load testing and production telemetry.

---

# 7.87 What Comes Next for Route.io?

We have addressed the major **redirect path** scaling problems.

The next interesting part is no longer simply "more QPS."

Route.io has three features that create different scaling behavior:

```text
1. AI summarization
2. Critical-event detection
3. Notifications
```

At 100M users, those workflows create a different class of problems.

For example, suppose Route.io processes:

```text
10B redirects/day
```

and generates analytics events for each one.

If critical-event rules evaluate every event individually, we could have:

```text
10B event evaluations/day
```

That makes naive rule evaluation extremely expensive.

And if a viral URL crosses a threshold:

```text
500,000 clicks
within 1 minute
```

we must avoid generating:

```text
500,000 notifications
```

for a single critical event.

So the next architectural bottleneck to investigate is:

> **How do we perform real-time critical-event detection and notification without evaluating every historical event against every alert rule or generating duplicate notifications during traffic spikes?**

That will lead us into **stream aggregation, windowing, idempotency, deduplication, and notification delivery semantics**—but we should only introduce those components after calculating the actual workload.