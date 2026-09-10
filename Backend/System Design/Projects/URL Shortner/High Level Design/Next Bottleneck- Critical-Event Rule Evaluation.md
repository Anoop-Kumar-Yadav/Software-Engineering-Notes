

We now have the critical-event pipeline:

```text
Redirect
   ↓
Analytics Event
   ↓
Message Queue
   ↓
Stream Aggregator
   ↓
Windowed Metrics
   ↓
Critical-Event Detection
   ↓
AI Analysis / Drafting
   ↓
Notification Queue
   ↓
Email / Webhook / Push
```

The next question is **how the stream processor finds which rules should be evaluated for each URL**. We should solve this before introducing another technology.

---

## 7.119 The Naive Rule-Evaluation Design

Suppose Route.io allows users to create rules such as:

```text
Rule 1:
URL = abc123
clicks > 100,000 in 5 minutes

Rule 2:
URL = abc123
US traffic > 50% in 5 minutes

Rule 3:
URL = xyz789
clicks > 50,000 in 1 minute
```

A naive implementation could load all active rules:

```text
Event
  ↓
All active rules
  ↓
Check whether rule applies
  ↓
Execute matching rules
```

This becomes problematic at large scale.

Suppose:

```text
100M users
```

and:

```text
average 5 active alert rules/user
```

Then:

```text
100M × 5
= 500M rules
```

Now consider our peak analytics rate:

```text
≈ 579,000 events/sec
```

Checking every event against every rule would conceptually require:

```text
579,000 × 500,000,000
≈ 2.895 × 10^14 rule checks/sec
```

That is:

```text
≈ 289.5 trillion checks/sec
```

Clearly impossible.

So the next architectural requirement is:

> **An event must be routed only to rules that could possibly match that event.**

---

# 7.120 Rule Scope Gives Us the Index

Most Route.io rules will have some scope.

For example:

```text
URL-specific:
URL abc123 → clicks > 100K

Project-specific:
Project marketing → traffic > 1M

Account-wide:
Account X → traffic from India > 50%
```

The most selective scope is the URL.

For a URL event:

```json
{
  "urlId": "abc123",
  "eventType": "click"
}
```

we should first obtain:

```text
rules[urlId = abc123]
```

rather than scanning every rule.

Conceptually:

```text
                Analytics Event
                      |
                      v
                    urlId
                      |
                      v
              Rule Index Lookup
                      |
                      v
             Rules for abc123
                      |
              ┌───────┼────────┐
              ▼       ▼        ▼
            Rule A  Rule B   Rule C
```

If `abc123` has only three rules, we evaluate three rules.

That changes the effective complexity from:

```text
O(all_rules)
```

to:

```text
O(rules_for_event)
```

---

# 7.121 Quantifying the Improvement

Suppose we have:

```text
500M total rules
```

but the average URL has:

```text
3 active rules
```

Then each event only needs approximately:

```text
3 rule evaluations
```

instead of:

```text
500M evaluations
```

The reduction is approximately:

```text
500,000,000 / 3
≈ 166.7M×
```

This is why **rule indexing is not an optimization we add later**. At this scale, it determines whether the architecture is computationally feasible at all.

---

# 7.122 But We Have Different Rule Types

The problem becomes more interesting because not every rule is URL-specific.

Consider:

```text
1. URL-specific
   abc123 > 100K clicks

2. Account-wide
   total account traffic > 1M/day

3. Geographic
   India traffic > 50%

4. Rate-based
   clicks increase > 500% over baseline

5. Error-based
   destination failures > 5%
```

Therefore we can partition rules by **evaluation dimension**.

Conceptually:

```text
                    Event
                      |
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
      URL rules   Account rules   Global rules
        |             |             |
        ↓             ↓             ↓
     Evaluate      Evaluate      Evaluate
```

But we should not immediately create separate infrastructure for every rule type.

We first need to understand their computational characteristics.

---

# 7.123 Rule Evaluation CPU

Let's assume:

```text
579,000 events/sec
```

and after indexing each event matches an average of:

```text
3 rules
```

Therefore:

```text
579,000 × 3
= 1,737,000 rule evaluations/sec
```

Suppose one rule evaluation costs:

```text
5 μs CPU
```

Then:

```text
1,737,000 × 5 μs
= 8.685 CPU-seconds/sec
```

So approximately:

```text
8.7 CPU cores
```

at 100% utilization.

At our target:

```text
65% utilization
```

we need:

```text
8.685 / 0.65
≈ 13.4 cores
```

So roughly:

```text
14 CPU cores
```

for the rule evaluation workload.

That is entirely reasonable.

Compare this with the naive design:

```text
579K events/sec × 500M rules
```

which is computationally impossible.

---

# 7.124 Rule Index Storage

We need a representation such as:

```text
URL_ID → active rules
```

For example:

```text
abc123 → [rule_1, rule_7, rule_19]
xyz789 → [rule_2, rule_8]
```

The authoritative copy should live in durable storage.

A simplified relational model could be:

```text
AlertRule
---------
id
user_id
url_id
event_type
threshold
window_seconds
enabled
created_at
updated_at
```

Useful indexes:

```text
(url_id, enabled)
(user_id, enabled)
(event_type, enabled)
```

The most important lookup for our streaming workload is:

```text
(url_id, enabled)
```

because the event already tells us the URL.

---

# 7.125 Should Every Event Query PostgreSQL for Rules?

No.

Suppose:

```text
579,000 events/sec
```

and each event performs:

```text
SELECT active rules WHERE url_id = ?
```

Even if PostgreSQL could theoretically handle some of those queries, this creates unnecessary database traffic.

More importantly, **the rule configuration changes much less frequently than analytics events**.

For example:

```text
Analytics events:
579,000/sec peak

Rule changes:
perhaps hundreds/sec
```

This is a classic read-heavy configuration workload.

Therefore, the rule index can be cached in memory.

---

# 7.126 Rule Cache

We can maintain:

```text
Rule Store
    ↓
Rule Cache
    ↓
Stream Processor
```

For example:

```text
abc123
  ↓
[
  Rule 1,
  Rule 7,
  Rule 19
]
```

The stream processor can retrieve relevant rules without querying PostgreSQL for every event.

The important distinction is:

```text
Analytics data
→ continuously changing

Rule configuration
→ relatively stable
```

This makes caching appropriate.

---

# 7.127 Rule Updates

Now we have a consistency problem.

Suppose the user changes:

```text
threshold:
100,000
```

to:

```text
50,000
```

PostgreSQL has:

```text
50,000
```

but the stream processor's cached rule still says:

```text
100,000
```

We therefore need a mechanism to propagate rule changes.

Conceptually:

```text
User
 ↓
API
 ↓
PostgreSQL
 ↓
Rule-Changed Event
 ↓
Rule Cache / Stream Processor
 ↓
Updated Rule
```

This is a configuration propagation problem.

We don't need to make every analytics event perform a database lookup just to guarantee immediate rule consistency.

Instead we can define an explicit requirement such as:

```text
Rule changes must propagate to detection workers
within 5 seconds.
```

Then eventual consistency is acceptable.

---

# 7.128 Architectural Change #7 — Indexed Rule Cache

We can now justify adding a **rule cache/index**.

The architecture becomes:

```text
                        Alert Rule API
                              |
                              v
                         PostgreSQL
                              |
                              v
                      Rule Change Event
                              |
                              v
                         Rule Cache
                              |
                              v
Analytics Events ─────> Stream Processor
                              |
                              v
                       Rule Index Lookup
                              |
                              v
                       Relevant Rules
                              |
                              v
                       Rule Evaluation
```

The cache contains only the information required for evaluation.

For example:

```json
{
  "urlId": "abc123",
  "rules": [
    {
      "id": "rule_1",
      "type": "click_threshold",
      "threshold": 100000,
      "windowSeconds": 300
    }
  ]
}
```

---

# 7.129 New Scale Ceiling

With:

```text
579K events/sec
```

and:

```text
3 rules/event
```

we calculated:

```text
1.737M rule evaluations/sec
```

At:

```text
5 μs/evaluation
```

we need:

```text
≈ 8.7 CPU cores
```

or:

```text
≈ 14 cores
```

at 65% utilization.

Suppose a four-core worker can process:

```text
300K rule evaluations/sec
```

Then:

```text
1.737M / 300K
≈ 5.79
```

So we need:

```text
6 workers
```

for raw capacity.

With redundancy and headroom:

```text
8 workers
```

would be a reasonable starting point.

Again, the benchmark determines the actual number.

---

# 7.130 Important Cost

The rule cache introduces:

|Cost|Consequence|
|---|---|
|Memory|Active rule definitions consume worker/cache memory|
|Consistency|Rule changes aren't necessarily instantaneous|
|Invalidation|Rule updates must propagate correctly|
|Failure recovery|Workers need a way to rebuild rule state|
|Complexity|Another stateful layer exists|
|Synchronization|Multiple workers must receive configuration changes|

The benefit is much larger:

```text
No DB query per analytics event
```

and:

```text
No O(all_rules) evaluation
```

---

# 7.131 AI Is Still Downstream

Notice what we **didn't** do.

We didn't put AI inside rule evaluation.

The flow remains:

```text
Analytics Event
      |
      v
Window Aggregation
      |
      v
Rule Index
      |
      v
Deterministic Rule Evaluation
      |
      v
Critical Event
      |
      v
AI
```

AI only receives:

```text
critical_event
```

rather than:

```text
raw_event
```

or:

```text
all_rules
```

This keeps AI's workload proportional to the number of **actual critical events**, rather than total traffic.

---

# 7.132 Critical Event State Machine

There is one more important issue before we consider this subsystem complete.

Suppose the rule is:

```text
clicks > 100,000 / 5 minutes
```

Traffic looks like:

```text
90K
95K
101K
105K
110K
120K
```

We should generate one event when the threshold is crossed:

```text
90K  → NORMAL
95K  → NORMAL
101K → CRITICAL ← emit event
105K → CRITICAL
110K → CRITICAL
120K → CRITICAL
```

We must **not** emit:

```text
101K → notification
105K → notification
110K → notification
120K → notification
```

Therefore each rule needs state similar to:

```text
NORMAL
   |
   | threshold crossed
   v
TRIGGERED
   |
   | cooldown/reset condition
   v
NORMAL
```

---

# 7.133 Cooldown

Suppose the URL remains above the threshold for:

```text
30 minutes
```

Without a cooldown, the system might repeatedly trigger the same alert.

We can configure:

```text
cooldown = 30 minutes
```

Then:

```text
12:00 → threshold crossed → notify
12:05 → still critical → ignore
12:10 → still critical → ignore
12:20 → still critical → ignore
12:30 → cooldown complete
```

If the metric falls below the recovery threshold:

```text
12:25 → 70K
```

we can transition back:

```text
TRIGGERED → NORMAL
```

and allow a future spike to generate another event.

This is a **state-machine problem**, not an AI problem.

---

# 7.134 Hysteresis

For some rules, we should avoid triggering and recovering at almost the same threshold.

For example:

```text
Trigger:
100,000 clicks

Recover:
80,000 clicks
```

Then:

```text
99K → normal
101K → critical
98K → critical
95K → critical
79K → normal
```

This prevents oscillation around:

```text
100K
```

The technique is called **hysteresis**.

This becomes useful for high-frequency metrics.

---

# 7.135 Route.io Critical-Event Architecture Now

Our current architecture is:

```text
                         ┌──────────────┐
                         │   PostgreSQL │
                         │  URL + Rules │
                         └──────┬───────┘
                                |
                         Rule Change Event
                                |
                                v
                         ┌──────────────┐
                         │  Rule Cache  │
                         └──────┬───────┘
                                |
                                |
Redirect                       |
   ↓                            |
Analytics Event                |
   ↓                            |
Message Queue                   |
   ↓                            |
Stream Aggregator <─────────────┘
   |
   v
Windowed Metrics
   |
   v
Rule Index Lookup
   |
   v
Rule Evaluation
   |
   v
State Machine
   |
   | threshold crossed
   v
Critical Event
   |
   v
AI Job Queue
   |
   v
AI Worker
   |
   v
AI Provider
   |
   v
Validated Message
   |
   v
Notification Queue
   |
   ├── Email
   ├── Webhook
   └── Push
```

This is now a strong architecture because **each stage has a specific computational responsibility**.

---

## 7.136 Scale-Tier Update

|Scale|Architecture addition|Problem solved|
|---|---|---|
|≤100K users|Node.js + PostgreSQL|Basic product functionality|
|~1M|Load balancer + Node.js horizontal scaling|Application CPU capacity|
|~10M|Read replicas|Database read throughput|
|~10M|Message queue + analytics consumers|Decouple analytics from redirects|
|~100M|PostgreSQL sharding|Database write/read scaling domain|
|~100M|Redis|Hot URL lookup pressure|
|~100M+|CDN|Extreme redirect/network traffic|
|~100M+|Stream aggregation|Real-time traffic/window calculations|
|~100M+|AI workers|Intelligent interpretation/message drafting|
|~100M+|Indexed rule cache|Avoid O(all-rules) evaluation|

The architecture is now solving a much more interesting problem than simply "how do we scale Node.js?"

---

# Checkpoint

Before we move forward, reason about this scenario:

```text
A URL has this alert:

Trigger: 100,000 clicks / 5 min
Recovery: 80,000 clicks / 5 min

Traffic:

12:00 → 95K
12:05 → 102K
12:10 → 110K
12:15 → 98K
12:20 → 85K
12:25 → 79K
12:30 → 105K
```

**How many critical events should Route.io generate, and at which points?**

Also explain why the `98K` and `85K` values should not immediately generate a recovery notification.

Answer that first; then we'll move to the next bottleneck: **AI-provider reliability, rate limits, token/cost estimation, fallback drafting, and how many AI workers Route.io actually needs.**