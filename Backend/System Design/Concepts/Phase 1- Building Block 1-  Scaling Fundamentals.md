

We will use the **both** track implicitly: the architecture will be production-realistic, but I will continuously expose the reasoning that an interviewer expects you to articulate. We will start with the smallest possible system and add infrastructure only when measured constraints force us to. Our first question is deliberately narrow: **when does one server stop being enough, and should we scale it vertically or horizontally?**

## Step 1 — Scenario Framing

Assume we are building a simple backend API for a product with **100,000 registered users**. Each active user generates an average of **20 API requests per day**, giving us:

[  
100{,}000 \times 20 = 2{,}000{,}000\text{ requests/day}  
]

A day has 86,400 seconds, so the average request rate is:

[  
\frac{2{,}000{,}000}{86{,}400} \approx 23\text{ requests/sec}  
]

Average traffic is only about **23 RPS**, but real systems do not receive requests uniformly. Suppose our peak traffic is 10× the daily average, giving approximately **230 RPS**. For this first design, assume each request requires roughly **20 ms of CPU time** on the application server and that we want to keep CPU utilization below approximately **70%** so that short bursts do not immediately saturate the machine.

There is no previous component yet, so our stopping point is simply the requirement itself: **serve approximately 230 peak RPS reliably**. The disciplined approach is to begin with one machine rather than immediately drawing load balancers, caches, replicas, Kubernetes, or other infrastructure.

---

# Step 2 — Naive Design and Its Failure

The simplest architecture is:

```text
Client
  │
  ▼
Application Server
  │
  ▼
Database
```

The client sends an HTTP request directly to the application server. The application server executes the business logic and communicates with the database, then returns the response. Assume the initial server has **4 CPU cores, 16 GB RAM, and a network interface capable of handling our traffic**, so CPU is the first constraint we will examine rather than inventing failures elsewhere.

At 230 RPS and 20 ms of CPU work per request, the required CPU time is:

[  
230 \times 20\text{ ms} = 4{,}600\text{ ms/sec}  
]

That means the application needs approximately **4.6 CPU-seconds of work every wall-clock second**, or about **4.6 fully utilized CPU cores**. Our 4-core machine therefore cannot sustain the peak workload while maintaining the desired utilization headroom; even before accounting for garbage collection, kernel work, networking, framework overhead, and traffic bursts, CPU is already saturated. The important point is that "the server doesn't scale" is not the diagnosis: **the specific resource constraint is CPU capacity**.

This gives us our first genuine architectural decision. We need more compute capacity, but there are two fundamentally different ways to obtain it: make the existing machine more powerful, or use multiple machines.

---

# Step 3 — The First Scaling Decision

## Layer 1 — Problem It Solves

The current application server has become the bottleneck because its **4 CPU cores cannot provide the approximately 4.6 CPU-cores of work required during peak traffic**. We therefore need to increase available compute capacity. Nothing yet justifies a load balancer, cache, queue, or database sharding; those solve different problems. Our immediate problem is simply **insufficient CPU capacity on one machine**.

There are two direct solutions: **vertical scaling** and **horizontal scaling**. Vertical scaling means increasing the resources of the existing server, such as moving from 4 cores to 8 cores. Horizontal scaling means running multiple application-server instances so that the workload can be distributed across them.

### Layer 2 — Mechanism

**Vertical scaling** changes the capacity of a single machine. If we move from 4 CPU cores to 8 cores, our theoretical CPU capacity approximately doubles, assuming the workload scales efficiently across those cores. At 230 RPS and 20 ms CPU time per request, 8 cores provide substantial headroom, so the immediate problem disappears without changing the application's topology.

**Horizontal scaling** changes the number of machines rather than the size of one machine. For example:

```text
Client
  │
  ▼
Application Server 1
  │
  ▼
Database

Application Server 2
  │
  ▼
Database
```

If each 4-core server can safely handle approximately 160 RPS at our target utilization, two servers provide approximately **320 RPS of aggregate capacity**. The important mechanism is not merely "having two servers"; the requests must actually be distributed between them. That requirement will eventually force us to introduce another component, the **load balancer**, but we will not introduce it yet because the current exercise is to understand _why_ horizontal scaling creates that requirement.

### Layer 3 — Cost

Vertical scaling is operationally simple because the architecture remains essentially unchanged. However, the machine has a **hard physical and economic ceiling**: you cannot indefinitely increase CPU, RAM, network bandwidth, or I/O capacity on one server, and larger machines become increasingly expensive. More importantly, a single application server remains a **single failure domain**; if that machine crashes, the entire application becomes unavailable regardless of how powerful it is.

Horizontal scaling removes the single-machine capacity ceiling because additional machines can be added as demand increases. However, it introduces distributed-system complexity: requests must be distributed across instances, deployments must coordinate multiple processes, and application state can no longer safely live only in one server's memory. **Horizontal scaling buys capacity and eventually availability at the cost of architectural complexity.**

---

## Step 4 — Tradeoff Resolution

For our current scenario, both approaches work, so this is a genuine design fork.

|Dimension|Vertical Scaling|Horizontal Scaling|
|---|---|---|
|Basic mechanism|Bigger machine|More machines|
|Immediate complexity|Low|Higher|
|Capacity growth|Limited by machine size|Can add instances|
|Failure domain|One machine|Multiple machines|
|Application changes|Usually minimal|Often requires stateless design|
|Scaling operation|Replace/resize machine|Add/remove instances|
|Upper bound|Hardware limit|Much higher practical ceiling|
|Current 230 RPS scenario|Easily sufficient with 8 cores|Also sufficient with 2+ instances|

For **230 RPS**, I would initially choose **vertical scaling** if this were genuinely the entire requirement. There is no engineering prize for deploying three servers, a load balancer, service discovery, and orchestration infrastructure when one 8-core machine comfortably handles the workload. The additional infrastructure would increase operational complexity without solving a current problem that actually exists.

However, suppose product growth projections tell us that traffic will reach **2,000 RPS within six months**, and the service is expected to remain available even when one application machine fails. Now the decision changes: horizontal scaling becomes justified because we are no longer optimizing only for today's CPU requirement; we need a capacity model that can grow and a topology that does not make one machine the entire availability boundary.

That distinction is fundamental to system design: **scale because a constraint requires it, not because distributed architecture looks more sophisticated.**

---

# Step 5 — Architecture Evolution

Our initial architecture was:

```text
VERSION 0

Client
  │
  ▼
Application Server
  │
  ▼
Database
```

After identifying CPU saturation, we could vertically scale the application server:

```text
VERSION 1 — VERTICAL SCALING

Client
  │
  ▼
Application Server
  │
  │  8 CPU cores
  │  32 GB RAM
  ▼
Database
```

This is still the same architecture. We have not added a new component; we have simply increased the capacity of an existing one.

If future traffic forces horizontal scaling, the architecture will evolve toward:

```text
VERSION 2 — HORIZONTAL SCALING

                 ┌──► Application Server 1 ──┐
Client ──────────┤                           │
                 └──► Application Server 2 ──┤
                                             ▼
                                          Database
```

Notice what is intentionally **missing**: there is no load balancer in Version 2 yet. We have reached the point where multiple application servers exist, but the mechanism for intelligently directing clients to those servers is itself the next problem. We will introduce that component only when we demonstrate exactly why clients cannot reasonably manage server selection themselves.

The architecture therefore evolves through a chain of forced decisions:

```text
Single Server
     │
     │ CPU saturation
     ▼
Vertical Scaling
     │
     │ Growth / failure requirement
     ▼
Multiple Application Servers
     │
     │ Who decides which server receives a request?
     ▼
[Next: Load Balancing]
```

---

# Step 6 — Active Recall Checkpoint

Do **not** continue to the load balancer yet. I want you to reason through the decision yourself.

### Question 1

Our application currently handles **230 RPS**, requires **20 ms CPU/request**, and runs on a **4-core server**.

**Explain why the server becomes CPU-bound, and calculate approximately how many CPU cores the workload requires.**

### Question 2

Suppose we replace the 4-core server with a **16-core machine**, and that machine can comfortably handle the expected traffic.

**Would you still introduce multiple application servers and a load balancer? Why or why not?**

Answer these in your own words. After that, I will correct the reasoning if necessary, then give you the **deliberate variation task** before we move to Load Balancing.

## Review of Your Reasoning

Your **first answer has the right underlying model**, but there is an important unit error. Your **second answer identifies legitimate reasons for horizontal scaling**, but I would not make horizontal scaling the default choice merely because the machine has 16 cores or because users come from different origins. The interesting part is understanding _when those reasons become strong enough to justify the additional distributed-system complexity_.

### 1. CPU calculation — your reasoning is correct, your units are not

You said:

> 230 × 20 ms = 46,000 CPU seconds

The multiplication is correct structurally, but the conversion is missing:

[  
230 \times 20\text{ ms}  
= 230 \times 0.020\text{ sec}  
= 4.6\text{ CPU-seconds/sec}  
]

So the workload requires approximately **4.6 fully utilized CPU cores**.

A 4-core machine provides:

[  
4\text{ cores} = 4\text{ CPU-seconds/sec}  
]

Therefore:

[  
4.6 > 4  
]

and the application cannot sustain the peak workload at the assumed conditions.

Your additional observation is **exactly the right systems-thinking instinct**. The 20 ms represents application CPU work in our simplified model; the machine also needs CPU time for garbage collection, networking, kernel operations, runtime overhead, TLS, logging, etc. That is why we deliberately targeted roughly 70% utilization rather than designing around 100% utilization.

One subtle point: **4 cores do not mean 40,000 CPU-seconds**. Think of a CPU core as providing approximately **1 CPU-second of computation per wall-clock second**. Therefore, 4 cores provide approximately 4 CPU-seconds of computation every second.

---

# 2. Your horizontal-scaling answer — partially right, but I'd change the decision

Your reasoning was:

> 16 core CPU seems more expensive than managing scale users...

This is the part I would challenge as your staff engineer.

**We should not assume that horizontal scaling is cheaper.** A 16-core machine may actually be cheaper than operating two 8-core machines once you account for additional infrastructure, networking, monitoring, deployment complexity, load balancing, failure handling, and engineering time. The correct question is not "which architecture sounds cheaper?" but **"what constraint are we optimizing for?"**

Suppose our 16-core server costs $200/month.

Two 8-core servers might cost $240/month combined, and now we potentially need:

```text
                    ┌── Application Server 1
Client ── ??? ──────┤
                    └── Application Server 2
```

The `???` is not free. We now need a mechanism to decide where requests go. Eventually that gives us a load balancer:

```text
Client
   │
   ▼
Load Balancer
   │
   ├──────────► Application Server 1
   │
   └──────────► Application Server 2
                    │
                    ▼
                 Database
```

We have gained something valuable, but we have also created new engineering problems.

---

## The Stronger Argument for Horizontal Scaling

Your **second reason**, geographic distribution, is valid _if latency is actually a requirement_.

Suppose our users are distributed across India, Europe, and the United States:

```text
India ────────┐
              │
Europe ───────┼──► Application Infrastructure
              │
USA ──────────┘
```

If all requests must travel to one server in Mumbai, a user in the US may experience substantially higher network latency than a user physically closer to the server. Multiple regional deployments can reduce network round-trip time.

But notice the important reasoning sequence:

**Users are geographically distributed → network latency becomes significant → one region cannot satisfy the latency objective → multiple regions become justified.**

We don't introduce horizontal scaling simply because users have different origins.

---

# My Point of View

For the **specific scenario we created**, I would choose **vertical scaling first**.

We have only:

- 100,000 registered users
    
- ~23 average RPS
    
- ~230 peak RPS
    
- ~20 ms CPU/request
    
- 4.6 CPU-cores required at peak
    

If an 8-core or 16-core machine comfortably handles this workload, introducing multiple servers would be premature.

My reasoning would be:

> "The current bottleneck is CPU. A larger machine removes the bottleneck without introducing distributed-system complexity. Until we have a requirement for capacity beyond the machine's practical limit, high availability, independent scaling, geographic distribution, or another constraint that one machine cannot satisfy, horizontal scaling is unnecessary."

That is a **stronger system-design answer** than simply saying "horizontal scaling is better."

---

# But Now Let's Force the Decision to Change

This is where system design becomes interesting.

Imagine our product grows from:

[  
100,000\ users \rightarrow 10,000,000\ users  
]

and peak traffic grows from:

[  
230\ RPS \rightarrow 5,000\ RPS  
]

Suppose our largest practical application machine can provide **32 CPU cores**.

At 20 ms CPU/request:

[  
5,000 \times 0.020 = 100\ CPU\text{-seconds/sec}  
]

We therefore need approximately:

[  
100\ CPU\ cores  
]

A single 32-core machine cannot provide that capacity.

Now vertical scaling has encountered a **hard capacity boundary**.

We could use:

[  
4 \times 32\text{-core servers}  
]

giving approximately:

[  
128\ CPU\ cores  
]

Now horizontal scaling isn't an architectural preference. **The workload physically exceeds the capacity of the largest practical machine.**

And we have just earned our next component.

---

# Deliberate Variation Task

Consider this modified scenario:

> The application receives **1,000 RPS**, each request requires **10 ms of CPU time**, and a single **16-core server** can comfortably handle the workload. However, the business requires **99.99% availability**, meaning a single server failure must not take the service offline.

You now have to decide:

**Would you still use one 16-core server, or would you introduce multiple application servers?**

More importantly, explain **what specific failure or requirement forces your decision**.

Don't tell me merely "horizontal scaling is better." Identify the constraint, just as we did with CPU saturation.