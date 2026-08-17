# Route.io — System Design Session

We’ll start from the beginning and treat this as a **system-design interview + real project presentation**. I’ll assume **Profile B** unless you override it, because it gives us enough traffic to make the scaling decisions meaningful without jumping immediately into hyperscale architecture.

Our target progression will be:

```text
10K users
   ↓
100K users
   ↓
1M users
   ↓
10M users
   ↓
100M+ users
```

The important constraint is that **we will not design the 100M-user architecture upfront**. We will start with the smallest architecture that satisfies the requirements and evolve it only when the numbers demonstrate a bottleneck.

---

# Phase 1 — Problem Definition

## What is Route.io?

Route.io is a URL-shortening platform that converts long destination URLs into compact, shareable URLs and redirects visitors to the original destination.

For example:

```text
Original URL
https://example.com/products/category/backend-engineering/nodejs

                    ↓

Route.io

                    ↓

Short URL
https://route.io/aB72kP
```

When somebody accesses `https://route.io/aB72kP`, Route.io resolves `aB72kP` to the destination and returns an HTTP redirect.

The platform additionally provides **analytics, AI-generated summaries, and critical-event notifications** around those URLs.

The key architectural observation is that Route.io actually contains several different workloads:

```text
                         Route.io
                            |
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    URL Resolution      Analytics          AI / Events
          │                 │                 │
      latency-critical   write-heavy      asynchronous
          │                 │                 │
          ▼                 ▼                 ▼
       Redirect       Click events      Summarization
                                           +
                                       Notifications
```

The redirect path is our **highest-priority path** because it directly determines whether a visitor successfully reaches the destination.

---

# Phase 2 — Requirements Analysis

## Functional Requirements

### 1. URL creation

A user can submit a destination URL:

```text
POST /api/v1/urls
```

and receive:

```text
https://route.io/aB72kP
```

The system must guarantee that the generated short code maps to the intended destination.

### 2. URL redirection

A visitor requests:

```text
GET /aB72kP
```

Route.io resolves the mapping and returns:

```text
HTTP 302
Location: https://example.com/...
```

This is the **critical path**.

### 3. URL management

Authenticated users should be able to:

```text
Create URL
Get URL
List URLs
Update URL
Disable URL
Delete URL
```

We will also support optional expiration:

```text
expiresAt
```

If the current timestamp exceeds `expiresAt`, the redirect should no longer succeed.

### 4. Custom aliases

Instead of:

```text
route.io/aB72kP
```

a user can optionally request:

```text
route.io/nodejs
```

The alias must be globally unique.

This is an **optional V1 capability**, but we'll include it in the data model because it is inexpensive to support initially.

### 5. Analytics

For every redirect, Route.io should be able to capture information such as:

```text
timestamp
URL ID
IP-derived geography
country
device
browser
operating system
referrer
user agent
```

From this raw event data we can derive:

```text
total clicks
unique visitors
clicks over time
top countries
devices
browsers
referrers
```

### 6. AI summarization

A user can request a summary of the destination associated with a URL.

The important design point is that this does **not** belong on the redirect path.

Conceptually:

```text
POST /api/v1/urls/:id/summary

        ↓

202 Accepted

        ↓

summary processing

        ↓

completed / failed
```

The user should not have to wait for external content retrieval and AI inference before the API responds.

### 7. Critical-event detection

Route.io should support rules such as:

```text
"Notify me if this URL receives >10,000 clicks/hour."

"Notify me if traffic increases by >500%."

"Notify me 24 hours before a URL expires."
```

These are examples. We will determine later which ones belong in the initial implementation.

### 8. Notifications

When a configured critical event occurs, Route.io can deliver a notification.

For example:

```text
Critical Event
      ↓
Traffic threshold exceeded
      ↓
Notification
      ↓
User
```

Email, webhook, or other channels can be treated as extensible notification mechanisms.

---

# Non-Functional Requirements

These are where the system-design reasoning starts becoming interesting.

|Requirement|Target|Reason|
|---|--:|---|
|Redirect availability|**99.99%**|Redirect failure directly breaks the product|
|Redirect p95 latency|**<100 ms**|Visitor is waiting for the destination|
|URL creation p95|**<300 ms**|Interactive API operation|
|Analytics freshness|**<60 sec**|Dashboard doesn't require synchronous click processing|
|URL durability|**99.999%+**|Losing mappings permanently breaks URLs|
|Analytics durability|**No intentional loss**|Analytics is a core product capability|
|AI summary latency|**Seconds/minutes acceptable**|Not user-blocking|
|Notification processing|**At-least-once**|Missing a critical event is unacceptable|
|Authentication|Required|Users own URLs and analytics|
|Abuse protection|Required|URL shorteners are commonly abused for spam/phishing|

Notice the distinction between **availability and latency requirements for different workloads**.

A redirect with 500 ms latency might technically succeed, but it creates a poor user experience because every click pays that cost.

An AI summary taking 20 seconds is completely different. The API can immediately return a processing state and let the expensive operation happen asynchronously.

That difference will eventually determine why these workloads cannot simply be treated as one synchronous Node.js request pipeline.

---

# Phase 3 — Scale Estimation

Now we establish the workload.

For this session, we'll use:

```text
Registered users       = 100,000
New URLs/day           = 100,000
Redirects/day          = 10,000,000
```

We'll assume:

```text
Average traffic = daily traffic / 86,400
Peak traffic    = 5 × average traffic
```

The 5× factor is an explicit assumption rather than a universal constant. Real production systems would derive peak factors from observed traffic distributions.

---

## 3.1 Write QPS

We create:

```text
100,000 URLs/day
```

Therefore:

```text
100,000 / 86,400
≈ 1.16 writes/sec
```

So average URL-creation traffic is approximately:

```text
WRITE QPS ≈ 1.2
```

Peak at 5×:

```text
1.16 × 5
≈ 5.8 writes/sec
```

So even our peak URL-creation workload is only approximately:

```text
6 writes/sec
```

That is a very small write workload.

---

## 3.2 Redirect Read QPS

Now look at redirects:

```text
10,000,000 redirects/day
```

Therefore:

```text
10,000,000 / 86,400
≈ 115.7 redirects/sec
```

So:

```text
READ QPS ≈ 116
```

Peak:

```text
115.7 × 5
≈ 578.5
```

Therefore our assumed peak redirect workload is:

```text
≈ 580 redirects/sec
```

Now calculate the read/write ratio:

```text
116 reads/sec
----------------
1.16 writes/sec

≈ 100 : 1
```

This is the first extremely important number in Route.io.

> **Route.io is approximately a 100:1 read-heavy system at this scale.**

That ratio will heavily influence our database and caching decisions later.

---

# 3.3 Analytics Event Rate

Every redirect can generate an analytics event.

Therefore:

```text
10M redirects/day
≈ 10M analytics events/day
```

Average:

```text
≈ 116 events/sec
```

Peak:

```text
≈ 580 events/sec
```

This gives us an important architectural distinction:

```text
Redirect workload
≈ 116 reads/sec average

Analytics workload
≈ 116 events/sec average
```

At this scale, those numbers are not large enough to force a distributed event-processing architecture.

That is important.

**We will not introduce Kafka merely because Route.io has analytics.**

At this scale, a simpler mechanism may be sufficient. We'll prove that when we reach the architecture phase.

---

# 3.4 Storage Estimation

Assume one URL record is approximately:

```text
500 bytes
```

This includes the practical database representation of fields such as:

```text
id
shortCode
destinationUrl
userId
createdAt
expiresAt
status
metadata
```

At:

```text
100,000 URLs/day
```

we create:

```text
100,000 × 365
=
36,500,000 URLs/year
```

Raw URL-record storage:

```text
36.5M × 500 bytes
≈ 18.25 GB/year
```

So:

```text
URL mapping data ≈ 18 GB/year
```

That is _raw logical data_. Real database storage will be higher because of indexes, tuple/page overhead, WAL, replication, backups, and other metadata.

---

# 3.5 Analytics Storage

Analytics is much larger.

Assume each raw click event consumes approximately:

```text
1 KB
```

Then:

```text
10M events/day × 1 KB
≈ 10 GB/day
```

Annual:

```text
10 GB × 365
≈ 3.65 TB/year
```

So we have:

```text
URL mappings:
≈ 18 GB/year

Analytics events:
≈ 3.65 TB/year
```

This is our first significant storage observation.

**The URL mapping table is small. Raw analytics data is the storage-heavy workload.**

That distinction will become important when we decide whether both datasets should live and scale identically.

---

# 3.6 Bandwidth

Assume an average redirect response/request overhead of approximately:

```text
2 KB
```

Then:

```text
10M redirects/day × 2 KB
≈ 20 GB/day
```

Average network traffic:

```text
20 GB / 86,400
≈ 231 KB/sec
```

Approximately:

```text
≈ 1.85 Mbps
```

This is tiny for a modern server.

Even at our assumed 5× peak:

```text
≈ 9.3 Mbps
```

So **bandwidth is not currently our bottleneck**.

This is exactly why we don't immediately introduce a CDN.

A CDN may eventually become valuable for global latency or extremely high redirect volume, but our current numbers do not justify it.

---

# Scale Calculation Summary

```text
ROUTE.IO — INITIAL SCALE

Registered users
        100,000

New URLs
        100,000/day
        ≈ 1.2 writes/sec average
        ≈ 6 writes/sec peak

Redirects
        10,000,000/day
        ≈ 116 reads/sec average
        ≈ 580 reads/sec peak

Read : Write
        ≈ 100 : 1

Analytics
        10M events/day
        ≈ 116 events/sec average
        ≈ 580 events/sec peak

URL storage
        ≈ 18 GB/year raw

Analytics storage
        ≈ 3.65 TB/year raw

Peak network bandwidth
        ≈ 9 Mbps
```

These numbers are now the **constraints against which we judge architecture**.

---

# Interview Checkpoint #1

Imagine I ask you in an interview:

> **“Given that Route.io has approximately 116 redirect reads/sec and only 1.2 URL-creation writes/sec, what does the 100:1 read/write ratio tell you about the system, and what architectural consequence would you expect from that ratio?”**

Don't tell me the technology yet.

I want you to reason from the numbers:

**What do you think will become the first important bottleneck as Route.io grows from 100K users toward 1M users?**