# OOP Architecture Design Drills

Yes — you don't want a **project specification where I already tell you the entities, rules, and operations**.

You want to practice the actual skill a developer uses when an idea suddenly comes to mind:

> _"I want to build this application. Where do I start, what things exist, what should be objects, what should the use cases be, what does each use case need, and how do I turn those dependencies into ports and adapters?"_

So the exercise should begin with only a **rough product idea**, and you should progressively discover the architecture yourself.

---

# The Process We Will Practice

For every idea, you will go through these stages:

```text
        RAW IDEA
           ↓
   1. UNDERSTAND THE IDEA
           ↓
   2. IDENTIFY DOMAIN CONCEPTS
           ↓
   3. CLASSIFY THE CONCEPTS
      Entity / Value Object / Type
           ↓
   4. IDENTIFY BUSINESS RULES
           ↓
   5. IDENTIFY USE CASES
           ↓
   6. IDENTIFY EACH USE CASE'S
      RESPONSIBILITIES
           ↓
   7. IDENTIFY DEPENDENCIES
           ↓
   8. SEPARATE INTERNAL VS EXTERNAL
           ↓
   9. DESIGN PORTS
           ↓
  10. DESIGN ADAPTERS
           ↓
  11. DESIGN WIRING
```

The important part is that **I won't reveal the next layer until you've attempted the current one**.

---

# Drill 1 — "I Have an Idea"

Imagine you are talking to a friend who says:

> **"I want to build an app where people can save useful links. Each saved link should have a title and tags, and users should be able to organize their links into collections. Later, they should be able to search through their saved links."**

That's it.

There is no architecture yet.

There are no classes.

There are no repositories.

There are no APIs.

You are starting from a **product idea**.

---

## Question 1 — What Exists?

Before thinking about what the application does, ask:

> **What things exist in this problem domain?**

From the description:

```text
People can save links.

Links have titles and tags.

Links can belong to collections.

Users can search their links.
```

### Your task

Identify the potential **domain concepts**.

Don't worry about whether something is ultimately an entity or value object yet.

Write:

```text
Potential domain concepts:

1. ?
2. ?
3. ?
4. ?
...
```

### Important

Don't think about:

```text
MongoDB
Express
Controller
Repository
API
```

yet.

We're still asking:

> **"What exists in the business/domain?"**

---

# Question 2 — Which Ones Are Actually Types?

Now take the concepts you identified and classify them.

For each one, ask:

> Does this thing have its own identity and lifecycle?

If yes, it may be an **Entity**.

Ask:

> Is this primarily a descriptive value with no independent identity?

It may be a **Value Object**.

Ask:

> Is this simply a constrained category?

It may be a **domain type / enum / union**.

Create:

|Concept|Classification|Why?|
|---|---|---|
|?|Entity / Value Object / Type|?|
|?|Entity / Value Object / Type|?|

Don't create classes just because you can.

---

# Question 3 — What Does Each Object Own?

Now imagine your domain objects exist.

Ask:

> **What information belongs naturally to each object?**

For example, don't think:

```text
database columns
```

Think:

```text
What does this object know about itself?
```

For each entity, write:

```text
Object: ?

State:
- ?
- ?
- ?

Object: ?

State:
- ?
- ?
```

At this point you are designing **domain types**, not database schemas.

---

# Question 4 — What Can These Objects Do?

Now shift from **state** to **behavior**.

Ask:

> **What behavior naturally belongs to the object itself?**

For example, if an object has tags, should the system manipulate its internal tag collection directly?

Or should the object expose behavior such as:

```text
addTag()
removeTag()
```

You decide.

For each important object:

```text
Object: ?

Possible behavior:
- ?
- ?
- ?
```

This is where **encapsulation** begins to influence your design.

---

# Question 5 — What Rules Must Always Be True?

Now look at the idea again.

Ask:

> **What must never be allowed to happen?**

For example, think about questions like:

```text
Can a link have an empty URL?

Can a collection have no name?

Can the same link appear twice in one collection?

Can a user remove a link that doesn't belong to them?

Can the same tag appear twice on a link?
```

Don't assume the answers.

**You are the system designer.**

Write the business rules you believe the product should enforce.

Then classify each rule:

```text
Rule
 ↓
Which object should protect it?
```

This is critical.

---

# Question 6 — What Can the User Actually Do?

Now move from domain concepts to **application behavior**.

Ask:

> **What actions can someone perform in the system?**

Don't call them controllers.

Don't call them services.

Think in terms of **use cases**.

For example:

```text
User
 │
 ├── ?
 ├── ?
 ├── ?
 └── ?
```

Try to identify the smallest meaningful application actions.

---

# Question 7 — Give Each Use Case One Responsibility

Now take your use cases and ask:

> **What exactly is the responsibility of this use case?**

For example:

```text
Use Case: ?

Responsibility:
"..................................."
```

If you find yourself writing:

> "Manages links."

that's probably too vague.

Try to describe an actual application operation.

This is your **SRP exercise**.

---

# Question 8 — What Does Each Use Case Need?

Now we start moving toward architecture.

Take one use case.

For example, whichever one you think is the most interesting.

Write its workflow:

```text
SomeUseCase
    │
    ├── ?
    ├── ?
    ├── ?
    └── ?
```

Then ask for each dependency:

> **Can the use case do this itself using its own domain objects, or does it need something from outside?**

For example:

```text
Create something
    ↓
Needs an ID
    ↓
External capability?

Save something
    ↓
Needs persistence
    ↓
External capability?

Validate business rule
    ↓
Domain object
    ↓
Internal
```

This distinction is extremely important.

---

# Question 9 — Identify External Capabilities

Now imagine we eventually use:

```text
MongoDB
Redis
OpenSearch
S3
Email provider
```

**Don't create ports for these technologies.**

Instead ask:

> **What capability does the application actually need?**

For example:

```text
MongoDB
    ↓
What does the use case actually need?
    ↓
Store links
```

Therefore:

```text
LinkRepository
```

might be appropriate.

Likewise:

```text
OpenSearch
    ↓
search links
    ↓
LinkSearch
```

The technology comes later.

---

# Question 10 — Design the Ports

Now convert the required external capabilities into abstractions.

For each use case:

```text
Use Case
   ↓
Required capability
   ↓
Port
```

Create a table:

|Use Case|Required Capability|Port|
|---|---|---|
|?|?|?|
|?|?|?|
|?|?|?|

This is where you practice **DIP + ISP**.

---

# Question 11 — Challenge Your Interfaces

Now deliberately attack your own design.

Suppose you created:

```text
LinkRepository
```

with:

```text
create()
find()
update()
delete()
search()
archive()
restore()
```

Ask:

> **Does every client actually need all of these?**

If not, segregate them into meaningful capabilities.

For example:

```text
CreateLink
    ↓
?

SearchLinks
    ↓
?

DeleteLink
    ↓
?
```

Don't split interfaces just to make them small.

Split them when the **client dependency becomes more precise**.

---

# Question 12 — Now Choose Technologies

Only now are you allowed to say:

```text
MongoDB
Redis
OpenSearch
S3
```

For every port ask:

> **Which concrete technology will provide this capability?**

For example:

```text
LinkRepository
       ↑
MongoLinkRepository
```

or:

```text
LinkSearch
       ↑
OpenSearchLinkSearch
```

This gives you:

```text
Port
 ↑
Adapter
```

---

# Question 13 — What Should `wire.ts` Do?

Finally:

> **If you had to start the application tomorrow, which concrete objects would need to be created and connected?**

Draw:

```text
wire()
 │
 ├── ?
 ├── ?
 ├── ?
 │
 ├── UseCase
 ├── UseCase
 └── UseCase
```

Then show:

```text
Concrete Adapter
       ↓
Port
       ↓
Use Case
```

You have now derived the architecture from a **raw idea**.

---

# Drill 2 — Different Kind of Idea

Now imagine you have another random idea:

> **"I want to build a website where developers can create coding challenges. Other developers can submit solutions, and the system should run those solutions against test cases and tell them whether they passed."**

Don't think about Docker yet.

Don't think about Kubernetes.

Don't think about Judge0.

Don't think about Redis.

Start from the idea.

### Your questions:

```text
1. What things exist?

2. Which things are entities?

3. Which things are value objects?

4. What domain types exist?

5. What does each object own?

6. What behavior belongs to each object?

7. What business rules exist?

8. What can users do?

9. What are the use cases?

10. What does each use case need?

11. Which dependencies are external?

12. What capabilities do those dependencies provide?

13. What ports represent those capabilities?

14. What adapters implement those ports?

15. How does wire.ts construct everything?
```

This one is harder because you will encounter concepts such as:

```text
Challenge
Submission
TestCase
Execution
Result
```

but **I am intentionally not telling you which of these should become entities, value objects, or merely domain data**.

---

# Drill 3 — Random Product Idea

Here's another one:

> **"I want to build a small appointment booking application. Users can find available time slots for a service provider and book one. A booked slot shouldn't be available to someone else, and users should be able to cancel their appointments."**

Now start again.

Don't jump to:

```text
AppointmentRepository
```

Start at:

```text
What exists?
```

Then:

```text
What can happen?
```

Then:

```text
What does each action need?
```

Then:

```text
What is external?
```

Then:

```text
What port represents that external capability?
```

Then:

```text
What adapter provides it?
```

Then:

```text
How do I wire it?
```

---

# The Pattern I Want You to Internalize

Eventually, when somebody says:

> "I have an idea for an application."

your brain should automatically move through:

```text
                    I HAVE AN IDEA
                          │
                          ▼
                 ┌─────────────────┐
                 │ WHAT EXISTS?    │
                 └────────┬────────┘
                          ↓
                    DOMAIN TYPES
                          │
                          ▼
                 ┌─────────────────┐
                 │ WHAT IS TRUE?   │
                 └────────┬────────┘
                          ↓
                 DOMAIN INVARIANTS
                          │
                          ▼
                 ┌─────────────────┐
                 │ WHAT CAN HAPPEN?│
                 └────────┬────────┘
                          ↓
                     USE CASES
                          │
                          ▼
                 ┌─────────────────┐
                 │ WHAT IS NEEDED? │
                 └────────┬────────┘
                          ↓
                    DEPENDENCIES
                          │
                          ▼
                 ┌─────────────────┐
                 │ OUTSIDE CORE?   │
                 └────────┬────────┘
                          ↓
                       PORTS
                          │
                          ▼
                    ADAPTERS
                          │
                          ▼
                       WIRE
```

## The Key Habit

The biggest mistake to avoid is **jumping layers**.

Don't do:

```text
Idea
 ↓
MongoDB
 ↓
Repository
 ↓
Controller
 ↓
Service
```

Do:

```text
Idea
 ↓
Domain
 ↓
Behavior
 ↓
Use Cases
 ↓
Dependencies
 ↓
Ports
 ↓
Adapters
 ↓
Wire
```

And one more rule:

> **At every stage, ask what the previous stage logically requires before creating the next stage.**

That makes the architecture **derived rather than memorized**.

### Your First Drill

Start with **Drill 1 — LinkVault**.

Give me only your answer to **Question 1: "What exists in this domain?"**

Don't move to entities or use cases yet. I'll evaluate your identification, point out false positives/omissions, and then give you **Question 2**. This will make the exercise genuinely progressive rather than giving you the entire solution upfront.