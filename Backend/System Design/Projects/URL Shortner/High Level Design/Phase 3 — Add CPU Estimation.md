You're right. **CPU time belongs in the back-of-the-envelope calculation**, especially because we're trying to establish actual capacity ceilings rather than only QPS and storage. I omitted it in the first pass.

There is one important distinction, though: **CPU time cannot be calculated from QPS alone**. We need an assumption for CPU work per request, and for Route.io we should calculate the synchronous redirect path separately from analytics parsing, URL creation, AI processing, etc.

## Phase 3 — Add CPU Estimation

For the initial Route.io design, let's make an explicit engineering assumption.

For one redirect request, suppose the Node.js application performs approximately:

```text
Operation                              CPU time
------------------------------------------------
HTTP parsing / framework overhead       0.10 ms
Authentication / basic validation       0.05 ms
shortCode parsing / validation          0.02 ms
URL lookup preparation                  0.03 ms
analytics event construction            0.10 ms
response construction / redirect        0.05 ms
------------------------------------------------
Application CPU                         0.35 ms/request
```

So we'll use:

```text
CPU time per redirect ≈ 0.35 ms
```

This is **CPU execution time**, not end-to-end latency.

That's an important distinction:

```text
Request latency
=
CPU time
+
database/network I/O wait
+
other waiting
```

A request might have only 0.35 ms of actual CPU work but still have 10–20 ms latency because it is waiting for the database.

Node.js makes this distinction particularly important because the JavaScript execution runs on the event loop. **I/O waiting does not consume the event loop continuously**, whereas CPU-heavy synchronous JavaScript does.

---

## Average CPU Demand

We calculated:

```text
Average redirects = 116 requests/sec
CPU/request       = 0.35 ms
```

Therefore:

```text
116 × 0.35 ms
= 40.6 ms of CPU/second
```

Convert that to CPU utilization:

```text
40.6 ms / 1000 ms
≈ 4.1% of one CPU core
```

So the redirect workload itself consumes only approximately:

```text
0.041 CPU cores
```

at average traffic.

That's extremely small.

---

## Peak CPU Demand

Our assumed peak is approximately:

```text
580 redirects/sec
```

Therefore:

```text
580 × 0.35 ms
= 203 ms CPU/second
```

or:

```text
203 / 1000
≈ 20.3%
```

So peak redirect processing would consume approximately:

```text
0.20 CPU cores
```

for the application-level CPU work we have assumed.

This tells us something useful:

> **At 100K users and 10M redirects/day, CPU is nowhere near the first bottleneck.**

If our measurements resemble these assumptions, a single modern Node.js process has plenty of CPU headroom for the redirect workload.

---

# But We Need to Calculate the Other CPU Workloads

Route.io has more than redirects.

Suppose URL creation requires approximately:

```text
CPU/request = 1 ms
```

At peak:

```text
6 writes/sec × 1 ms
= 6 ms CPU/sec
```

That's:

```text
0.6% of one CPU core
```

Again, negligible.

Analytics processing is more interesting.

Suppose eventually we parse/enrich each event with approximately:

```text
CPU/event = 1 ms
```

At:

```text
580 events/sec peak
```

we get:

```text
580 × 1 ms
= 580 ms CPU/sec
```

Therefore:

```text
≈ 58% of one CPU core
```

Now we're getting into meaningful CPU utilization.

But we should be careful: **we shouldn't necessarily perform all of that work synchronously during the redirect**.

If we did:

```text
Browser
   |
   v
Node.js
   |
   +--> DB lookup
   |
   +--> analytics parsing/enrichment
   |
   +--> redirect
```

then analytics CPU work could compete directly with the redirect path.

A better design might eventually be:

```text
Browser
   |
   v
Node.js
   |
   +------------------> redirect
   |
   +------------------> analytics event
                              |
                              v
                         async processing
```

But **we are not introducing a queue yet**.

Why?

Because our current peak analytics workload is only approximately:

```text
580 events/sec
```

and the corresponding CPU assumption is approximately:

```text
0.58 CPU cores
```

A single reasonably sized application server may still handle that.

This is exactly the distinction we're trying to learn: **having a workload does not automatically justify adding a distributed component**.

---

# AI CPU Is a Completely Different Case

AI summarization needs to be separated conceptually.

Suppose Route.io receives:

```text
10,000 summary requests/day
```

That's only:

```text
10,000 / 86,400
≈ 0.116 requests/sec
```

But an individual summary operation might involve:

```text
fetch webpage
parse HTML
extract content
tokenize
call external AI model
process response
store summary
```

The CPU and I/O characteristics are completely different from redirect processing.

The AI model's inference CPU/GPU consumption also should **not be treated as Node.js application CPU** if we're calling an external model API.

Therefore we shouldn't say:

> “Route.io needs X CPU because AI needs X CPU.”

We should model the AI subsystem independently.

---

# Updated Route.io Capacity Picture

Our current numbers now look like this:

```text
ROUTE.IO — 100K USER SCALE

                         Average       Peak
------------------------------------------------
Redirect QPS               116          580
URL creation QPS           1.2            6
Analytics events/sec       116          580

Redirect CPU              4.1%         20.3%
Analytics CPU*             11.6%        58%
URL creation CPU            0.1%         0.6%

* assuming 1 ms CPU/event
```

So the important conclusion is:

**At this scale, neither redirect CPU nor URL-write CPU justifies horizontal scaling.**

Analytics processing _could_ become significant depending on how much enrichment we perform, but we need to measure the actual implementation before introducing another component.

---

# CPU Is Not the Same as Server Capacity

This is another point I'd expect you to articulate in an interview.

Suppose we have:

```text
8-core server
```

and our peak redirect CPU requirement is:

```text
0.20 cores
```

It would be incorrect to say:

> “The server can handle 40× more traffic because it has 8 cores.”

Node.js's primary JavaScript execution model matters. A single Node.js process primarily executes JavaScript on one event-loop thread, although Node can use additional threads for specific workloads through libuv and worker threads.

So for our architecture, we should distinguish:

```text
Server CPU capacity
        ≠
Single Node.js event-loop capacity
```

At production scale, we can use multiple Node.js processes/instances, but **we don't introduce horizontal scaling until the measured workload requires it**.

For now, the CPU calculation tells us something valuable:

```text
100K users
10M redirects/day
580 peak redirects/sec

        ↓

CPU is not the bottleneck.

        ↓

We need to look at
database latency / IOPS / connection limits
before scaling the application tier.
```

That gives us a much stronger basis for Phase 6.

---

# Revised Phase 3 Summary

```text
Metric                         Result
---------------------------------------------------------
Users                          100K
URLs created/day               100K
Redirects/day                  10M
Average write QPS              1.2
Peak write QPS                 6
Average redirect QPS           116
Peak redirect QPS              580
Read : write                   ~100 : 1
URL storage growth             ~18 GB/year raw
Analytics storage growth       ~3.65 TB/year raw
Peak bandwidth                 ~9 Mbps
Redirect CPU/request           ~0.35 ms assumed
Peak redirect CPU              ~0.20 CPU core
Peak analytics CPU*            ~0.58 CPU core
```

The CPU assumptions are **estimates**, not facts. Once Route.io exists, we would replace them with measurements from profiling/load testing: CPU time per request, event-loop utilization, GC time, database wait time, and p50/p95/p99 latency.

---

## Phase 3 Checkpoint

Now I want you to answer the interview question again, incorporating CPU:

> **At 100K users, Route.io has ~580 peak redirects/sec, ~0.20 CPU-core demand for the redirect path, and a roughly 100:1 read/write ratio. If CPU is not the bottleneck, what component would you investigate next, and what specific metric would you measure to prove that it is becoming the bottleneck?**

Give me your reasoning first. Then we'll move to **Phase 4 — API Design**, followed by the minimal V1 architecture.