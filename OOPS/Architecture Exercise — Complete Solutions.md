# Architecture Exercise — Complete Solutions

Below are the **professional reference solutions** for all three exercises. The important part is not memorizing the names; study the **derivation**:

```text
Requirements
    ↓
Domain types
    ↓
Domain rules
    ↓
Use cases
    ↓
Use-case dependencies
    ↓
Ports
    ↓
Adapters
    ↓
Wire
```

I’ll also point out where there is **more than one valid design**, because architecture is rarely a matter of one universally correct folder or interface.

---

# Exercise 1 — Library Management System

## 1. Domain Analysis

From the requirements:

```text
Library
Book
Member
Borrowing
```

We need to determine which concepts deserve domain objects.

### Domain Types

|Type|Classification|Reason|
|---|---|---|
|`Book`|Entity|Has identity and mutable lifecycle|
|`Member`|Entity|Has identity and owns borrowing state|
|`BookStatus`|Enum|Finite domain state|
|`ISBN`|Value Object|Has validation/identity semantics independent of behavior|
|`Borrowing`|Potential Entity|Represents a borrowing relationship/history if history matters|

For our simplified version, I would use:

```text
Book
Member
ISBN
BookStatus
```

and represent the current borrowing relationship through `Member`/`Book`.

If the system later needs borrowing history, due dates, overdue tracking, etc., I would introduce:

```text
Borrowing
```

as a separate domain entity.

---

# 2. `Book`

The book needs:

```text
id
isbn
title
author
status
```

But the important question is:

> Who should control `status`?

Not the controller.

Not the repository.

The `Book` itself should own its state transition.

Conceptually:

```text
Book
 │
 ├── borrow()
 └── returnBook()
```

Therefore:

```text
AVAILABLE
    │
    │ borrow()
    ▼
BORROWED
    │
    │ returnBook()
    ▼
AVAILABLE
```

Invalid:

```text
BORROWED
    │
    │ borrow()
    ▼
ERROR
```

This is **encapsulation + invariant protection**.

---

# 3. `Member`

A member has:

```text
memberId
name
borrowedBooks
```

The important business rule is:

> A member cannot borrow more than 5 books.

Therefore the member should have behavior such as:

```text
member.borrowBook(book)
member.returnBook(book)
```

rather than allowing:

```text
member.borrowedBooks.push(book)
```

The entity should protect:

```text
borrowedBooks.length <= 5
```

So the responsibility becomes:

```text
Member
    ↓
Controls its borrowing collection
    ↓
Enforces maximum of 5 books
```

---

# 4. Domain Rules

The final domain rules are:

```text
Book
├── must have valid ISBN
├── must have title
├── must have author
└── cannot be borrowed while BORROWED

Member
├── must have valid ID
├── must have name
└── cannot have more than 5 borrowed books
```

And:

```text
Borrowing
├── book must be AVAILABLE
└── member must have capacity
```

---

# 5. Use Cases

Now ask:

> What can the application actually do?

We get:

```text
RegisterMember
AddBook
BorrowBook
ReturnBook
GetBook
GetMember
```

Their responsibilities:

|Use Case|Responsibility|
|---|---|
|`RegisterMember`|Create and persist a member|
|`AddBook`|Create and persist a book|
|`BorrowBook`|Coordinate borrowing of a book by a member|
|`ReturnBook`|Coordinate returning a borrowed book|
|`GetBook`|Retrieve a book|
|`GetMember`|Retrieve a member|

Notice:

```text
Book.borrow()
```

is **domain behavior**.

While:

```text
BorrowBook
```

is **application orchestration**.

That's an important distinction.

---

# 6. `BorrowBook` Dependency Analysis

Start from the use case:

```text
BorrowBook
```

What does it need?

```text
Find member
Find book
Update member
Update book
```

So conceptually:

```text
BorrowBook
   │
   ├── MemberReader
   ├── BookReader
   ├── MemberUpdater
   └── BookUpdater
```

But we should think about whether this is too fragmented.

A more practical design could be:

```text
MemberRepository
BookRepository
```

if those interfaces remain cohesive.

However, because we're specifically practicing ISP, a client-specific design is useful:

```text
MemberReader
MemberWriter
BookReader
BookWriter
```

Then `BorrowBook` depends only on the capabilities it actually uses.

---

# 7. Ports

A reasonable port design is:

```ts
interface MemberReader {
  findById(memberId: string): Promise<Member | null>;
}

interface MemberWriter {
  save(member: Member): Promise<void>;
}

interface BookReader {
  findById(bookId: string): Promise<Book | null>;
}

interface BookWriter {
  save(book: Book): Promise<void>;
}
```

Why `save()` instead of `update()`?

Because from the application's perspective:

> "Persist this new state."

It doesn't necessarily care whether the adapter internally performs:

```text
INSERT
UPDATE
UPSERT
```

That's a good abstraction.

---

# 8. Adapters

Initially:

```text
InMemoryMemberRepository
InMemoryBookRepository
```

They implement the relevant ports.

Conceptually:

```text
InMemoryMemberRepository
    ├── MemberReader
    └── MemberWriter

InMemoryBookRepository
    ├── BookReader
    └── BookWriter
```

Later:

```text
MongoMemberRepository
MongoBookRepository
```

could implement the exact same ports.

---

# 9. Library Object Graph

The composition root might produce:

```text
wireLibraryModule()
        │
        ├── MemberRepository
        ├── BookRepository
        │
        ├── RegisterMember
        ├── AddBook
        ├── BorrowBook
        ├── ReturnBook
        ├── GetMember
        └── GetBook
```

For `BorrowBook`:

```text
BorrowBook
   │
   ├── MemberReader
   │       ▲
   │       │
   │   MemberRepository
   │
   ├── BookReader
   │       ▲
   │       │
   │    BookRepository
   │
   ├── MemberWriter
   │       ▲
   │       │
   │   MemberRepository
   │
   └── BookWriter
           ▲
           │
       BookRepository
```

That's a complete dependency graph.

---

# Exercise 1 Final Architecture

```text
                  BorrowBook
                  /        \
                 /          \
                ▼            ▼
         MemberReader     BookReader
              ▲               ▲
              │               │
        MemberAdapter     BookAdapter
              ▲               ▲
              │               │
         MemberWriter     BookWriter
```

The important thing isn't the exact number of interfaces.

The important thing is:

```text
Domain
  ↓
Use Case
  ↓
Port
  ↑
Adapter
```

---

# Exercise 2 — Food Delivery System

Now complexity increases significantly.

---

# 10. Domain Types

From the requirements:

```text
Customer
Restaurant
MenuItem
Order
OrderItem
Money
```

I would classify them as:

|Type|Classification|
|---|---|
|`Customer`|Entity|
|`Restaurant`|Entity|
|`MenuItem`|Entity|
|`Order`|Entity / Aggregate Root|
|`OrderItem`|Value Object or Entity depending on requirements|
|`Money`|Value Object|
|`OrderStatus`|Enum|
|`MenuItemAvailability`|Enum|

---

# 11. Why Is `Order` Special?

`Order` is the main object coordinating order state.

It owns:

```text
Order
├── id
├── customerId
├── restaurantId
├── items
├── total
└── status
```

The order should control state transitions.

For example:

```text
PLACED
   ↓
CONFIRMED
   ↓
PREPARING
   ↓
READY
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
```

And:

```text
PLACED ─────→ CANCELLED
CONFIRMED ──→ CANCELLED
```

But:

```text
PREPARING → CANCELLED
```

is invalid.

Therefore don't expose:

```ts
order.status = ...
```

Instead use domain behavior:

```text
order.confirm()
order.startPreparing()
order.markReady()
order.dispatch()
order.deliver()
order.cancel()
```

---

# 12. `Money`

Again:

```text
Money
├── amount
└── currency
```

It should handle:

```text
add
subtract
compare
```

and protect:

```text
negative money
currency mismatch
```

This prevents pricing logic from becoming primitive-number manipulation throughout the system.

---

# 13. `OrderItem`

An order item represents:

```text
menuItem
quantity
unitPrice
```

The total should be derived:

```text
unitPrice × quantity
```

For example:

```text
Pizza
₹300
quantity = 2

OrderItem total
= ₹600
```

The order should calculate its total from its items rather than accepting arbitrary externally calculated totals.

This is another example of **encapsulation**.

---

# 14. Domain Rules

The major rules are:

```text
Order
├── must contain at least one item
├── items must be available
├── total must be calculated
├── valid status transitions only
└── delivered orders cannot be cancelled
```

Restaurant rules:

```text
Restaurant
└── owns menu items
```

Menu item:

```text
MenuItem
├── has price
└── can be available/unavailable
```

---

# 15. Use Cases

We can derive:

```text
CreateCustomer
CreateRestaurant
AddMenuItem
PlaceOrder
CancelOrder
GetOrder
```

Potentially:

```text
ConfirmOrder
StartPreparingOrder
MarkOrderReady
DispatchOrder
DeliverOrder
```

But whether these deserve separate use cases depends on the application's API and actors.

For this exercise, they are reasonable because each represents a distinct application action.

---

# 16. Analyze `PlaceOrder`

This is where architecture becomes interesting.

Requirements:

```text
PlaceOrder
│
├── find customer
├── find restaurant
├── validate menu items
├── calculate order
├── create order
├── save order
├── charge customer
└── publish event
```

Now classify these.

### Domain logic

```text
Validate item availability
Calculate total
Validate order rules
```

### External capabilities

```text
Retrieve customer
Retrieve restaurant
Save order
Charge payment
Publish event
```

This distinction is crucial.

---

# 17. Ports for `PlaceOrder`

A reasonable design:

```ts
interface CustomerReader {
  findById(id: string): Promise<Customer | null>;
}

interface RestaurantReader {
  findById(id: string): Promise<Restaurant | null>;
}

interface OrderWriter {
  save(order: Order): Promise<void>;
}

interface PaymentGateway {
  charge(
    customerId: string,
    amount: Money,
  ): Promise<PaymentResult>;
}

interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
```

Notice the last two:

```text
PaymentGateway
EventPublisher
```

are clearly external capabilities.

---

# 18. Why `PaymentGateway` Is a Port

The use case needs:

```text
"Charge the customer."
```

It does **not** need:

```text
"Use Stripe."
```

Therefore:

```text
PaymentGateway
```

belongs at the abstraction boundary.

Later:

```text
PaymentGateway
      ▲
      │
StripePaymentGateway
```

or:

```text
PaymentGateway
      ▲
      │
RazorpayPaymentGateway
```

The use case remains unchanged.

This is:

```text
DIP
+
OCP
+
Polymorphism
```

---

# 19. Why `EventPublisher` Is a Port

The use case says:

```text
"Publish OrderPlaced."
```

It doesn't care whether the event goes through:

```text
Node EventEmitter
RabbitMQ
Kafka
SNS
```

Therefore:

```text
EventPublisher
```

is the port.

Adapters could be:

```text
InProcessEventPublisher
RabbitMQEventPublisher
KafkaEventPublisher
```

---

# 20. Food Delivery Adapters

Initial implementation:

```text
InMemoryCustomerRepository
InMemoryRestaurantRepository
InMemoryOrderRepository
FakePaymentGateway
InProcessEventPublisher
```

Production possibilities:

```text
MongoCustomerRepository
MongoRestaurantRepository
MongoOrderRepository
StripePaymentGateway
RabbitMQEventPublisher
```

The core remains unchanged.

---

# 21. Food Delivery Wiring

Conceptually:

```text
wireFoodDeliveryModule()
          │
          ├── CustomerRepository
          ├── RestaurantRepository
          ├── OrderRepository
          ├── PaymentGateway
          ├── EventPublisher
          │
          ├── CreateCustomer
          ├── CreateRestaurant
          ├── AddMenuItem
          ├── PlaceOrder
          ├── CancelOrder
          └── GetOrder
```

For `PlaceOrder`:

```text
PlaceOrder
    │
    ├── CustomerReader
    ├── RestaurantReader
    ├── OrderWriter
    ├── PaymentGateway
    └── EventPublisher
```

That's a realistic application-service dependency graph.

---

# Exercise 3 — Job Platform

This is the most architecturally interesting one.

---

# 22. Domain Types

From the requirements:

```text
Candidate
Company
Job
Application
```

Potential supporting types:

```text
CandidateProfile
JobTitle
ApplicationStatus
JobStatus
```

Classification:

|Type|Classification|
|---|---|
|`Candidate`|Entity|
|`Company`|Entity|
|`Job`|Entity / Aggregate Root|
|`Application`|Entity / Aggregate Root|
|`JobStatus`|Enum/value type|
|`ApplicationStatus`|Enum/value type|

---

# 23. `Job`

The job owns its lifecycle:

```text
DRAFT
   ↓
PUBLISHED
   ↓
CLOSED
```

Therefore:

```text
job.publish()
job.close()
```

should control transitions.

Not:

```ts
job.status = 'PUBLISHED';
```

---

# 24. `Application`

The application owns its hiring lifecycle:

```text
SUBMITTED
    ↓
UNDER_REVIEW
    ↓
INTERVIEW
    ↓
OFFERED
```

Alternative terminal states:

```text
SUBMITTED
    ↓
WITHDRAWN
```

or:

```text
UNDER_REVIEW
    ↓
REJECTED
```

The entity should prevent illegal transitions.

For example:

```text
OFFERED → REJECTED
```

may be forbidden according to our chosen rules.

Again:

> **The object protects the state machine.**

---

# 25. Use Cases

From the requirements:

```text
CreateCompany
CreateJob
PublishJob
CloseJob

CreateCandidateProfile
ApplyForJob
WithdrawApplication

ReviewApplication
MoveApplicationStage

GetJob
GetApplication
```

The exact granularity can vary.

The important thing is that these represent **application actions**, not database operations.

---

# 26. Analyze `ApplyForJob`

Requirement:

```text
ApplyForJob
│
├── find candidate
├── find job
├── verify job published
├── check duplicate application
├── create application
├── save application
├── publish event
└── send notification
```

Now classify:

### Domain

```text
job.isPublished()
application rules
duplicate application business rule
```

### External capabilities

```text
candidate retrieval
job retrieval
application persistence
event publishing
notification sending
```

---

# 27. Ports

A reasonable design:

```ts
interface CandidateReader {
  findById(id: string): Promise<Candidate | null>;
}

interface JobReader {
  findById(id: string): Promise<Job | null>;
}

interface ApplicationReader {
  findByCandidateAndJob(
    candidateId: string,
    jobId: string,
  ): Promise<Application | null>;
}

interface ApplicationWriter {
  save(
    application: Application,
  ): Promise<void>;
}

interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

interface NotificationSender {
  send(
    notification: Notification,
  ): Promise<void>;
}
```

Now the dependency graph becomes:

```text
ApplyForJob
    │
    ├── CandidateReader
    ├── JobReader
    ├── ApplicationReader
    ├── ApplicationWriter
    ├── EventPublisher
    └── NotificationSender
```

This is a very realistic application-service boundary.

---

# 28. Why Duplicate Checking Is a Port

The application needs to answer:

> "Does this candidate already have an application for this job?"

It doesn't need:

```text
MongoDB.findOne(...)
```

Therefore the application asks for a capability:

```ts
findByCandidateAndJob(...)
```

The adapter decides how to implement it:

```text
MongoDB
PostgreSQL
InMemory
```

This is exactly the abstraction principle we have been practicing.

---

# 29. Job Platform Adapters

Development:

```text
InMemoryCandidateRepository
InMemoryJobRepository
InMemoryApplicationRepository
InProcessEventPublisher
FakeNotificationSender
```

Production:

```text
MongoCandidateRepository
MongoJobRepository
MongoApplicationRepository
KafkaEventPublisher
EmailNotificationSender
```

Again:

```text
Use Case
   ↓
Port
   ↑
Adapter
```

---

# 30. Job Platform Wiring

The composition root might look conceptually like:

```text
wireJobPlatformModule()
          │
          ├── CandidateRepository
          ├── JobRepository
          ├── ApplicationRepository
          ├── EventPublisher
          ├── NotificationSender
          │
          ├── CreateCompany
          ├── CreateJob
          ├── PublishJob
          ├── CloseJob
          ├── CreateCandidateProfile
          ├── ApplyForJob
          ├── WithdrawApplication
          ├── ReviewApplication
          └── MoveApplicationStage
```

The use cases know only their required interfaces.

---

# 31. Compare All Three Projects

Now look at the same reasoning pattern across completely different domains.

|Stage|Library|Food Delivery|Job Platform|
|---|---|---|---|
|Entity|`Book`, `Member`|`Order`, `Restaurant`|`Job`, `Application`|
|Value Object|`ISBN`|`Money`|Possibly profile/value types|
|State|`AVAILABLE/BORROWED`|Order lifecycle|Job/application lifecycle|
|Use Case|`BorrowBook`|`PlaceOrder`|`ApplyForJob`|
|External dependency|Storage|Payment/event bus/storage|Storage/events/notifications|
|Port|`BookReader`|`PaymentGateway`|`NotificationSender`|
|Adapter|In-memory repo|Stripe adapter|Email adapter|
|Wire|`wireLibraryModule()`|`wireFoodDeliveryModule()`|`wireJobPlatformModule()`|

The technology changes.

The reasoning doesn't.

---

# 32. The General Derivation Algorithm

This is the part you should actually memorize.

## Step 1 — Read the requirements

Don't think about folders.

Extract statements like:

```text
A member can borrow books.
A book can be borrowed only once.
```

---

## Step 2 — Extract domain concepts

Ask:

> **What things exist in the business domain?**

Result:

```text
Book
Member
```

Then determine:

```text
Entity?
Value Object?
Enum?
```

---

## Step 3 — Extract business rules

Ask:

> **What must always be true?**

For example:

```text
A member cannot borrow > 5 books.
```

Then ask:

> **Which object owns that rule?**

This determines domain behavior.

---

## Step 4 — Extract application actions

Ask:

> **What can an actor ask the system to do?**

Result:

```text
BorrowBook
ReturnBook
```

These become use cases.

---

## Step 5 — Define use-case responsibility

Write:

```text
BorrowBook
→ Coordinates borrowing a book for a member.
```

Not:

```text
BorrowBook
→ Talks to MongoDB.
```

That distinction matters.

---

## Step 6 — Analyze dependencies

For each use case:

```text
What does it need that it doesn't own?
```

For example:

```text
BorrowBook
├── find member
├── find book
├── persist member
└── persist book
```

---

## Step 7 — Separate internal vs external dependencies

Ask:

```text
Is this domain/application logic?
```

or:

```text
Does this require an external system/capability?
```

For example:

```text
book.isAvailable()
        ↓
Domain

save(book)
        ↓
External capability
```

---

## Step 8 — Turn external capabilities into ports

```text
save book
    ↓
BookWriter
```

```text
charge customer
    ↓
PaymentGateway
```

```text
send notification
    ↓
NotificationSender
```

---

## Step 9 — Implement adapters

Now choose technology:

```text
BookWriter
    ↑
MongoBookRepository
```

```text
PaymentGateway
    ↑
StripePaymentGateway
```

```text
NotificationSender
    ↑
EmailNotificationSender
```

Only **now** should infrastructure appear.

---

## Step 10 — Wire everything

Finally:

```text
wire()
```

connects:

```text
Port ← Concrete Adapter
```

and:

```text
Use Case ← Dependencies
```

---

# 33. The Critical Mental Separation

You should now be able to distinguish these four sentences:

### "A book cannot be borrowed twice."

```text
Domain Rule
```

### "BorrowBook coordinates borrowing."

```text
Use Case
```

### "The application needs to retrieve a book."

```text
Dependency / Capability
```

### "MongoDB will retrieve the book."

```text
Adapter / Infrastructure Detail
```

That is the entire architecture deduction process in miniature.

---

# 34. The Final Generic Blueprint

Regardless of whether you're building:

```text
Library
Wallet
Food Delivery
Job Platform
URL Shortener
E-commerce
Chat
Banking
```

the reasoning can be:

```text
                     REQUIREMENTS
                          │
                          ▼
                   DOMAIN ANALYSIS
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
          ENTITIES               VALUE OBJECTS
             │
             ▼
        DOMAIN RULES
             │
             ▼
          USE CASES
             │
             ▼
       USE-CASE DEPENDENCIES
             │
             ▼
      INTERNAL OR EXTERNAL?
             │
        ┌────┴─────┐
        │          │
    Internal    External
        │          │
        ▼          ▼
    Domain      PORT
    Behavior      │
                  ▼
               ADAPTER
                  │
                  ▼
             TECHNOLOGY
                  │
                  ▼
                 WIRE
```

And the dependency direction remains:

```text
                  CORE
                   │
                   ▼
                 PORT
                   ▲
                   │
                ADAPTER
                   │
                   ▼
             TECHNOLOGY
```

---

# 35. What You Should Practice Next

Now that you've seen the answers, don't immediately move to another theory topic.

The next useful exercise is to give you **5 completely new project requirements without any hints**, and you independently produce:

```text
1. Domain entities
2. Value objects
3. Enums/domain types
4. Domain invariants
5. Use cases
6. Use-case responsibilities
7. Dependencies
8. Ports
9. Adapters
10. Wire/object graph
```

Then we can review your answers **before writing a single line of implementation code**.

That is the point where this stops being an OOP tutorial and starts becoming actual **architecture design practice**.