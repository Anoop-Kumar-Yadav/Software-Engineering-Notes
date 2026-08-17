# Route.io — Phase 4: API / Interface Design

Since the scale calculation shows that Route.io is **read-heavy and CPU-light at the initial scale**, we now define the API contract that the architecture must satisfy.

For an interview, I would explicitly say:

> “Before choosing the database or infrastructure, I want to define the operations the system needs to support. The API contract gives us the access patterns, and those access patterns will drive the data model and eventually the storage architecture.”

We will use `/api/v1` for authenticated application APIs. The redirect endpoint is intentionally outside that namespace because it is a public, latency-sensitive path.

---

## 4.1 Create Short URL

```http
POST /api/v1/urls
Authorization: Bearer <token>
Content-Type: application/json

{
  "destinationUrl": "https://example.com/articles/system-design",
  "customAlias": "system-design",
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

Response:

```http
201 Created
```

```json
{
  "id": "url_01JXYZ",
  "shortCode": "system-design",
  "shortUrl": "https://route.io/system-design",
  "destinationUrl": "https://example.com/articles/system-design",
  "expiresAt": "2027-01-01T00:00:00Z",
  "status": "active",
  "createdAt": "2026-08-14T00:00:00Z"
}
```

`customAlias` and `expiresAt` are optional. If `customAlias` is omitted, Route.io generates a unique short code.

The important backend requirement is **uniqueness**. We cannot simply check whether an alias exists and then insert because two concurrent requests could both observe that it is available. The database must enforce uniqueness.

---

# 4.2 Redirect

```http
GET /system-design
```

The response is:

```http
302 Found
Location: https://example.com/articles/system-design
```

This endpoint has no authentication requirement.

The conceptual execution path is:

```text
GET /system-design
        |
        v
Extract shortCode
        |
        v
Resolve URL mapping
        |
        +---- expired? ----> 410 Gone
        |
        +---- disabled? ---> 404/410
        |
        v
Create analytics event
        |
        v
302 Redirect
```

There is an important design question here:

**Should analytics recording happen before or after the redirect?**

We should not make the user wait for a complete analytics database transaction if our requirement says redirect p95 must remain under 100 ms.

Therefore, the eventual architecture should make analytics **non-blocking**.

But notice that I am not yet saying “use Kafka.”

The API requirement tells us **what** must happen. The scale calculation will determine **how** we implement it.

---

# 4.3 Get URL

```http
GET /api/v1/urls/:urlId
Authorization: Bearer <token>
```

Response:

```json
{
  "id": "url_01JXYZ",
  "shortCode": "system-design",
  "shortUrl": "https://route.io/system-design",
  "destinationUrl": "https://example.com/articles/system-design",
  "status": "active",
  "expiresAt": "2027-01-01T00:00:00Z",
  "createdAt": "2026-08-14T00:00:00Z"
}
```

---

# 4.4 List User URLs

```http
GET /api/v1/urls?page=1&limit=20
Authorization: Bearer <token>
```

Response:

```json
{
  "data": [
    {
      "id": "url_01JXYZ",
      "shortCode": "system-design",
      "destinationUrl": "https://example.com/articles/system-design",
      "status": "active",
      "createdAt": "2026-08-14T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 137
  }
}
```

This gives us an important data-access pattern:

```text
User → many URLs
```

We'll need an efficient lookup by `userId`, not just by `shortCode`.

---

# 4.5 Update URL

```http
PATCH /api/v1/urls/:urlId
Authorization: Bearer <token>
```

Example:

```json
{
  "destinationUrl": "https://example.com/new-location",
  "expiresAt": "2027-06-01T00:00:00Z"
}
```

We should be careful about changing `shortCode`.

For V1, I recommend:

```text
shortCode = immutable
destinationUrl = mutable
expiresAt = mutable
status = mutable
```

Why?

The short URL itself becomes an externally shared identifier. Changing the destination is straightforward, while changing the identifier introduces alias reservation, cache invalidation, and potentially confusing historical analytics semantics.

---

# 4.6 Disable / Delete URL

Rather than immediately physically deleting a URL, I recommend a logical status:

```text
active
disabled
expired
deleted
```

For example:

```http
POST /api/v1/urls/:urlId/disable
```

This gives us operational control without immediately destroying historical analytics relationships.

Physical deletion can be treated as a separate lifecycle/retention concern.

---

# 4.7 Analytics

We need two different API categories because raw events and aggregated analytics have different access patterns.

### Analytics summary

```http
GET /api/v1/urls/:urlId/analytics
    ?from=2026-08-01
    &to=2026-08-14
    &interval=day
```

Response:

```json
{
  "urlId": "url_01JXYZ",
  "totalClicks": 183421,
  "uniqueVisitors": 92413,
  "series": [
    {
      "timestamp": "2026-08-13T00:00:00Z",
      "clicks": 18231
    }
  ]
}
```

### Analytics breakdown

```http
GET /api/v1/urls/:urlId/analytics/breakdown?dimension=country
```

Possible dimensions:

```text
country
device
browser
os
referrer
```

This distinction will matter later because **querying 3.65 TB of raw click events for every dashboard request would be a poor architecture**.

Again, we're not introducing an analytics database yet. We're simply identifying the access pattern.

---

# 4.8 Request AI Summary

```http
POST /api/v1/urls/:urlId/summary
Authorization: Bearer <token>
```

Response:

```http
202 Accepted
```

```json
{
  "summaryId": "summary_01JABC",
  "status": "processing"
}
```

Then:

```http
GET /api/v1/urls/:urlId/summary
```

Response:

```json
{
  "summaryId": "summary_01JABC",
  "status": "completed",
  "summary": "This article explains...",
  "generatedAt": "2026-08-14T00:10:00Z"
}
```

This API design deliberately models AI processing as an **asynchronous state transition**.

```text
requested
    ↓
processing
    ↓
completed
    |
    └── failed
```

That gives us room later to introduce background workers without changing the client-facing contract.

---

# 4.9 Critical Event Rules

A user should be able to define something like:

```http
POST /api/v1/urls/:urlId/alerts
```

```json
{
  "type": "click_threshold",
  "threshold": 10000,
  "windowSeconds": 3600,
  "channel": "email"
}
```

Meaning:

```text
If clicks > 10,000
within 1 hour
        ↓
generate critical event
        ↓
send email
```

Other event types can later be added:

```text
click_threshold
traffic_spike
url_expiring
url_expired
suspicious_traffic
```

The important architectural property is that **event generation and notification delivery are separate concepts**.

An event means:

```text
"Something important happened."
```

A notification means:

```text
"Deliver that fact through a channel."
```

That separation becomes useful when we eventually support email, webhook, push, etc.

---

# Phase 4 API Summary

```text
PUBLIC
──────────────────────────────────────────────
GET    /:shortCode
       → redirect


AUTHENTICATED URL MANAGEMENT
──────────────────────────────────────────────
POST   /api/v1/urls
GET    /api/v1/urls
GET    /api/v1/urls/:urlId
PATCH  /api/v1/urls/:urlId
POST   /api/v1/urls/:urlId/disable
DELETE /api/v1/urls/:urlId


ANALYTICS
──────────────────────────────────────────────
GET    /api/v1/urls/:urlId/analytics
GET    /api/v1/urls/:urlId/analytics/breakdown


AI
──────────────────────────────────────────────
POST   /api/v1/urls/:urlId/summary
GET    /api/v1/urls/:urlId/summary


CRITICAL EVENTS
──────────────────────────────────────────────
POST   /api/v1/urls/:urlId/alerts
GET    /api/v1/urls/:urlId/alerts
PATCH  /api/v1/urls/:urlId/alerts/:alertId
DELETE /api/v1/urls/:urlId/alerts/:alertId
```

---

# Phase 5 — Data Model

Now the API tells us what data access patterns we need.

For V1, I would start with the following relational model.

## URL

```text
URL
────────────────────────────────────────
id
userId
shortCode
destinationUrl
status
expiresAt
createdAt
updatedAt
```

Critical indexes:

```text
UNIQUE(shortCode)
INDEX(userId, createdAt)
INDEX(status, expiresAt)
```

The most important index is:

```text
UNIQUE(shortCode)
```

because the redirect path does:

```text
shortCode
   ↓
URL record
```

That lookup must be highly efficient.

The `userId + createdAt` index supports:

```text
GET /api/v1/urls
```

The `status + expiresAt` index may support lifecycle operations, but we should not assume we need it until we actually implement expiry processing.

---

# Analytics Event

```text
ClickEvent
────────────────────────────────────────
id
urlId
timestamp
ipHash / derived geo
country
deviceType
browser
operatingSystem
referrer
userAgent
```

Important indexes/access patterns:

```text
(urlId, timestamp)
```

because analytics queries naturally ask:

```text
"Give me clicks for this URL between
August 1 and August 14."
```

That is fundamentally a time-range query.

Notice something important:

```text
URL table
        ↓
small, transactional, lookup-heavy

ClickEvent
        ↓
large, append-heavy, time-series-like
```

We should **not assume these datasets should scale identically**.

---

# Summary

```text
Summary
────────────────────────────────────────
id
urlId
status
contentHash
summaryText
model
createdAt
updatedAt
```

`contentHash` is optional initially, but it gives us a future optimization.

For example, if the destination content has not changed, we may avoid repeatedly generating an identical AI summary.

---

# Alert Rule

```text
AlertRule
────────────────────────────────────────
id
userId
urlId
type
threshold
windowSeconds
channel
enabled
createdAt
updatedAt
```

This represents configuration, not the event itself.

---

# Critical Event

```text
CriticalEvent
────────────────────────────────────────
id
alertRuleId
urlId
type
detectedAt
payload
status
```

Potential status:

```text
detected
processing
notified
failed
```

This gives us a durable record of what happened independently of notification delivery.

---

# Notification

```text
Notification
────────────────────────────────────────
id
criticalEventId
channel
destination
status
attempts
lastAttemptAt
sentAt
createdAt
```

This is important for reliable delivery.

For example:

```text
CriticalEvent
     |
     v
Notification
     |
     +---- email → failed
     |
     +---- retry
     |
     v
sent
```

The notification record gives us somewhere to track retries and delivery state.

---

# Current Data Model

```text
User
 │
 ├──────────────< URL
 │                  │
 │                  ├────────< ClickEvent
 │                  │
 │                  ├────────< Summary
 │                  │
 │                  └────────< AlertRule
 │                                │
 │                                v
 │                           CriticalEvent
 │                                │
 │                                v
 │                           Notification
```

At this point, **we still haven't selected PostgreSQL, Redis, Kafka, MongoDB, Elasticsearch, or any other infrastructure component**.

That is intentional.

We've established:

```text
Requirements
     ↓
Workload
     ↓
CPU / bandwidth / storage
     ↓
API access patterns
     ↓
Data model
```

Only now are we ready to architect the system.

---

# Phase 6 — Version 1 Minimal Architecture

Our initial workload is:

```text
100K users
100K URLs/day
10M redirects/day
580 peak redirects/sec
~3.65 TB/year raw analytics
```

For V1, I would start with:

```text
                    Internet
                       |
                       v
                ┌─────────────┐
                │ Node.js API │
                └──────┬──────┘
                       |
                       v
                ┌─────────────┐
                │ PostgreSQL  │
                └─────────────┘
```

That's it.

No Redis.

No Kafka.

No Kubernetes.

No Elasticsearch.

No database sharding.

No CDN.

No microservices.

## Why?

Our application CPU calculation showed approximately:

```text
Peak redirect CPU
≈ 0.20 CPU core
```

Our peak request rate is:

```text
≈ 580 redirects/sec
```

A properly indexed relational database can handle this lookup workload comfortably at this scale, assuming the actual query is simple:

```sql
SELECT destination_url, status, expires_at
FROM urls
WHERE short_code = $1;
```

The critical lookup is:

```text
shortCode
    ↓
UNIQUE INDEX
    ↓
URL row
```

The URL mapping dataset is only approximately:

```text
18 GB/year raw
```

So the initial relational database does not need to be distributed simply because Route.io has 100K users.

---

# V1 Request Flow

### URL creation

```text
Client
  |
  | POST /api/v1/urls
  v
Node.js
  |
  | INSERT
  v
PostgreSQL
  |
  | URL record
  v
Node.js
  |
  v
Client
```

### Redirect

```text
Browser
  |
  | GET /aB72kP
  v
Node.js
  |
  | SELECT by shortCode
  v
PostgreSQL
  |
  | destinationUrl
  v
Node.js
  |
  | 302
  v
Browser
```

At this point, analytics can initially be handled in the simplest correct way, but we need to be careful not to violate the redirect latency requirement.

For V1, one possible implementation is to record a lightweight analytics event after resolving the URL, provided profiling shows the additional database operation remains within our latency budget.

If that begins pushing redirect p95 beyond 100 ms, **that measured bottleneck becomes the justification for our first asynchronous change**.

---

# V1 Scale Ceiling

We should not claim that a single Node.js server + PostgreSQL supports some arbitrary number like 1 million users.

The meaningful limits are workload-based.

Our current target is:

```text
Peak:
≈ 580 redirects/sec
≈ 6 URL creations/sec
≈ 580 analytics events/sec
```

A correctly indexed PostgreSQL deployment and appropriately sized Node.js instance should be capable of serving this workload, but the **actual ceiling must be established through load testing and production measurements**, particularly:

```text
Node.js:
CPU utilization
event-loop lag
p95/p99 latency
GC pauses

PostgreSQL:
CPU
IOPS
buffer/cache hit ratio
connections
query latency
lock contention

Application:
redirect p50
redirect p95
redirect p99
error rate
```

That is how I would present this in an interview rather than inventing a universal database QPS limit.

---

# Phase 6 Checkpoint

Now we have our first complete architecture:

```text
                 ┌─────────────────┐
                 │     Clients     │
                 └────────┬────────┘
                          │
                          v
                 ┌─────────────────┐
                 │  Node.js API    │
                 │                 │
                 │ URL Management  │
                 │ Redirect        │
                 │ Analytics       │
                 │ AI API          │
                 │ Alert API       │
                 └────────┬────────┘
                          │
                          v
                 ┌─────────────────┐
                 │   PostgreSQL    │
                 │                 │
                 │ Users           │
                 │ URLs            │
                 │ ClickEvents     │
                 │ Summaries       │
                 │ AlertRules      │
                 │ CriticalEvents  │
                 │ Notifications   │
                 └─────────────────┘
```

Your interview checkpoint is:

> **At our current scale of ~580 peak redirects/sec, suppose redirect p95 rises from 35 ms to 140 ms during load testing, while Node.js CPU is only 25% but PostgreSQL CPU reaches 85% and the `shortCode` lookup p95 becomes 90 ms. What is the bottleneck, and what would you investigate before adding another architectural component?**

Think specifically about **why the database is slow despite the query being a simple indexed lookup**.