# Architecture Design Exercise — From Requirements → Domain → Use Cases → Ports → Adapters → Wiring

Yes. This is the **right next exercise**.

You've learned the individual OOP mechanisms; now we need to practice the _architectural deduction process_. The goal is that when someone gives you a completely unfamiliar application, you can move from a blank project to a reasonable Clean/Hexagonal design without being given the folders or interfaces first.

We will therefore **not implement a project immediately**. First, you'll receive requirements and practice deriving the architecture in the correct order.

---

# 1. The Architecture Derivation Pipeline

This is the process you should memorize:

```text
                    REQUIREMENTS
                         │
                         ▼
               1. DOMAIN ANALYSIS
                         │
                         ▼
               2. DOMAIN TYPES
             Entities / Value Objects
                         │
                         ▼
                3. USE CASES
              Application Actions
                         │
                         ▼
            3. USE-CASE DEPENDENCIES
                         │
                         ▼
                   5. PORTS
            Interfaces for capabilities
                         │
                         ▼
                  6. ADAPTERS
         Concrete technical implementations
                         │
                         ▼
                   7. WIRING
              Composition Root
```

There is an important distinction here:

```text
Domain
    ↓
"What things exist?"

Use Case
    ↓
"What can the system do?"

Dependency
    ↓
"What does this action need?"

Port
    ↓
"What capability does it require?"

Adapter
    ↓
"How will we provide that capability?"

Wire
    ↓
"Which concrete implementations are connected?"
```

This distinction should become automatic.

---

# 2. The Four Questions You Should Ask

When receiving requirements, train yourself to ask exactly these questions.

### Question 1 — What exists?

This identifies:

```text
Entities
Value Objects
Domain types
```

### Question 2 — What can the system do?

This identifies:

```text
Use cases
```

### Question 3 — What does each use case need?

This identifies:

```text
Dependencies
```

### Question 4 — Which dependencies are outside the core?

This identifies:

```text
Ports
Adapters
```

Then:

```text
Who connects everything?
        ↓
Wire
```

---

# 3. Exercise Format

We'll do **three progressively harder exercises**.

|Exercise|Domain|Difficulty|Main Focus|
|---|---|--:|---|
|1|Library|Beginner|Entities → Use Cases|
|2|Food Delivery|Intermediate|Dependencies → Ports|
|3|Job Platform|Advanced|Complete architecture deduction|

You should solve each exercise **before looking at the solution**.

---

# Exercise 1 — **Library Management System**

## Requirements

Build the core of a library management system.

A library has books.

A registered member can borrow books and return them.

The system must support:

```text
Register Member
Add Book
Borrow Book
Return Book
Get Book
Get Member
```

---

## Business Rules

### Book

A book has:

```text
ISBN
title
author
```

A book can be:

```text
AVAILABLE
BORROWED
```

A borrowed book cannot be borrowed again.

---

### Member

A member has:

```text
memberId
name
```

A member can borrow at most **5 books** simultaneously.

---

### Borrowing

When a member borrows a book:

```text
Book
AVAILABLE
    ↓
BORROWED
```

The book becomes associated with the member.

When returned:

```text
Book
BORROWED
    ↓
AVAILABLE
```

---

# Your Task

Do **not code yet**.

Produce these five things.

### Part A — Identify Domain Types

From the requirements, identify:

```text
Entities:
?

Value Objects:
?

Enums / other domain types:
?
```

Don't create a type just because a noun appears in the requirements.

Explain why each identified type deserves to exist.

---

### Part B — Identify Use Cases

Find the application actions.

For example:

```text
RegisterMember
?
?
?
```

For every use case, write one sentence describing its responsibility.

---

### Part C — Determine Use-Case Dependencies

For each use case, ask:

> "What information or capability does this use case need from somewhere else?"

Create a table:

|Use Case|Needs|
|---|---|
|RegisterMember|?|
|AddBook|?|
|BorrowBook|?|
|ReturnBook|?|
|GetBook|?|
|GetMember|?|

Don't name technologies yet.

For example, don't write:

```text
MongoDB
```

Write:

```text
Something capable of storing books.
```

---

### Part D — Convert External Dependencies Into Ports

Now transform those capabilities into interfaces.

For example:

```text
"Something capable of storing books"
              ↓
BookRepository
```

But don't automatically create a generic repository.

Determine what the **use case actually requires**.

You may end up with:

```text
BookReader
BookCreator
BookUpdater
MemberReader
MemberCreator
```

or fewer interfaces.

Explain your decision.

---

### Part E — Identify Adapters

Only now think about implementations.

For the first version:

```text
InMemoryBookRepository
InMemoryMemberRepository
```

Later:

```text
MongoBookRepository
MongoMemberRepository
```

Then explain:

```text
Which port does each adapter implement?
```

---

### Part F — Wiring

Finally design:

```text
wireLibraryModule()
```

Conceptually:

```text
wire
 │
 ├── BookRepository implementation
 ├── MemberRepository implementation
 │
 ├── RegisterMember
 ├── AddBook
 ├── BorrowBook
 ├── ReturnBook
 ├── GetBook
 └── GetMember
```

Don't implement it yet.

Just draw the object graph.

---

# 4. The Most Important Part of Exercise 1

Pay special attention to this requirement:

> A member can borrow at most 5 books.

Ask yourself:

```text
Where should this rule live?
```

Possible answers:

```text
Controller?
Use case?
Member entity?
Repository?
```

You need to reason about **who owns the rule**.

Don't automatically put every rule into the use case.

Similarly:

> A borrowed book cannot be borrowed again.

Ask:

```text
Who owns the state transition?
```

This is deliberate practice for **encapsulation and domain responsibility**.

---

# Exercise 2 — **Food Delivery System**

After Library, we'll increase the complexity.

## Requirements

Build the core of a food delivery platform.

Customers can:

```text
Create account
Place order
Cancel order
View order
```

Restaurants can:

```text
Create restaurant
Add menu item
```

Orders contain menu items.

An order progresses through:

```text
PLACED
CONFIRMED
PREPARING
READY
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
```

---

# 5. Business Rules

### Order

An order:

```text
must contain at least one item
```

Once:

```text
DELIVERED
```

it cannot be cancelled.

---

### Cancellation

An order can be cancelled only while:

```text
PLACED
CONFIRMED
```

It cannot be cancelled while:

```text
PREPARING
READY
OUT_FOR_DELIVERY
DELIVERED
```

---

### Restaurant

A restaurant can have multiple menu items.

Each menu item has:

```text
id
name
price
availability
```

Unavailable items cannot be ordered.

---

# 6. Additional Technical Requirements

When an order is placed:

```text
1. Validate restaurant
2. Validate menu items
3. Calculate total
4. Create order
5. Save order
6. Charge customer
7. Publish OrderPlaced event
```

Now the architecture exercise becomes more interesting.

Ask:

```text
What is domain logic?
What is application orchestration?
What is external technology?
```

---

# 7. Your Exercise 2 Analysis

Identify:

### Domain types

```text
Entities:
?

Value Objects:
?

Enums:
?
```

Possible concepts include:

```text
Customer
Restaurant
MenuItem
Order
OrderItem
Money
```

But **you decide** which are actually domain types and what kind.

---

### Use Cases

Identify operations such as:

```text
CreateCustomer
CreateRestaurant
AddMenuItem
PlaceOrder
CancelOrder
GetOrder
```

But again, derive them from requirements.

---

# 8. Dependency Identification

Now focus on:

```text
PlaceOrder
```

Write the workflow:

```text
PlaceOrder
    │
    ├── ?
    ├── ?
    ├── ?
    ├── ?
    └── ?
```

Then classify each requirement.

For example:

```text
Validate menu item
        ↓
Domain/application logic

Save order
        ↓
External dependency

Charge customer
        ↓
External dependency

Publish event
        ↓
External dependency
```

---

# 9. Derive Ports

You might eventually discover capabilities such as:

```text
RestaurantReader
OrderRepository
PaymentGateway
EventPublisher
```

But there is a critical exercise here:

Don't create:

```text
PaymentService
```

just because payment exists.

Ask:

> **What does the use case actually need from payment?**

Maybe:

```ts
interface PaymentGateway {
  charge(
    customerId: string,
    amount: Money,
  ): Promise<PaymentResult>;
}
```

That's a capability-oriented port.

---

# 10. Adapter Identification

Now imagine:

```text
PaymentGateway
       ▲
       │
StripePaymentGateway
```

and:

```text
EventPublisher
       ▲
       │
RabbitMQEventPublisher
```

and:

```text
OrderRepository
       ▲
       │
MongoOrderRepository
```

Notice what happened.

We went:

```text
Requirement
    ↓
Use case
    ↓
Dependency
    ↓
Port
    ↓
Adapter
```

**Never start from Stripe, MongoDB, or RabbitMQ.**

They appear only after the application's requirements tell us that those capabilities are needed.

---

# Exercise 3 — **Job Platform**

This is the advanced exercise.

You are designing the core of a job platform similar to a simplified LinkedIn/Indeed.

---

# 11. Requirements

Companies can:

```text
Create company
Create job
Close job
```

Candidates can:

```text
Create candidate profile
Apply for job
Withdraw application
```

Recruiters can:

```text
Review application
Move application through hiring stages
```

---

# 12. Job Lifecycle

A job can be:

```text
DRAFT
PUBLISHED
CLOSED
```

Valid transitions:

```text
DRAFT
  ↓
PUBLISHED
  ↓
CLOSED
```

A closed job cannot receive applications.

---

# 13. Application Lifecycle

An application can be:

```text
SUBMITTED
UNDER_REVIEW
INTERVIEW
OFFERED
REJECTED
WITHDRAWN
```

You must determine valid transitions.

For example:

```text
SUBMITTED
    ↓
UNDER_REVIEW
    ↓
INTERVIEW
    ↓
OFFERED
```

and:

```text
SUBMITTED
    ↓
WITHDRAWN
```

You should define the complete transition rules.

---

# 14. Application Rules

A candidate:

- cannot apply to the same job twice;
    
- cannot apply to a closed job;
    
- cannot withdraw after an offer;
    
- cannot modify an application after rejection.
    

A recruiter:

- can review applications;
    
- can move applications between valid stages.
    

---

# 15. Additional Requirements

When a candidate applies:

```text
1. Find candidate
2. Find job
3. Verify job is published
4. Verify candidate hasn't already applied
5. Create application
6. Persist application
7. Publish ApplicationSubmitted event
8. Send notification
```

Now you have several categories of dependency.

---

# 16. Your Advanced Analysis

Start with:

```text
Candidate
Company
Job
Application
Notification
```

Ask:

> Which are domain concepts?

Then:

```text
What are the use cases?
```

Then for:

```text
ApplyForJob
```

identify:

```text
What does it need?
```

Then classify every dependency:

|Requirement|Category|
|---|---|
|Candidate exists|Domain/application|
|Job is published|Domain/application|
|Duplicate application check|Domain/application|
|Save application|External capability|
|Publish event|External capability|
|Send notification|External capability|

Then derive:

```text
Ports
   ↓
Adapters
   ↓
Wire
```

---

# 17. The Critical Classification Exercise

This is where I want you to become very precise.

Suppose:

```text
ApplyForJob
```

needs to send a notification.

Don't immediately write:

```ts
NotificationService
```

Ask:

> **What capability does the application need?**

Maybe:

```ts
interface NotificationSender {
  send(
    notification: Notification,
  ): Promise<void>;
}
```

Then:

```text
NotificationSender
        ▲
        │
EmailNotificationSender
```

or:

```text
NotificationSender
        ▲
        │
RabbitMQNotificationSender
```

The application doesn't care.

This is the exact reasoning behind ports and adapters.

---

# 18. The Architecture Pattern You Should Discover

After solving all three exercises, you should repeatedly arrive at:

```text
                  REQUIREMENTS
                       │
                       ▼
                DOMAIN MODEL
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
         ENTITIES          VALUE OBJECTS
             │
             ▼
          USE CASES
             │
             ▼
       REQUIRED CAPABILITIES
             │
             ▼
            PORTS
             ▲
             │
          ADAPTERS
             │
             ▼
     EXTERNAL TECHNOLOGIES
```

Then:

```text
                 WIRE
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
     Adapter   Adapter   Adapter
        │         │         │
        └─────────┼─────────┘
                  ▼
              Use Cases
```

---

# 19. The Most Important Distinction

There are **three different things** you must learn to distinguish.

### Domain

Answers:

> **What is true in the business?**

Example:

```text
A closed job cannot receive applications.
```

### Use Case

Answers:

> **What does the application do?**

Example:

```text
ApplyForJob
```

### Port

Answers:

> **What external capability does the use case require?**

Example:

```text
ApplicationRepository
NotificationSender
EventPublisher
```

Then:

### Adapter

Answers:

> **How is that capability technically provided?**

Example:

```text
MongoApplicationRepository
EmailNotificationSender
RabbitMQEventPublisher
```

And finally:

### Wire

Answers:

> **Which implementations are actually connected?**

Example:

```text
ApplicationRepository
        ↑
MongoApplicationRepository
```

---

# 20. One More Important Distinction

Not everything becomes a port.

Suppose:

```text
ApplyForJob
```

needs to determine:

```text
job.isPublished()
```

That is not an external dependency.

That's domain behavior.

Don't create:

```ts
interface JobStatusChecker
```

for it.

Instead:

```text
ApplyForJob
      ↓
Job
      ↓
job.isPublished()
```

This distinction prevents **over-engineering**.

---

# 21. Your Decision Tree

When you encounter a requirement, use this decision tree:

```text
Does this represent a business concept?
        │
       YES
        ↓
Domain type

        │
       NO
        ↓
Is this something the application does?
        │
       YES
        ↓
Use case

        │
       NO
        ↓
Does the use case need an external capability?
        │
       YES
        ↓
Port

        │
       NO
        ↓
Probably ordinary application logic
```

Then for every port:

```text
Who provides it?
        ↓
Adapter
```

Then:

```text
Who connects the adapter?
        ↓
Wire
```

---

# 22. The Architecture Notebook Method

For future projects, I recommend that you literally create a design sheet before coding.

Use:

```text
PROJECT:
__________

DOMAIN TYPES:
__________

DOMAIN RULES:
__________

USE CASES:
__________

USE CASE → DEPENDENCIES:
__________

PORTS:
__________

ADAPTERS:
__________

COMPOSITION:
__________

ENTRYPOINT:
__________
```

This becomes your **architecture discovery document**.

Only after completing it should you start creating source files.

---

# 23. Your Practice Order

Don't solve all three simultaneously.

Do:

```text
Exercise 1
Library
   ↓
Domain identification
   ↓
Use cases
   ↓
Dependencies
   ↓
Ports
   ↓
Adapters
   ↓
Wire
```

Then:

```text
Exercise 2
Food Delivery
```

Then:

```text
Exercise 3
Job Platform
```

The difficulty progression is intentional:

```text
Library
  ↓
few entities
few rules
few dependencies

Food Delivery
  ↓
multiple aggregates
payment
events
notifications

Job Platform
  ↓
multiple actors
state machines
cross-domain relationships
events
notifications
more complex dependencies
```

---

# 24. How I Want You to Solve These

For each exercise, **do not give me code initially**.

Give me only:

```text
1. Domain Types
2. Why each type exists
3. Domain rules
4. Use Cases
5. Responsibility of each use case
6. Dependencies of each use case
7. Ports derived from those dependencies
8. Adapters
9. Wire/object graph
```

Then I will review your design like a senior backend engineer:

```text
✓ Correct
⚠ Potentially unnecessary
✗ Wrong responsibility
✗ Wrong dependency direction
→ Move this responsibility
→ Split this interface
→ Merge these abstractions
```

Only after the **design is approved** will we implement it.

That is the exercise that will train the exact skill you're looking for: **starting with a blank application and systematically deriving a Clean/Hexagonal OOP architecture instead of memorizing a folder structure.**