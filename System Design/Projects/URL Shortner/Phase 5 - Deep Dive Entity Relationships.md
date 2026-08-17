# Route.io — Phase 5 Deep Dive: Entity Relationships

This is an important point to clarify before we move into the architecture. The entities we created are not independent tables; they represent **different parts of one business lifecycle**. In an interview, I would explain the relationships from the primary user action — creating a URL — and then follow the data as the URL generates clicks, summaries, alerts, and notifications.

## 1. High-Level Relationship

The core relationship is:

```text
User
 │
 │ 1
 │
 │ creates
 ▼
URL
 │
 ├───────────────< ClickEvent
 │                    │
 │                    │ generates
 │                    ▼
 │              Analytics
 │              (derived from ClickEvent)
 │
 ├───────────────< Summary
 │
 └───────────────< AlertRule
                       │
                       │ detects
                       ▼
                  CriticalEvent
                       │
                       │ produces
                       ▼
                  Notification
```

The notation means:

```text
1 ───< many
```

For example, **one User can own many URLs**, and **one URL can have many ClickEvents**.

---

# 2. User → URL

This is the first and most fundamental relationship.

```text
User
  1
  │
  │ owns
  │
  N
  ▼
URL
```

A user can create many shortened URLs:

```text
User
id = U100

        │
        ├── URL A
        ├── URL B
        ├── URL C
        └── URL D
```

Therefore the `urls` table contains:

```text
userId
```

as a foreign key referencing `users.id`.

Conceptually:

```text
users
────────────────────
id
email
...

        1
        │
        │
        N
        ▼

urls
────────────────────
id
userId        ← FK
shortCode
destinationUrl
status
expiresAt
createdAt
updatedAt
```

### Why do we need `userId`?

Because authenticated APIs need to answer questions such as:

```text
"Give me all URLs belonging to user U100."

"Can user U100 modify URL X?"

"Which user owns this alert?"

"Which user should receive this notification?"
```

So this relationship isn't just a database relationship; it directly comes from our authorization requirements.

For example:

```sql
SELECT *
FROM urls
WHERE user_id = $1
ORDER BY created_at DESC;
```

This is why we proposed:

```text
INDEX(userId, createdAt)
```

The index is driven by the **access pattern**.

---

# 3. URL → ClickEvent

This is probably the most important relationship for Route.io's analytics system.

```text
URL
  1
  │
  │ receives
  │
  N
  ▼
ClickEvent
```

One shortened URL can receive thousands, millions, or eventually billions of clicks.

Example:

```text
URL
id = URL_123
shortCode = abc123

        │
        ├── ClickEvent 1
        ├── ClickEvent 2
        ├── ClickEvent 3
        ├── ...
        └── ClickEvent 10,000,000
```

Therefore:

```text
click_events.urlId → urls.id
```

Conceptually:

```text
urls
────────────────────
id
shortCode
destinationUrl
...

        1
        │
        │
        N
        ▼

click_events
────────────────────
id
urlId          ← FK
timestamp
country
deviceType
browser
os
referrer
...
```

The critical query pattern is:

```sql
SELECT *
FROM click_events
WHERE url_id = $1
  AND timestamp >= $2
  AND timestamp < $3
ORDER BY timestamp;
```

That's why our index is:

```text
(urlId, timestamp)
```

This is a good example of how **the relationship and the query pattern determine the index**.

---

# 4. Important Distinction: Analytics Is Not Another Entity Yet

Earlier we discussed an "Analytics" concept, but notice that we didn't create an `analytics` table.

That's intentional.

We have:

```text
ClickEvent
```

as the raw source data.

Then analytics such as:

```text
Total clicks
Clicks/day
Clicks/country
Clicks/device
Unique visitors
```

are **derived views/aggregations of ClickEvent data**.

For example:

```text
ClickEvent
ClickEvent
ClickEvent
ClickEvent
      │
      ▼
Aggregation
      │
      ├── totalClicks = 4
      ├── India = 3
      └── US = 1
```

So initially:

```text
Analytics ≠ separate source-of-truth entity
Analytics = derived information
```

This distinction becomes extremely important when we scale.

At 3.65 TB/year of raw events, repeatedly scanning raw events for dashboard queries could become expensive. At that point we might introduce pre-aggregated analytics storage.

But **that is a scale-driven decision**, not something we need to add to the V1 data model merely because "analytics usually has a table."

---

# 5. URL → Summary

One URL can have one or potentially multiple generated summaries.

```text
URL
  1
  │
  │
  N
  ▼
Summary
```

Why potentially multiple?

Because we might regenerate a summary when:

```text
destination content changes
AI model changes
user requests regeneration
summary generation fails and is retried
```

For example:

```text
URL
id = URL_123
        │
        ├── Summary v1 → GPT model A
        ├── Summary v2 → GPT model B
        └── Summary v3 → regenerated
```

Our current model can therefore contain:

```text
summary
id
urlId
status
contentHash
summaryText
model
createdAt
updatedAt
```

The `contentHash` is particularly useful.

Suppose:

```text
destination content
        ↓
SHA-256
        ↓
abc123
```

If we later request another summary and the content hash is still:

```text
abc123
```

we know the underlying content hasn't changed.

That creates a possible optimization:

```text
same content
    ↓
reuse existing summary
    ↓
avoid another AI request
```

Again, this is a future optimization, not something that requires a separate architecture today.

---

# 6. User → AlertRule

An alert belongs conceptually to a user, but it is also associated with a specific URL.

So:

```text
User
  1
  │
  │
  N
  ▼
AlertRule
  N
  │
  │
  1
  ▼
URL
```

In other words:

```text
User ───< AlertRule >─── URL
```

Example:

```text
User U100
   │
   ├── AlertRule 1
   │      URL = route.io/abc
   │      threshold = 10,000 clicks/hour
   │
   └── AlertRule 2
          URL = route.io/xyz
          threshold = 5,000 clicks/hour
```

Therefore `alert_rules` contains both:

```text
userId
urlId
```

Why both?

Because they represent two different relationships.

`userId` answers:

> **Who owns/configured this rule?**

`urlId` answers:

> **Which URL does this rule monitor?**

---

# 7. AlertRule → CriticalEvent

This relationship is different from the previous ones.

An `AlertRule` represents **configuration**:

```text
"If clicks exceed 10,000 in one hour..."
```

A `CriticalEvent` represents an **actual occurrence**:

```text
"At 14:03 UTC, this URL reached 10,142 clicks/hour."
```

Therefore:

```text
AlertRule
   1
   │
   │ triggers
   N
   ▼
CriticalEvent
```

Example:

```text
AlertRule
────────────────────────
type = click_threshold
threshold = 10,000
window = 1 hour

          │
          │ triggered multiple times
          ▼

CriticalEvent
────────────────────────
detectedAt = 14:03
actualClicks = 10,142

CriticalEvent
────────────────────────
detectedAt = 18:11
actualClicks = 12,891
```

This separation is extremely important.

If we stored only the rule:

```text
threshold = 10,000
```

we wouldn't have a historical record of what actually happened.

With `CriticalEvent`, we can answer:

```text
When did the event happen?
Which rule triggered?
Which URL was affected?
What was the observed value?
Was notification successful?
```

---

# 8. CriticalEvent → Notification

Now we reach the notification system.

```text
CriticalEvent
      1
      │
      │
      N
      ▼
Notification
```

Why one-to-many?

Because one critical event could eventually produce multiple notifications.

For example:

```text
CriticalEvent
"Traffic spike detected"
        │
        ├── Email notification
        ├── Webhook notification
        └── Push notification
```

Therefore:

```text
notifications.criticalEventId
        ↓
critical_events.id
```

A notification tracks delivery state:

```text
Notification
────────────────────────
id
criticalEventId
channel
destination
status
attempts
lastAttemptAt
sentAt
```

This becomes especially useful for retries.

For example:

```text
CriticalEvent
      │
      ▼
Notification
      │
      ├── attempt 1 → failed
      ├── attempt 2 → failed
      ├── attempt 3 → success
      │
      ▼
status = sent
```

We therefore don't need to regenerate the critical event every time delivery fails.

The **event is the fact**.

The **notification is the delivery attempt**.

That distinction is important in production systems.

---

# 9. Complete Relationship Model

Putting everything together:

```text
                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
                       1        │        N
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
          ┌──────────────┐              ┌──────────────┐
          │     URL      │              │  AlertRule   │
          └──────┬───────┘              └──────┬───────┘
                 │                             │
          ┌──────┼──────────┐                  │
          │      │          │                  │
          │      │          │                  │
          ▼      ▼          ▼                  │
     ClickEvent Summary                  CriticalEvent
                                             │
                                             ▼
                                       Notification
```

There is also this relationship:

```text
AlertRule ──────> URL
```

So the more complete model is:

```text
User
 │
 ├──────────────< URL
 │                  │
 │                  ├──────────────< ClickEvent
 │                  │
 │                  └──────────────< Summary
 │
 └──────────────< AlertRule >────────────── URL
                       │
                       │
                       └──────────────< CriticalEvent
                                             │
                                             └──────────────< Notification
```

---

# 10. Cardinality Summary

|Relationship|Cardinality|Foreign key|Meaning|
|---|---|---|---|
|User → URL|1:N|`urls.userId`|One user owns many URLs|
|URL → ClickEvent|1:N|`click_events.urlId`|One URL receives many clicks|
|URL → Summary|1:N|`summaries.urlId`|One URL can have multiple summary generations|
|User → AlertRule|1:N|`alert_rules.userId`|One user configures many rules|
|URL → AlertRule|1:N|`alert_rules.urlId`|One URL can have multiple alert rules|
|AlertRule → CriticalEvent|1:N|`critical_events.alertRuleId`|One rule can trigger repeatedly|
|CriticalEvent → Notification|1:N|`notifications.criticalEventId`|One event can produce multiple delivery attempts/channels|

---

# 11. The Most Important Interview Insight

If an interviewer asks:

> **“Why did you model CriticalEvent separately from AlertRule?”**

A strong answer is:

> “Because configuration and occurrence have different semantics. AlertRule represents what the user wants Route.io to monitor, while CriticalEvent represents an actual detected occurrence. A single rule can trigger many times, so modeling them as one entity would lose event history and make notification delivery state difficult to track.”

Similarly, if asked:

> **“Why don't you have an Analytics table?”**

You can say:

> “Raw analytics is represented by ClickEvent. Analytics metrics are derived from those events. At the current scale I don't need a separate analytics source of truth. If dashboard queries against the raw event volume become expensive, I can introduce pre-aggregated analytics tables or a separate analytical store based on the measured query and storage bottleneck.”

That is the kind of answer that demonstrates **data-modeling judgment rather than memorized schema design**.

## One correction to our earlier model

There is one relationship I would slightly refine before we proceed: **`Summary` should probably not be directly treated as permanently 1:N without defining its lifecycle semantics.** If Route.io's product requirement is "one current summary per URL," then the database could enforce one current summary and maintain generations separately. If the requirement is "retain every generated version," then 1:N is correct. We'll make that decision explicitly when we finalize the schema rather than hiding it inside the model.

Next, we should move to **Phase 6 and design the actual V1 Node.js + PostgreSQL architecture**, including the request paths for **redirect, URL creation, analytics, AI summarization, and critical-event notifications**, and then establish its measurable ceiling before we scale it.