Understood. From now on, every recall or variation checkpoint will be **self-contained**: I will include all required numbers, assumptions, and the exact scenario in the question itself, so you can reason without reconstructing missing context from previous messages.

We have established the first scaling principle: **vertical scaling is the simplest response when one machine has enough practical capacity; horizontal scaling becomes necessary when a single machine cannot provide the required capacity or when availability/geographic requirements make one machine insufficient.** Now we can move to the next constraint that horizontal scaling creates.



## Step 1 — Scenario Framing

Our previous design ended with a service that may need multiple application servers. Consider a concrete production scenario: the API now receives **5,000 peak RPS**, each request requires approximately **20 ms of CPU time**, and a 32-core server can safely handle around **1,500 RPS** while maintaining our desired CPU headroom. A single server therefore cannot handle the workload, because 5,000 RPS exceeds its safe capacity of 1,500 RPS, so we deploy **four application servers**, giving us approximately 6,000 RPS of aggregate capacity.

Our architecture has therefore evolved from the single-server design into:

```text
VERSION 2 — MULTIPLE APPLICATION SERVERS

                         ┌──► Application Server 1
                         │
Client ──────────────────┼──► Application Server 2
                         │
                         ├──► Application Server 3
                         │
                         └──► Application Server 4
                                      │
                                      ▼
                                   Database
```

We have solved the **capacity problem**, but we have deliberately created a new problem: the client needs to know which server should receive each request. If clients randomly choose servers, one server could receive 2,500 RPS while another receives only 500 RPS, even though the aggregate infrastructure has enough capacity. Worse, if Application Server 3 crashes, clients that still send requests to it receive failures unless they have their own reliable health-detection and retry logic.

This is the exact point where a **load balancer** earns its place in the architecture.

---

# Step 2 — Naive Design and Its Failure

Without a load balancer, we could expose every application server directly to clients:

```text
                    ┌──► App Server 1
                    │
                    ├──► App Server 2
Client ─────────────┼──► App Server 3
                    │
                    └──► App Server 4
```

One naive approach would be to give clients a list of all four servers and let them select one. This looks simple, but it pushes infrastructure responsibility into every client implementation. A browser, mobile application, third-party integration, and internal service would all need to understand which servers are healthy, how traffic should be distributed, when a server has been removed, and what to do when a request fails.

Consider an even simpler approach: DNS returns four server addresses and clients effectively distribute requests among them. Suppose the intended distribution is roughly 1,250 RPS per server, but Server 3 fails. Existing DNS information may continue directing clients toward that server until the DNS record expires from caches. During that interval, requests routed to Server 3 fail even though Servers 1, 2, and 4 have enough spare capacity to process them.

The deeper problem is that **traffic distribution and server health are infrastructure concerns**, but we have currently forced every client to solve them independently. We need a component sitting between clients and application servers that has a current view of backend health and can make the routing decision for every request.

---

# Step 3 — Load Balancer

## Layer 1 — Problem It Solves

A **load balancer** is a component that receives incoming requests and selects one backend server to handle each request. It solves two closely related problems created by horizontal scaling: **traffic distribution** and **backend failure handling**. Instead of every client knowing about four application servers, the client knows about one endpoint, while the load balancer maintains knowledge of the backend pool.

Our architecture becomes:

```text
VERSION 3 — LOAD BALANCING

Client
  │
  ▼
Load Balancer
  │
  ├──► Application Server 1
  ├──► Application Server 2
  ├──► Application Server 3
  └──► Application Server 4
              │
              ▼
           Database
```

The client therefore sees one logical service endpoint even though the service is physically implemented by multiple machines. This abstraction is important: **horizontal scaling should not require every client to understand the topology of your backend.**

---

## Layer 2 — Mechanism

The load balancer maintains a pool of backend servers and applies a **routing algorithm** to choose where each request goes. A simple algorithm is **round robin**, where requests are distributed sequentially across servers:

```text
Request 1 → Server 1
Request 2 → Server 2
Request 3 → Server 3
Request 4 → Server 4
Request 5 → Server 1
Request 6 → Server 2
...
```

With four equally capable servers and 4,000 requests arriving over a period, round robin attempts to send approximately **1,000 requests to each server**. This is useful when servers have similar capacity and requests have approximately similar computational cost.

Another common strategy is **least connections**, where the load balancer sends a new request to the backend currently handling the fewest active connections. This becomes useful when request duration varies significantly. For example, if Server 1 currently has 100 long-running requests while Server 2 has only 20 short requests, sending the next request to Server 1 merely because it is "next" in the round-robin sequence may produce poor utilization.

The load balancer also performs **health checks**. For example, it might periodically send:

```http
GET /health
```

to each backend. If Server 3 stops responding successfully, the load balancer removes it from the active backend pool:

```text
Client
  │
  ▼
Load Balancer
  │
  ├──► Server 1
  ├──► Server 2
  │
  └──► Server 4

       Server 3
          X
       unhealthy
```

The clients do not need to know that Server 3 failed. The load balancer absorbs that infrastructure failure and continues routing traffic to healthy servers.

---

# Layer 3 — Cost

The load balancer solves an important problem, but it introduces several costs. First, every request now travels through an additional network hop, adding some latency and consuming network resources. Second, the load balancer itself becomes a component that must remain highly available; if we deploy only one load-balancer instance and it crashes, we have simply moved our single point of failure from the application server to the load balancer.

There is also routing complexity. If application servers are completely **stateless**, routing is straightforward because any server can handle any request. If application state is stored in one server's memory, however, we may need **session affinity**, also called sticky sessions, where the load balancer repeatedly routes a particular client to the same backend. That can make failures and scaling harder, so we should not introduce sticky sessions unless the application actually requires them.

The load balancer therefore gives us a powerful abstraction, but it is not free infrastructure. We traded **client-side topology management and poor failure handling** for **an additional network hop, operational infrastructure, and routing complexity**.

---

# Step 4 — Routing Algorithm Tradeoff

There is no universally correct load-balancing algorithm. The correct choice depends on the behavior of our workload.

|Algorithm|Mechanism|Good fit|Main limitation|
|---|---|---|---|
|Round robin|Rotate through servers sequentially|Similar servers, similar request cost|Ignores current server load|
|Weighted round robin|Servers receive traffic proportional to assigned weights|Servers have different capacities|Static weights may become inaccurate|
|Least connections|Choose server with fewest active connections|Long/variable request durations|Requires connection-state tracking|
|IP hash|Hash client IP to select backend|Some session affinity requirements|Uneven distribution is possible|
|Consistent hashing|Map keys onto a hash ring|Key-based routing / distributed state|More complex than simple balancing|

For our current API, assume all four servers have **identical hardware** and requests have relatively uniform processing times. I would choose **round robin** because its simplicity matches the problem. Introducing least-connections logic would add complexity without a demonstrated need.

But imagine our API has requests ranging from **5 ms to 5 seconds**. Now a server that received several long-running requests could become overloaded even though round robin continues sending it the same number of new requests. In that scenario, the workload itself has changed the tradeoff, and **least connections** becomes a stronger candidate.

This is the pattern I want you to internalize: **the algorithm follows the workload characteristics; you do not memorize "round robin = load balancing."**

---

# Step 5 — Updated Architecture

Our architecture has now evolved cleanly:

```text
VERSION 0
Single Server

Client
  │
  ▼
Application Server
  │
  ▼
Database
```

CPU saturation forced us to scale the application horizontally:

```text
VERSION 1
Multiple Servers

                 ┌──► Application Server 1
                 │
Client ──────────┼──► Application Server 2
                 │
                 ├──► Application Server 3
                 │
                 └──► Application Server 4
                              │
                              ▼
                           Database
```

Multiple servers created the routing and health problem, which forced the load balancer:

```text
VERSION 2
Load Balanced

Client
  │
  ▼
Load Balancer
  │
  ├──► Application Server 1
  ├──► Application Server 2
  ├──► Application Server 3
  └──► Application Server 4
              │
              ▼
           Database
```

The causal chain is now:

```text
CPU capacity exceeded
        │
        ▼
Horizontal scaling
        │
        ▼
Multiple application servers
        │
        │ Who receives each request?
        │ What happens when one fails?
        ▼
Load balancer
        │
        ▼
Traffic distribution + health-aware routing
```

That is the architecture evolution you should be able to reconstruct without memorizing the diagram.

---

# Step 6 — Active Recall Checkpoint

Answer these **self-contained** questions before we proceed.

### Question 1 — Why is the load balancer necessary?

A service has **4 application servers**, each capable of safely processing **1,500 RPS**. The service receives **5,000 peak RPS**. Without a load balancer, clients are given the addresses of all four servers directly.

**What specific problems can occur with this architecture, and what does the load balancer solve?**

### Question 2 — Choose the algorithm

A service has **4 identical application servers**. Every request takes approximately **20 ms**, and request durations are highly consistent.

The service receives **4,000 RPS**.

You can choose:

- Round robin
    
- Least connections
    
- IP hash
    

**Which would you choose, and why would the other two be unnecessary for this scenario?**

Answer both in your own words. Then I will challenge your reasoning with a **deliberate variation involving uneven request durations and a failed server** before we move to the next building block.