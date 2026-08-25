

The first bottleneck I would investigate is **Node.js application CPU and event-loop utilization**. At 1M users, our estimated peak redirect workload is ~5,785 requests/sec, and with the previously assumed 0.35 ms of CPU work per redirect, that is approximately **2.0 CPU cores of application work** at peak.

That does not mean PostgreSQL is automatically fine. We still need to measure it. But the Node.js tier has now crossed a fundamentally different threshold: a single Node.js process cannot provide comfortable event-loop headroom if its JavaScript workload requires roughly two cores of CPU.

## 7.4 Proving the Bottleneck

Suppose load testing at 5,785 peak redirects/sec produces:

```text
Node.js process CPU       ≈ 95%
Event-loop utilization    ≈ 90–95%
Event-loop lag             > 20 ms
Redirect p95               ≈ 130 ms

PostgreSQL CPU             ≈ 55%
DB lookup p95              ≈ 8 ms
DB connections             ≈ 35%
```

Now we have strong evidence.

The database isn't currently showing resource saturation. The Node.js process is.

The important observation is:

```text
5,785 requests/sec
        ↓
~2 CPU cores required
        ↓
single Node.js process
        ↓
event-loop saturation
        ↓
redirect latency violates <100 ms
```

This is the numerical justification for our next architectural change.

---

# 7.5 Architectural Change #1 — Horizontal Node.js Scaling

The **one and only change** at this step is:

> Replace the single Node.js application instance with multiple identical Node.js instances behind a load balancer.

We are not adding Redis.

We are not adding a read replica.

We are not introducing Kafka.

We are solving **one problem: application-tier CPU saturation**.

The architecture becomes:

```text
                         Internet
                            |
                            v
                    ┌────────────────┐
                    │ Load Balancer  │
                    └───────┬────────┘
                            |
                ┌───────────┼───────────┐
                │           │           │
                v           v           v
          ┌─────────┐ ┌─────────┐ ┌─────────┐
          │ Node.js │ │ Node.js │ │ Node.js │
          │ Instance│ │ Instance│ │ Instance│
          │    #1   │ │    #2   │ │    #3   │
          └────┬────┘ └────┬────┘ └────┬────┘
               │           │           │
               └───────────┼───────────┘
                           │
                           v
                    ┌─────────────┐
                    │ PostgreSQL  │
                    └─────────────┘
```

Every Node.js instance contains the same Route.io modular-monolith code.

There is no requirement for application-local state because the authoritative state is in PostgreSQL.

---

# 7.6 Why the Load Balancer Is Necessary

Suppose each Node.js instance can comfortably sustain approximately:

```text
2,000 peak requests/sec
```

while maintaining the redirect latency SLO.

Our target is:

```text
5,785 peak requests/sec
```

Therefore:

```text
5,785
──────
2,000

≈ 2.9 instances
```

So we need at least **3 application instances** under this assumption.

Their theoretical capacity becomes:

```text
3 × 2,000
= 6,000 peak requests/sec
```

Our workload:

```text
5,785 peak requests/sec
```

Therefore:

```text
capacity ≈ 6,000
demand   ≈ 5,785
```

We have only about:

```text
6,000 - 5,785
= 215 requests/sec
```

of theoretical headroom.

That's too little operational margin.

In production, I would therefore probably provision **4 instances**:

```text
4 × 2,000
= 8,000 peak requests/sec
```

giving:

```text
8,000 - 5,785
= 2,215 requests/sec
```

of capacity headroom.

This is roughly:

```text
27.7% utilization
```

of the theoretical aggregate capacity at this assumed benchmark.

The exact instance count must ultimately come from load testing rather than this illustrative 2,000-QPS assumption.

---

# 7.7 What the Load Balancer Actually Does

The load balancer receives:

```text
GET /abc123
```

and chooses one healthy Node.js instance:

```text
Request 1 → Node #1
Request 2 → Node #3
Request 3 → Node #2
Request 4 → Node #1
...
```

The important property is:

```text
Node #1
Node #2
Node #3
Node #4
```

are **stateless application instances**.

Any instance can process any request.

For example:

```text
GET /abc123
```

can hit Node #1.

The next request:

```text
GET /abc123
```

can hit Node #4.

Both obtain the authoritative URL mapping from PostgreSQL.

This is why horizontal scaling works cleanly here.

---

# 7.8 What We Have Solved

Before:

```text
5,785 peak requests/sec
        ↓
single Node.js process
        ↓
CPU/event-loop saturation
        ↓
p95 > 100 ms
```

After:

```text
5,785 peak requests/sec
        ↓
load balancer
        ↓
multiple Node.js instances
        ↓
CPU workload distributed
        ↓
event-loop utilization decreases
```

We have solved **application CPU saturation**.

---

# 7.9 New Scale Ceiling

Under our illustrative benchmark:

```text
One Node.js instance
≈ 2,000 peak requests/sec
```

With four instances:

```text
4 × 2,000
≈ 8,000 peak requests/sec
```

Therefore our new architectural ceiling is approximately:

```text
≈ 8,000 peak requests/sec
```

_assuming PostgreSQL continues to handle the corresponding workload and the application instances maintain the latency SLO._

Our current requirement is:

```text
≈ 5,785 peak redirects/sec
```

So the architecture now has meaningful headroom.

---

# 7.10 Cost of This Change

Horizontal application scaling is not free.

We introduced:

|Cost|Consequence|
|---|---|
|Load balancer|Additional infrastructure and operational cost|
|Multiple Node.js instances|More compute cost|
|Deployment complexity|Every instance must run the same version|
|Observability|Logs/metrics must be aggregated across instances|
|Health checks|Failed instances must be removed from rotation|
|Statelessness requirement|Application state cannot depend on local memory|
|Connection multiplication|Each Node.js instance creates DB connections|

That last point is particularly important.

Suppose each Node.js instance maintains:

```text
50 PostgreSQL connections
```

With four instances:

```text
4 × 50
= 200 database connections
```

So **horizontal application scaling moves us closer to another potential bottleneck: PostgreSQL connections**.

But we do not introduce a connection pooler yet.

Why?

Because we haven't demonstrated that connection count is actually the next bottleneck.

---

# 7.11 Updated Architecture

Our 1M-user Route.io architecture is now:

```text
                              Internet
                                 |
                                 v
                       ┌──────────────────┐
                       │   Load Balancer  │
                       └────────┬─────────┘
                                |
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             v                  v                  v
       ┌───────────┐      ┌───────────┐      ┌───────────┐
       │ Node.js   │      │ Node.js   │      │ Node.js   │
       │ Instance 1│      │ Instance 2│      │ Instance 3│
       └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
             │                  │                  │
             └──────────────────┼──────────────────┘
                                |
                                v
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │                 │
                       │ users           │
                       │ urls            │
                       │ click_events    │
                       │ summaries       │
                       │ alert_rules     │
                       │ critical_events │
                       │ notifications   │
                       └─────────────────┘
```

The background worker remains part of the Route.io codebase. We haven't changed the analytics, AI, or notification architecture yet.

---

# 7.12 Interview Explanation

If an interviewer asks:

> **"Why did you introduce a load balancer at 1M users?"**

A strong answer is:

> "At 1M users, assuming traffic scales proportionally, Route.io reaches approximately 5,785 peak redirects per second. With an estimated 0.35 ms of CPU work per redirect, that requires roughly two CPU cores of application execution at peak. Load testing showed the single Node.js process reaching approximately 95% CPU and high event-loop utilization while PostgreSQL remained at roughly 55% CPU with low indexed lookup latency. Therefore, the measured bottleneck is the application tier, so I horizontally scale the stateless Node.js application behind a load balancer. I would provision enough instances to maintain headroom rather than operating at the theoretical maximum."

That's much stronger than:

> "At 1M users we need a load balancer because that's standard."

---

# 7.13 The Next Bottleneck Is Yours to Predict

We now have:

```text
1M users
100M redirects/day
~5,785 peak redirects/sec
4 Node.js instances
~8,000 assumed aggregate application capacity
Single PostgreSQL instance
```

The architecture is now:

```text
                  Load Balancer
                       |
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Node #1       Node #2      Node #3 ...
          │            │            │
          └────────────┼────────────┘
                       ▼
                  PostgreSQL
```

Now imagine Route.io grows another **10×**, from 1M to **10M users**, while user behavior remains proportional.

The workload becomes approximately:

```text
10M users
1,000,000 URLs/day
1 billion redirects/day
~11,574 average redirects/sec
~57,850 peak redirects/sec
~11,574 average analytics events/sec
~57,850 peak analytics events/sec
```

And this time, **do not assume the next bottleneck is Node.js**. We already solved that class of bottleneck by horizontally scaling the application.

### Your next prediction

At approximately **57,850 peak redirects/sec**, with multiple stateless Node.js instances but still **one PostgreSQL primary**, what do you expect to break first?

Focus on:

```text
PostgreSQL CPU
PostgreSQL IOPS
PostgreSQL connections
PostgreSQL storage
Database query latency
Analytics writes
Network
Something else
```

Give me **one bottleneck + one metric that would prove it**. Then we'll introduce exactly one architectural change and calculate its new ceiling.