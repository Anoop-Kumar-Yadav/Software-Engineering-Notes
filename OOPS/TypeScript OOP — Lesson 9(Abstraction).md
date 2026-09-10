# TypeScript OOP — Lesson 9: Abstraction

We now move to exactly **one concept: abstraction**.

At this point, you know:

```text
Class
Constructor
Instance fields/methods
Access modifiers
Encapsulation
static
readonly
Interface
```

Abstraction is where these ideas start coming together.

The most important thing to understand is:

> **Abstraction is about exposing the essential capability while hiding unnecessary implementation details.**

It answers:

> **"What does this object provide?"**

rather than:

> **"How does this object internally accomplish it?"**

---

# 1. Start With a Real-World Example

Consider an ATM.

You interact with:

```text
Withdraw
Deposit
Check Balance
```

You don't need to know:

```text
How the bank validates your account
How the database stores your balance
How the transaction is persisted
How fraud detection works
How the bank communicates with another server
```

You simply interact with a small set of operations:

```text
              ATM
               │
       ┌───────┼────────┐
       │       │        │
    Withdraw Deposit  Balance
```

That is **abstraction**.

The ATM exposes the capabilities you need and hides the complexity behind them.

---

# 2. Abstraction in Software

Suppose we have:

```ts
class PaymentService {
  pay(amount: number): void {
    // complicated implementation
  }
}
```

A caller simply does:

```ts
paymentService.pay(1000);
```

The caller doesn't need to know:

```text
API authentication
request construction
network communication
response parsing
retry logic
logging
```

The caller sees:

```text
pay(amount)
```

That's abstraction.

---

# 3. Abstraction vs Encapsulation

These concepts are related but different.

### Encapsulation

Answers:

> **How do I protect internal state and implementation?**

Example:

```ts
class BankAccount {
  private balance = 0;
}
```

### Abstraction

Answers:

> **What should the outside world need to know?**

Example:

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

So:

```text
Encapsulation
    ↓
controls access to internals

Abstraction
    ↓
defines the essential external view
```

They often work together.

---

# 4. A Simple Example

Imagine a coffee machine.

Internally:

```text
Coffee Machine
├── heat water
├── grind beans
├── control temperature
├── pump water
├── manage pressure
└── dispense coffee
```

But the user sees:

```text
makeCoffee()
```

The user doesn't need to understand the internal mechanism.

Therefore:

```text
                    CoffeeMachine
                         │
                         │ abstraction
                         ▼
                    makeCoffee()
                         │
                         ▼
                 hidden complexity
```

This is the fundamental idea.

---

# 5. Why Abstraction Is Useful

Without abstraction, every caller would need to understand implementation details.

Imagine:

```ts
const connection = new MongoClient(...);
await connection.connect();

const collection = connection
  .db('app')
  .collection('users');

const user = await collection.findOne({
  _id: userId,
});
```

If every part of your application did this, the application becomes tightly coupled to MongoDB.

Instead:

```ts
const user = await userRepository.findById(userId);
```

Now the caller knows:

```text
findById()
```

but doesn't need to know:

```text
MongoDB
MongoClient
collections
queries
connection handling
serialization
```

That's abstraction.

---

# 6. Abstraction Doesn't Mean "Less Code"

This is a common misunderstanding.

Suppose:

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
}
```

The interface itself doesn't make MongoDB simpler.

MongoDB still requires all its implementation code.

Abstraction simply creates a **simpler view for the caller**.

```text
                 Caller
                    │
                    │ simple operation
                    ▼
             UserRepository
                    │
              abstraction
                    │
                    ▼
          MongoUserRepository
                    │
                    ▼
                 MongoDB
```

The complexity still exists.

It's simply **behind the abstraction boundary**.

---

# 7. Abstraction Through Interfaces

Interfaces are one of the primary tools TypeScript gives us for expressing abstractions.

Example:

```ts
interface EmailSender {
  send(
    recipient: string,
    message: string,
  ): Promise<void>;
}
```

The application doesn't need to know whether email is sent through:

```text
SMTP
SendGrid
Amazon SES
Mailgun
another service
```

It only needs:

```text
send(recipient, message)
```

The interface provides the abstraction.

---

# 8. Concrete Implementation

Now implement it:

```ts
class SmtpEmailSender implements EmailSender {
  async send(
    recipient: string,
    message: string,
  ): Promise<void> {
    // SMTP implementation
  }
}
```

Another implementation:

```ts
class FakeEmailSender implements EmailSender {
  async send(
    recipient: string,
    message: string,
  ): Promise<void> {
    console.log('Fake email:', recipient, message);
  }
}
```

The abstraction is:

```text
EmailSender
```

The implementations are:

```text
SmtpEmailSender
FakeEmailSender
```

---

# 9. Abstraction Hides Implementation Details

Suppose SMTP requires:

```text
SMTP host
port
username
password
TLS
connection
message formatting
```

None of that should leak into:

```ts
NotificationService
```

Instead:

```ts
class NotificationService {
  constructor(
    private readonly emailSender: EmailSender,
  ) {}

  async notify(
    recipient: string,
    message: string,
  ): Promise<void> {
    await this.emailSender.send(
      recipient,
      message,
    );
  }
}
```

The service sees:

```text
EmailSender
└── send()
```

That's its abstraction.

---

# 10. Abstraction Boundary

A useful term is **abstraction boundary**.

Consider:

```text
                Application
                     │
                     │
              EmailSender
             ─────────────
             abstraction
             boundary
                     │
                     ▼
              SMTP Adapter
                     │
                     ▼
                  SMTP
```

Everything below the boundary is implementation detail from the application's perspective.

The application only interacts with the contract.

This idea becomes extremely important in Clean Architecture.

---

# 11. Our URL Repository

Now let's apply it directly to our project.

We have:

```ts
interface UrlRepository {
  create(url: ShortenedUrl): Promise<void>;

  findById(
    id: string,
  ): Promise<ShortenedUrl | null>;
}
```

The use case:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
  ) {}

  async execute() {
    // ...
  }
}
```

The use case doesn't know:

```text
MongoDB
Mongoose
Mongo queries
collections
indexes
connection pools
```

It only knows:

```text
UrlRepository
     │
     ├── create()
     └── findById()
```

That's abstraction.

---

# 12. Abstraction Is Why Ports Exist

This gives us a much deeper understanding of the architecture.

We previously said:

```text
Port = interface
```

Now understand **why**.

A port provides an abstraction boundary.

For example:

```text
                 Use Case
                    │
                    ▼
              UrlRepository
                 PORT
                    │
              abstraction
                    │
                    ▼
          MongoUrlRepository
                ADAPTER
                    │
                    ▼
                 MongoDB
```

The use case depends on the abstraction.

The adapter handles the implementation.

---

# 13. Module-to-Module Abstraction

This is even more important for the architecture we discussed earlier.

Suppose:

```text
billing
```

needs to ask:

```text
Is this user active?
```

We don't want billing to directly know how the user module works.

So define:

```ts
interface UserClient {
  isUserActive(
    userId: string,
  ): Promise<boolean>;
}
```

Billing knows:

```text
UserClient
└── isUserActive()
```

It doesn't know:

```text
User database
User repository
User service
HTTP
MongoDB
same process
different process
```

That is abstraction.

---

# 14. Local vs HTTP

This now explains the architecture trick we discussed earlier.

Phase 1:

```text
Billing
  │
  ▼
UserClient
  │
  ▼
LocalUserClient
  │
  ▼
User module
```

Phase 2:

```text
Billing
  │
  ▼
UserClient
  │
  ▼
HttpUserClient
  │
  ▼
User Service
```

From billing's perspective:

```text
UserClient
```

hasn't changed.

The implementation changed.

That's abstraction combined with polymorphism and dependency inversion.

We'll study those concepts separately.

---

# 15. Abstraction Does Not Mean Every Detail Must Be Hidden

You don't want absurd abstractions.

For example:

```ts
interface NumberService {
  add(a: number, b: number): number;
}
```

and:

```ts
class NumberServiceImplementation
  implements NumberService {
  add(a: number, b: number): number {
    return a + b;
  }
}
```

This adds almost no useful abstraction.

Why?

Because there is no meaningful complexity or variation being hidden.

A good abstraction should hide something that callers **shouldn't need to understand**.

---

# 16. Bad Abstraction

Suppose:

```ts
interface MongoUserRepository {
  findByMongoCollection(
    collection: string,
    query: object,
  ): Promise<any>;
}
```

This isn't really a useful application-level abstraction.

Why?

Because the interface exposes:

```text
Mongo
collection
query
```

The abstraction has leaked the implementation.

Instead:

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
}
```

This expresses a **business/application capability**.

The caller doesn't need to know how the user is stored.

---

# 17. Good Abstraction

Compare:

### Leaky abstraction

```ts
findByMongoCollection(
  'users',
  { _id: id },
);
```

### Domain-oriented abstraction

```ts
userRepository.findById(id);
```

The second is better because it communicates **intent** rather than implementation.

Think:

```text
Implementation-oriented
        ↓
HOW

Domain-oriented
        ↓
WHAT
```

Good abstractions generally expose **capabilities and intent**.

---

# 18. Abstraction and Complexity

A useful way to think about abstraction is:

```text
Complex implementation
        │
        │ abstraction
        ▼
Simple interface
```

For example:

```text
MongoDB implementation
├── connection
├── query
├── serialization
├── error handling
├── indexes
└── retry

              ↓

        UserRepository
        ├── findById()
        ├── create()
        └── delete()
```

The complexity hasn't disappeared.

The caller simply doesn't need to manage it.

---

# 19. Abstraction vs Interface

These are also not identical.

An **interface** is a TypeScript language construct.

**Abstraction** is an OOP design concept.

You can have abstraction without an interface.

For example:

```ts
class CoffeeMachine {
  makeCoffee(): void {
    // hidden implementation
  }
}
```

The public method:

```text
makeCoffee()
```

provides an abstraction even without an interface.

Similarly, you can create an interface that is a **bad abstraction** if it exposes the wrong details.

Therefore:

```text
Interface
    ≠
Abstraction

Interface
    ↓
tool for expressing abstraction

Abstraction
    ↓
design principle
```

This distinction is important.

---

# 20. Three Concepts We Now Know

You should now distinguish:

```text
Encapsulation
     │
     └── protect internal state/details


Abstraction
     │
     └── expose essential capabilities


Interface
     │
     └── language mechanism for defining contracts
```

They often work together:

```text
Interface
    ↓
defines abstraction
    ↓
implementation hidden
    ↓
encapsulation
```

But they aren't interchangeable terms.

---

# 21. Connection to Your Architecture

Now our architecture becomes easier to understand.

### Domain

Contains business concepts.

```text
ShortenedUrl
```

### Port

Defines an abstraction.

```ts
interface UrlRepository {
  create(url: ShortenedUrl): Promise<void>;
}
```

### Adapter

Provides implementation.

```ts
class MongoUrlRepository
  implements UrlRepository {
  // Mongo implementation
}
```

### Composition root

Chooses the implementation.

```text
wire.ts
   │
   └── MongoUrlRepository
             │
             ▼
      UrlRepository
```

So:

```text
Abstraction
     ↓
Port
     ↓
Adapter
     ↓
Infrastructure
```

This is the conceptual bridge between **OOP abstraction** and **Hexagonal Architecture**.

---

# 22. The Most Important Mental Model

Don't remember abstraction as:

> "Hiding code."

That's too vague.

Remember:

> **Abstraction means exposing only the concepts/capabilities that a consumer needs while hiding implementation details that the consumer shouldn't depend on.**

For our URL service:

```text
CreateShortenedUrl
        │
        │ needs
        ▼
   UrlRepository
        │
        │ doesn't care about
        ▼
MongoDB / PostgreSQL / Memory
```

The use case knows:

```text
WHAT:
create
findById
```

It doesn't know:

```text
HOW:
Mongo query
SQL query
Map lookup
HTTP call
```

That is abstraction.

---

# Practice Exercise

Build a small **FileStorage** abstraction.

Start with:

```ts
interface FileStorage {
  upload(
    filename: string,
    content: Buffer,
  ): Promise<string>;

  delete(filename: string): Promise<void>;
}
```

Then create:

```text
LocalFileStorage
MemoryFileStorage
```

Both should implement `FileStorage`.

Then create:

```text
DocumentService
```

Its constructor should accept:

```text
FileStorage
```

The important part is that `DocumentService` must **not know** whether files are being stored locally or in memory.

The architecture should look like:

```text
                DocumentService
                       │
                       ▼
                   FileStorage
                   abstraction
                       ▲
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       LocalFileStorage   MemoryFileStorage
```

You should be able to explain **why `FileStorage` is an abstraction**, not merely say "because it's an interface."

---

# Checkpoint

Our OOP foundation is now:

```text
✓ Classes
✓ Objects / Instances
✓ Properties
✓ Methods
✓ new
✓ this
✓ Constructors
✓ Instance fields
✓ Instance methods
✓ Access modifiers
✓ public
✓ private
✓ protected
✓ Encapsulation
✓ Invariants
✓ static fields
✓ static methods
✓ Class-level vs instance-level members
✓ readonly
✓ const vs readonly
✓ Shallow readonly
✓ readonly arrays
✓ Readonly<T>
✓ Compile-time vs runtime immutability
✓ Interfaces
✓ implements
✓ Interface contracts
✓ Structural typing
✓ Interface vs class
✓ Abstraction
✓ Abstraction boundaries
✓ Encapsulation vs abstraction
✓ Interface vs abstraction
✓ Ports as architectural abstractions
```

**Next single topic: Composition.**

This is particularly important for your architecture. We'll learn the difference between **"is-a" and "has-a"**, why composition is usually preferred over inheritance in backend systems, how objects are assembled from other objects, and how this naturally leads into **Dependency Injection**.