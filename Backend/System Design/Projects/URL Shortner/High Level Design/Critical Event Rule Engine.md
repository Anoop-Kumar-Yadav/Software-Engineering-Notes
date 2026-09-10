

We now move into the **critical-event detection engine**, which is one of the most technically interesting parts of Route.io.

Our current workload assumption remains:

```text
Analytics events:
≈ 579,000 events/sec

Potentially active alert rules:
potentially millions

Goal:
detect critical conditions in near real time
```

The naive implementation is obviously impossible:

```text
For every event
    ↓
scan every rule
    ↓
evaluate condition
```

If we had:

```text
579,000 events/sec
×
1,000,000 rules
```

that would imply:

```text
579,000,000,000 rule evaluations/sec
```

or roughly:

```text
579 billion evaluations/sec
```

That is the bottleneck we need to eliminate.

---

# 7.224 The First Design Question

Before introducing another component, we need to understand **what a Route.io rule actually looks like**.

A rule could be:

```text
IF
    URL = abc123
AND
    clicks in 5 minutes > 100,000

THEN
    critical event
```

Another:

```text
IF
    URL = abc123
AND
    clicks from country IN > 50,000/hour

THEN
    critical event
```

Another:

```text
IF
    click rate > 10 × baseline

THEN
    critical event
```

And another:

```text
IF
    error rate > 5%
    for 3 consecutive windows

THEN
    critical event
```

These rules aren't arbitrary programs. They have **structured predicates**.

That gives us an opportunity to index them.

---

# 7.225 Rule Model

A simplified rule might contain:

```text
AlertRule
-------------------------
id
tenant_id
url_id
metric
operator
threshold
window
dimension
dimension_value
severity
cooldown
enabled
```

Example:

```text
id="rule_123"
tenant_id="tenant_42"
url_id="abc123"
metric="click_count"
operator=">"
threshold=100000
window="5m"
severity="critical"
cooldown="30m"
enabled=true
```

The important fields for routing are:

```text
tenant_id
url_id
metric
dimension
```

The threshold itself usually isn't useful for finding candidate rules.

---

# 7.226 Rule Index

Instead of asking:

> "Which of the million rules should I evaluate?"

we ask:

> "Given this event, which small subset of rules could possibly apply?"

Suppose the event belongs to:

```text
url_id = abc123
```

We can maintain an index:

```text
url_id → active rules
```

For example:

```text
abc123
  |
  ├── rule_101 → click_count > 100K / 5m
  ├── rule_205 → country=IN > 50K / 1h
  ├── rule_331 → mobile > 80K / 10m
  └── rule_772 → anomaly detection
```

Instead of evaluating:

```text
1,000,000 rules
```

we may only evaluate:

```text
4 rules
```

for this URL.

That changes the computational problem dramatically.

---

# 7.227 Numerical Improvement

Suppose:

```text
1M active rules
```

and:

```text
average rules per URL = 5
```

Then instead of:

```text
579K × 1M
```

we process approximately:

```text
579K × 5
=
2.895M rule evaluations/sec
```

That is a completely different workload.

The architectural improvement isn't merely "use an index."

It is:

```text
579 billion evaluations/sec
        ↓
≈ 2.9 million evaluations/sec
```

under our assumptions.

This is why the index is justified.

---

# 7.228 But There Is a Problem

What if a single customer creates:

```text
100,000 rules
```

for the same URL?

Then:

```text
abc123
   ↓
100,000 rules
```

and a viral URL producing:

```text
150,000 events/sec
```

could produce:

```text
150K × 100K
=
15 billion rule evaluations/sec
```

We have solved the global problem but created a **hot-rule-set problem**.

So we need a second level of indexing.

---

# 7.229 Index by Metric

Instead of:

```text
url_id → all rules
```

use:

```text
url_id
   ↓
metric
   ↓
rules
```

For example:

```text
abc123
   |
   ├── click_count
   │      ├── rule_1
   │      ├── rule_2
   │      └── rule_3
   |
   ├── error_rate
   │      ├── rule_4
   │      └── rule_5
   |
   └── country_clicks
          ├── rule_6
          └── rule_7
```

An event or aggregate update only evaluates rules associated with the relevant metric.

---

# 7.230 Dimension-Based Filtering

Suppose we have:

```text
Rule:
country = IN
click_count > 50K
```

An event from:

```text
country = US
```

doesn't need to be evaluated against that rule.

So we can further index:

```text
url_id
+
metric
+
dimension
```

Conceptually:

```text
abc123
  ↓
click_count
  ↓
country
  ↓
IN
  ↓
matching rules
```

Now the candidate rule set can become extremely small.

---

# 7.231 Candidate Selection vs Rule Evaluation

This distinction is important in an interview.

There are two separate operations:

```text
Candidate selection
```

and:

```text
Condition evaluation
```

Candidate selection answers:

> Which rules might apply?

Condition evaluation answers:

> Is the rule actually satisfied?

The architecture becomes:

```text
Analytics Aggregate
       ↓
Candidate Rule Index
       ↓
Relevant Rules
       ↓
Condition Evaluation
       ↓
State Machine
       ↓
Critical Event
```

Keeping these separate makes the design easier to scale and reason about.

---

# 7.232 Rule State

A threshold rule isn't simply:

```text
metric > threshold
```

because otherwise Route.io would generate an alert on every evaluation while the threshold remains exceeded.

Suppose:

```text
threshold = 100K clicks
```

and metrics are:

```text
105K
110K
120K
130K
140K
```

A naive implementation generates:

```text
5 alerts
```

But the user likely wants:

```text
1 alert
```

when the threshold is crossed.

Therefore the rule needs state.

---

# 7.233 Rule State Machine

A simple state machine:

```text
                    metric <= threshold
                           |
                           v
                      ┌─────────┐
                      │ NORMAL  │
                      └────┬────┘
                           |
                    metric > threshold
                           |
                           v
                      ┌─────────┐
                      │ TRIGGER │
                      └────┬────┘
                           |
                           v
                      ┌─────────┐
                      │ ACTIVE  │
                      └────┬────┘
                           |
                    metric <= threshold
                           |
                           v
                      ┌─────────┐
                      │ NORMAL  │
                      └─────────┘
```

Only:

```text
NORMAL → ACTIVE
```

generates the critical event.

While:

```text
ACTIVE → ACTIVE
```

doesn't.

---

# 7.234 Hysteresis

Real traffic fluctuates around thresholds.

Suppose:

```text
trigger threshold = 100K
```

and the metric goes:

```text
99K
101K
99K
102K
98K
103K
```

Without hysteresis, Route.io may repeatedly trigger.

Instead, define:

```text
trigger:
> 100K

reset:
< 90K
```

Then:

```text
100K → trigger

101K
99K
95K
92K
91K
→ remain active

89K
→ reset
```

This is **hysteresis**.

It reduces alert flapping.

---

# 7.235 Cooldown Is Different From Hysteresis

These two concepts should not be confused.

### Hysteresis

Controls when the rule transitions between:

```text
NORMAL
ACTIVE
```

### Cooldown

Controls how frequently notifications can be emitted.

For example:

```text
Rule remains ACTIVE
Cooldown = 30 minutes
```

The system could potentially produce another notification after 30 minutes if policy allows it.

So:

```text
Threshold state
≠
Notification frequency
```

That distinction is important for our data model.

---

# 7.236 Sliding Windows

Now consider:

```text
clicks in last 5 minutes > 100K
```

We cannot evaluate this correctly using only a lifetime counter.

We need a time window.

A straightforward approach is bucketed counters.

For example:

```text
5-minute window
```

can be represented as:

```text
12:00 → 20K
12:01 → 18K
12:02 → 21K
12:03 → 19K
12:04 → 25K
```

Total:

```text
20 + 18 + 21 + 19 + 25
=
103K
```

Therefore:

```text
103K > 100K
```

and the rule triggers.

---

# 7.237 Why Not Store Every Event in Rule State?

At:

```text
579K events/sec
```

we could receive:

```text
≈ 2.9M events
```

in five seconds.

Storing every event for every rule would be extremely expensive.

Instead, maintain compact window state:

```text
Rule state
----------------
rule_id
bucket_start
metric_value
```

For count-based rules, this can be tiny compared with raw events.

---

# 7.238 Window State Example

Suppose:

```text
rule_123
window = 5 minutes
```

State:

```text
bucket       count
12:00        20,000
12:01        18,000
12:02        21,000
12:03        19,000
12:04        25,000
```

When the clock moves to:

```text
12:05
```

we remove:

```text
12:00
```

and add:

```text
12:05
```

This creates a rolling window.

The operation is approximately:

```text
O(1)
```

per incoming bucket update rather than scanning all events.

---

# 7.239 Tumbling vs Sliding Windows

There are two common approaches.

|Window|Behavior|Cost|Route.io use|
|---|---|--:|---|
|Tumbling|Fixed non-overlapping intervals|Lower|Simple reporting|
|Sliding|Continuously overlapping interval|Higher|Critical event detection|
|Session|Activity-defined windows|Higher|Specialized use cases|

For:

```text
"last 5 minutes"
```

a sliding or bucketed sliding window is appropriate.

For:

```text
"clicks during each hour"
```

tumbling hourly windows are simpler.

---

# 7.240 Rate-Based Rules

Suppose a rule says:

```text
click rate > 10,000 clicks/sec
```

We don't need to store every event.

We maintain:

```text
count(window)
```

and calculate:

```text
rate =
count / window_duration
```

For example:

```text
5-minute count = 3,600,000
```

Then:

```text
3,600,000 / 300
=
12,000 clicks/sec
```

If:

```text
threshold = 10,000/sec
```

the rule triggers.

---

# 7.241 Baseline-Based Anomaly Detection

Now we reach a more interesting rule:

```text
traffic > 10 × normal baseline
```

Suppose the URL normally receives:

```text
500 clicks/sec
```

Current traffic:

```text
8,000 clicks/sec
```

Then:

```text
8,000 / 500
=
16×
```

Therefore:

```text
16× > 10×
```

and the event triggers.

But now the rule engine needs historical baseline information.

This should not be calculated from raw events on every incoming event.

Instead, maintain:

```text
baseline
```

as an aggregate:

```text
URL
hour-of-day
day-of-week
expected rate
variance
```

For example:

```text
abc123
Monday
14:00–15:00
baseline = 500/sec
```

---

# 7.242 Why Time Context Matters

Suppose a URL normally receives:

```text
500/sec
```

during business hours but:

```text
20/sec
```

at 3 AM.

If current traffic is:

```text
500/sec
```

then:

```text
500 / 20
=
25×
```

It is potentially anomalous at 3 AM even though `500/sec` would be normal during the afternoon.

Therefore anomaly detection should compare against an appropriate temporal baseline.

This is a much more meaningful signal than a single global average.

---

# 7.243 Rule Evaluation Architecture

Our rule engine now becomes:

```text
                     Stream Aggregate
                            |
                            v
                   Candidate Rule Index
                            |
                            v
                    Relevant Rules
                            |
             ┌──────────────┼──────────────┐
             |              |              |
             v              v              v
          Counter        Window          Baseline
           State          State          Comparison
             |              |              |
             └──────────────┼──────────────┘
                            v
                    Condition Evaluator
                            |
                            v
                     Rule State Machine
                            |
                     ┌──────┴──────┐
                     |             |
                   NORMAL        ACTIVE
                                   |
                                   v
                             Critical Event
```

This is much more efficient than evaluating arbitrary rules against raw events.

---

# 7.244 Where Should Rule State Live?

Now we have a distributed-state problem.

Suppose:

```text
20 stream consumers
```

are processing analytics.

Where does:

```text
rule_123
```

live?

We need consistent ownership.

A natural approach is to partition rule state by a deterministic key such as:

```text
tenant_id + url_id
```

For example:

```text
hash(tenant_id + url_id) % N
```

Then the same URL's rule state goes to the same processing partition.

Conceptually:

```text
URL abc123
    ↓
hash
    ↓
partition 7
    ↓
rule state owner
```

This avoids multiple workers simultaneously modifying the same state.

---

# 7.245 Rule State and Redis

We have already introduced Redis elsewhere in Route.io.

It might be tempting to put all rule state into Redis:

```text
Redis
  ↓
all window counters
all rule states
```

But at our scale that can become problematic.

If the stream processor performs:

```text
579K updates/sec
```

and each event causes multiple Redis operations, we create another extremely high-throughput dependency.

More importantly, the stream-processing state should ideally be colocated with the computation that owns it.

So the preferred design is:

```text
Stream Consumer
      |
      └── Local / embedded state
```

with durable checkpointing/state recovery.

Redis remains useful for:

```text
rule configuration
hot metadata
short-lived coordination
```

but shouldn't automatically become the write path for every analytics event.

---

# 7.246 Rule Configuration vs Rule Runtime State

These are two different datasets.

### Rule configuration

```text
rule_id
tenant_id
url_id
metric
threshold
window
enabled
cooldown
```

Stored durably in:

```text
PostgreSQL
```

### Runtime state

```text
current window counters
current state
last triggered timestamp
cooldown expiration
```

Stored close to:

```text
stream-processing workers
```

with durable state/checkpointing.

This separation is extremely useful.

---

# 7.247 What Happens When a Rule Changes?

Suppose:

```text
threshold = 100K
```

and the customer changes it to:

```text
200K
```

PostgreSQL has the new configuration.

But stream consumers may still have:

```text
old threshold = 100K
```

cached locally.

We therefore need a rule-change propagation mechanism.

```text
Customer
   ↓
API
   ↓
PostgreSQL
   ↓
Rule Change Event
   ↓
Rule Distribution
   ↓
Stream Consumers
```

Each relevant consumer updates its local rule index.

This is another example of **control plane vs data plane**.

---

# 7.248 Control Plane vs Data Plane

Route.io can now be understood as having two paths.

### Control plane

Handles relatively low-volume configuration:

```text
Users
URLs
Rules
Notification preferences
API keys
```

Example:

```text
POST /rules
PATCH /rules/{id}
DELETE /rules/{id}
```

### Data plane

Handles enormous traffic:

```text
redirects
analytics events
stream aggregation
rule evaluation
notifications
```

The control plane changes **how the data plane behaves**.

This separation makes the architecture significantly easier to scale.

---

# 7.249 Rule Distribution Scale

Suppose we have:

```text
1M active rules
```

and:

```text
20 stream consumers
```

We don't necessarily want every consumer to maintain every rule.

Instead, rules should be distributed according to their routing key.

For example:

```text
hash(tenant_id + url_id)
```

Then:

```text
Rule 1 → Consumer 3
Rule 2 → Consumer 11
Rule 3 → Consumer 3
Rule 4 → Consumer 17
```

The event stream uses the same partitioning strategy.

Therefore:

```text
event(url abc123)
       ↓
partition 3

rules(url abc123)
       ↓
partition 3
```

The event and its relevant state meet at the same processing owner.

This is a powerful architectural property.

---

# 7.250 The Hot-Rule Problem Revisited

Remember:

```text
viral URL
→ 150K events/sec
```

and potentially:

```text
100K rules
```

for that URL.

Even indexed rule evaluation could still become expensive.

The answer is not necessarily "add more workers."

We should classify rules.

For example:

```text
Simple:
click_count > threshold

Dimension:
country = IN AND count > threshold

Complex:
anomaly against baseline
```

Simple counters can be evaluated very cheaply.

Complex rules require more state and computation.

Therefore the engine can maintain different execution paths:

```text
Simple Counter Rules
        ↓
fast path

Complex Rules
        ↓
specialized evaluator
```

This is another place where **rule structure matters more than raw rule count**.

---

# 7.251 Critical Event Creation

Once a rule transitions:

```text
NORMAL → ACTIVE
```

we create a durable event:

```text
CriticalEvent
-------------------------
id
rule_id
tenant_id
url_id
event_type
severity
detected_at
metrics_snapshot
deduplication_key
```

The metrics snapshot is important.

Suppose the event was triggered at:

```text
12:05:03
```

with:

```text
click_rate = 15,000/sec
baseline = 500/sec
ratio = 30×
```

We should store those values.

Otherwise, when the notification is generated later, the underlying metrics may have changed.

---

# 7.252 Why the Metrics Snapshot Matters for AI

The AI worker should receive:

```text
CriticalEvent
```

plus its immutable context:

```text
event_type
current_metric
threshold
baseline
ratio
time_window
top dimensions
severity
```

For example:

```json
{
  "eventType": "TRAFFIC_SPIKE",
  "currentRate": 15000,
  "baselineRate": 500,
  "ratio": 30,
  "window": "5m",
  "severity": "critical"
}
```

AI doesn't need to query the analytics database to reconstruct what happened.

This makes the AI pipeline:

```text
deterministic
+
reproducible
+
auditable
```

---

# 7.253 Critical Event Idempotency

The rule engine itself can process duplicate events.

Suppose:

```text
evt_123
```

is processed twice.

The state machine must not create:

```text
critical_event_1
critical_event_2
```

for the same logical transition.

Therefore we need an idempotency key such as:

```text
rule_id
+
window_start
+
trigger_version
```

For example:

```text
rule_123:2026-08-19T14:00
```

Then enforce uniqueness at the durable event boundary.

This protects downstream:

```text
AI
notification
email
webhook
```

from duplicate critical events.

---

# 7.254 Current Critical-Event Architecture

We can now draw the entire subsystem:

```text
                     Analytics Stream
                            |
                            v
                    Stream Partition
                            |
                            v
                   Aggregate Processor
                            |
                            v
                   Candidate Rule Index
                            |
                            v
                    Relevant Rule Set
                            |
             ┌──────────────┼──────────────┐
             |              |              |
             v              v              v
          Counters        Windows       Baselines
             |              |              |
             └──────────────┼──────────────┘
                            v
                    Condition Evaluator
                            |
                            v
                     Rule State Machine
                            |
                    NORMAL → ACTIVE
                            |
                            v
                     Critical Event
                            |
                            v
                  Event Deduplication
                            |
                            v
                       AI / Template
                            |
                            v
                   Notification Queue
```

---

# 7.255 The Important Scale Boundary

At small scale, this entire system can be dramatically simpler.

Suppose Route.io has:

```text
10K users
1M analytics events/day
1K active rules
```

We could reasonably implement:

```text
Node.js worker
+
PostgreSQL
+
simple indexed rule queries
```

No distributed stream-processing system is justified yet.

At:

```text
50B events/day
+
millions of rules
```

that architecture fails because:

```text
raw event volume
+
rule evaluation volume
+
window state
```

become too large.

So the architecture transition is justified by the math:

```text
Small:
event → DB → evaluate rules

Large:
event → stream → indexed rules → stateful evaluation
```

---

# 7.256 Updated Route.io Architecture

We now have the following complete flow:

```text
                              CLIENT
                                |
                   ┌────────────┴────────────┐
                   |                         |
                Dashboard                 Redirect
                   |                         |
                   v                         v
             Load Balancer              Node.js API
                                             |
                         ┌───────────────────┼──────────────────┐
                         |                   |                  |
                         v                   v                  v
                       Redis             PostgreSQL        Event Queue
                         |               Transactional          |
                         |                    Data               |
                         |                                       |
                         |                              ┌────────┴────────┐
                         |                              |                 |
                         |                              v                 v
                         |                       Raw Event Store   Stream Processor
                         |                                                |
                         |                                   ┌────────────┴────────────┐
                         |                                   |                         |
                         |                                   v                         v
                         |                             Aggregation              Rule Engine
                         |                                   |                         |
                         |                                   |                  Critical Event
                         |                                   |                         |
                         |                                   |                         v
                         |                                   |                    AI / Template
                         |                                   |                         |
                         |                                   |                         v
                         |                                   |                 Notification Queues
                         |                                   |                  /       |       \
                         |                                   |                 Email  Webhook   Push
                         |                                   |
                         v                                   v
                    Analytics API  <──────────────── Aggregate Store
                         |
                         v
                     Dashboard
```

The system now has a very clear separation of concerns:

```text
PostgreSQL
→ transactional truth

Queue
→ asynchronous event transport

Analytics Store
→ historical event/query workload

Stream Processor
→ real-time aggregation

Rule Engine
→ deterministic critical-event detection

AI
→ communication drafting

Notification Workers
→ external delivery
```

---

# 7.257 Interview Defense: "Why Not Just Use Kafka Streams / Flink / etc.?"

At this point an interviewer may ask why we need a custom rule engine instead of simply using a stream-processing framework.

The correct answer is:

> "I would not implement distributed stream-processing primitives myself. The architectural requirement is a stateful partitioned stream processor with windowing and checkpointed state. In production, I would evaluate a mature stream-processing technology against our latency, throughput, operational, and ecosystem requirements. The custom Route.io logic would live primarily in the rule-evaluation layer rather than reinventing the underlying distributed stream runtime."

The important distinction is:

```text
Stream-processing infrastructure
```

versus:

```text
Route.io business logic
```

Route.io owns:

```text
rule semantics
threshold logic
hysteresis
cooldown
critical-event generation
```

The stream-processing platform owns:

```text
partitioning
offsets
checkpointing
state recovery
parallel execution
```

That is a much more defensible architecture.

---

# 7.258 What We Have Now

The core Route.io architecture is now effectively complete at the **tens/hundreds-of-millions-of-users scale**.

We have covered:

```text
1. URL shortening
2. Custom aliases
3. Optional expiration
4. Redirect path
5. Transactional database
6. Redis caching
7. Horizontal Node.js scaling
8. Analytics ingestion
9. Event queues
10. Analytics storage
11. Aggregation
12. Hot-key handling
13. Unique visitor estimation
14. Analytics caching
15. Rule indexing
16. Stateful rule evaluation
17. Sliding windows
18. Baselines
19. Hysteresis
20. Cooldown
21. Critical events
22. AI drafting
23. AI fallback
24. Notification queues
25. Per-channel delivery
26. Tenant rate limiting
27. Provider rate limiting
28. Retry/DLQ
29. Webhook idempotency
30. Delivery state
```

The next step should therefore be **putting all of these pieces together into the final end-to-end production architecture and then stress-testing it**.

We should specifically walk through a single request:

```text
User clicks short URL
        ↓
Redirect
        ↓
Analytics event
        ↓
Stream aggregation
        ↓
Rule evaluation
        ↓
Critical event
        ↓
AI-generated notification
        ↓
Email/Webhook
```

and calculate the **latency, throughput, CPU time, memory, storage growth, queue capacity, and failure behavior at every stage**. That will give us the final interview-level architecture rather than just a collection of individually scalable components.