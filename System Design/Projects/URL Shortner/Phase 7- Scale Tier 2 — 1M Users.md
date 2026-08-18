

We now move from the **100K-user V1 architecture** to the **1M-user tier**.

Our starting architecture is still:

```text
Clients
   |
   v
Node.js Modular Monolith
   |
   v
PostgreSQL
```

with the background worker operating from the same Route.io codebase.

At 100K users, we established that this was sufficient _assuming load testing confirms the latency and resource budgets_. Now we scale the workload by roughly 10×.

## 7.1 Recalculate the Workload

Assuming user behavior remains proportional to the 100K-user model:

|Metric|100K users|1M users|
|---|--:|--:|
|New URLs/day|100K|1M|
|Redirects/day|10M|100M|
|Avg redirect QPS|116|1,157|
|Peak redirect QPS|580|5,785|
|Avg URL writes/sec|1.2|11.6|
|Peak URL writes/sec|6|58|
|Analytics events/day|10M|100M|
|Avg analytics events/sec|116|1,157|
|Peak analytics events/sec|580|5,785|

The read/write ratio remains approximately:

```text
100M redirects/day
------------------
 1M URL writes/day

≈ 100 : 1
```

The workload is still **strongly read-heavy**.

---

# 7.2 CPU Recalculation

Our previous redirect CPU assumption was:

```text
0.35 ms CPU/request
```

At 1M users:

```text
5,785 peak redirects/sec × 0.35 ms
```

Therefore:

```text
5,785 × 0.00035
≈ 2.025 CPU-seconds/second
```

So the redirect workload requires approximately:

```text
≈ 2.0 CPU cores
```

of actual CPU execution at peak.

This is the first major change from V1.

At 100K users:

```text
580 × 0.35 ms
≈ 0.20 CPU cores
```

At 1M:

```text
5,785 × 0.35 ms
≈ 2.0 CPU cores
```

So the CPU demand has crossed from **negligible** to **material**.

But don't jump to the conclusion that we need more Node.js servers yet.

We need to ask:

> **What does the actual Node.js deployment look like, and what does one process's event-loop utilization look like under 5,785 requests/sec?**

A single Node.js process executes JavaScript primarily on one event-loop thread. If our measured CPU work really is ~2 cores at peak, one process cannot sustain that workload while maintaining comfortable event-loop headroom.

However, the exact architectural change should be driven by measurements.

---

# 7.3 Your Bottleneck Prediction

Before I reveal the first architectural change, predict it.

At 1M users we now have:

```text
~5,785 peak redirects/sec
~2 CPU cores of redirect computation
~1,157 average analytics events/sec
~5,785 peak analytics events/sec
```

And the current architecture is:

```text
              ┌──────────────────┐
Clients ────> │ Node.js process  │
              └────────┬─────────┘
                       │
                       v
                ┌─────────────┐
                │ PostgreSQL  │
                └─────────────┘
```

### Interview checkpoint

**What do you predict will break first?**

Choose the most likely bottleneck:

1. **Node.js CPU / event-loop utilization**
    
2. PostgreSQL CPU
    
3. PostgreSQL storage capacity
    
4. PostgreSQL connection limit
    
5. Network bandwidth
    
6. Analytics storage
    
7. Something else
    

And more importantly, tell me **what metric you would inspect to prove it**.

For example, don't just say:

> “Node.js CPU.”

Say something like:

> “I would expect Node.js to become the bottleneck because peak redirect processing requires approximately 2 CPU cores. I would verify this through event-loop utilization, process CPU utilization, p95/p99 redirect latency, and event-loop lag.”

Once you make that prediction, we'll introduce **exactly one architectural change**, calculate its new ceiling, and redraw Route.io's architecture.