# TypeScript OOP — Lesson 8: Interfaces

We now move to the next single concept: **interfaces**.

This is a major concept for the architecture you're building because interfaces are the mechanism that lets us separate:

```text
WHAT something can do
```

from:

```text
HOW it does it
```

Before connecting interfaces to Clean/Hexagonal Architecture, we will first understand them as a **pure OOP/type-system concept**.

---

# 1. The Problem Interfaces Solve

Suppose we have a payment system.

We want something capable of processing a payment.

One implementation might use Stripe:

```text
Stripe
```

Another might use Razorpay:

```text
Razorpay
```

Another might be a fake implementation for testing:

```text
FakePaymentGateway
```

Our application shouldn't have to care about the specific implementation.

It should only care that:

> "I have something capable of processing a payment."

This is where an **interface** becomes useful.

---

# 2. What Is an Interface?

An interface defines a **contract**.

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

This says:

> Anything that claims to be a `PaymentGateway` must provide a `pay()` operation accepting a number and returning a `Promise<void>`.

Notice what the interface does **not** say:

```text
How is payment processed?
Which API is called?
Which SDK is used?
Which database is involved?
How is authentication handled?
```

It only defines the contract.

```text
PaymentGateway
       │
       │ contract
       ▼
   pay(amount)
```

---

# 3. Interface Is Not an Object

This distinction is important.

When you write:

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

you haven't created anything.

There is no:

```text
PaymentGateway object
```

Instead, you've defined a **type-level contract**.

Compare:

```text
class
 ↓
can define runtime objects

interface
 ↓
defines a type-level contract
```

This distinction becomes extremely important later when we discuss how TypeScript interfaces disappear from generated JavaScript.

---

# 4. Implementing an Interface

A class can agree to follow an interface using:

```ts
implements
```

Example:

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}

class StripePaymentGateway implements PaymentGateway {
  async pay(amount: number): Promise<void> {
    console.log(`Processing ${amount} through Stripe`);
  }
}
```

Now TypeScript checks:

```text
StripePaymentGateway
        ↓
implements
        ↓
PaymentGateway
```

Therefore `StripePaymentGateway` must provide:

```ts
pay(amount: number): Promise<void>
```

---

# 5. What Happens If We Don't Implement the Contract?

Suppose:

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

Then:

```ts
class StripePaymentGateway implements PaymentGateway {}
```

TypeScript will complain.

Why?

Because the class promised:

```text
"I am a PaymentGateway."
```

but didn't provide the required operation.

The interface acts as a **compile-time contract checker**.

---

# 6. Multiple Implementations

This is where interfaces become powerful.

We can have:

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

Then:

```ts
class StripePaymentGateway implements PaymentGateway {
  async pay(amount: number): Promise<void> {
    console.log('Stripe payment');
  }
}
```

and:

```ts
class RazorpayPaymentGateway implements PaymentGateway {
  async pay(amount: number): Promise<void> {
    console.log('Razorpay payment');
  }
}
```

and:

```ts
class FakePaymentGateway implements PaymentGateway {
  async pay(amount: number): Promise<void> {
    console.log('Fake payment');
  }
}
```

Now:

```text
                  PaymentGateway
                  ┌─────────────┐
                  │ pay(amount) │
                  └──────┬──────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Stripe         Razorpay         Fake
```

All three satisfy the same contract.

This is the beginning of **polymorphism**, which we'll study as a separate topic later.

---

# 7. Interface as a Type

An interface can be used as a variable type.

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

Then:

```ts
const gateway: PaymentGateway =
  new StripePaymentGateway();
```

This is important.

The variable is typed as:

```text
PaymentGateway
```

even though the actual object is:

```text
StripePaymentGateway
```

Conceptually:

```text
PaymentGateway reference
        │
        ▼
StripePaymentGateway object
```

This means the code using `gateway` only depends on the **contract**.

---

# 8. Why Is This Useful?

Suppose we have:

```ts
class PaymentService {
  constructor(
    private readonly gateway: PaymentGateway,
  ) {}

  async processPayment(amount: number): Promise<void> {
    await this.gateway.pay(amount);
  }
}
```

Notice something extremely important.

`PaymentService` doesn't say:

```ts
private readonly gateway: StripePaymentGateway
```

Instead:

```ts
private readonly gateway: PaymentGateway
```

Therefore:

```text
PaymentService
      │
      │ depends on
      ▼
PaymentGateway
      ▲
      │
 ┌────┴───────────────┐
 │                    │
Stripe             Razorpay
```

The service doesn't care which implementation it receives.

---

# 9. This Is the Foundation of Dependency Inversion

Don't study Dependency Inversion yet—we'll have a dedicated lesson.

But you should recognize the pattern:

```ts
class PaymentService {
  constructor(
    private readonly gateway: PaymentGateway,
  ) {}
}
```

The service depends on an **abstraction**:

```text
PaymentGateway
```

rather than a concrete implementation:

```text
StripePaymentGateway
```

This is one of the most important ideas behind our architecture.

---

# 10. Interface vs Class

This distinction needs to become automatic.

|Interface|Class|
|---|---|
|Defines a contract/type|Defines runtime behavior/structure|
|Primarily compile-time|Exists at runtime|
|Cannot normally be instantiated|Can be instantiated|
|No constructor|Can have constructor|
|No runtime implementation|Contains implementation|
|Used by `implements`|Can implement interfaces|
|Great for boundaries|Great for behavior/state|

For example:

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
}
```

This says:

> A user repository must provide `findById`.

But:

```ts
class MongoUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    // MongoDB implementation
  }
}
```

actually implements the behavior.

---

# 11. Interface Doesn't Create Runtime JavaScript

This is a very important TypeScript-specific detail.

Consider:

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
}
```

When TypeScript compiles your code to JavaScript, the interface itself doesn't become a JavaScript object.

Conceptually:

```text
TypeScript
    │
    ├── interface
    │
    ▼
Compile
    │
    ▼
JavaScript
    │
    └── interface removed
```

This is because interfaces primarily exist for **static type checking**.

The runtime doesn't perform:

```text
"Does this object implement UserRepository?"
```

in the Java/JavaScript class-interface sense.

TypeScript uses **structural typing**.

That's our next important concept.

---

# 12. Structural Typing

TypeScript doesn't fundamentally care about the class name.

It cares about the **shape**.

Suppose:

```ts
interface Logger {
  log(message: string): void;
}
```

We can create:

```ts
class ConsoleLogger {
  log(message: string): void {
    console.log(message);
  }
}
```

Even without explicitly writing:

```ts
implements Logger
```

this can still satisfy the interface structurally:

```ts
const logger: Logger = new ConsoleLogger();
```

Why?

Because `ConsoleLogger` has:

```text
log(message: string): void
```

which matches the required structure.

---

# 13. "If It Looks Like the Contract, It Can Satisfy the Contract"

This is the fundamental idea behind **structural typing**.

Suppose:

```ts
interface Animal {
  name: string;
}
```

And:

```ts
const dog = {
  name: 'Bruno',
  age: 5,
};
```

This is acceptable:

```ts
const animal: Animal = dog;
```

because `dog` contains the required:

```text
name: string
```

It doesn't matter that the object also has:

```text
age
```

Additional properties don't prevent compatibility in this assignment context.

---

# 14. Why `implements` Is Still Useful

If TypeScript uses structural typing, why bother writing:

```ts
class MongoUserRepository
  implements UserRepository
```

?

Because it provides **explicit intent and compile-time verification**.

Suppose:

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
}
```

Then:

```ts
class MongoUserRepository
  implements UserRepository {

  async findById(id: string): Promise<User | null> {
    // ...
  }
}
```

Now if someone changes the interface:

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
  deleteById(id: string): Promise<void>;
}
```

TypeScript will immediately tell you:

```text
MongoUserRepository
does not satisfy UserRepository
```

That's valuable.

---

# 15. Interfaces Can Describe Properties

Interfaces aren't limited to methods.

```ts
interface User {
  id: string;
  name: string;
  email: string;
}
```

Then:

```ts
const user: User = {
  id: 'user-1',
  name: 'Anoop',
  email: 'anoop@example.com',
};
```

The interface defines the required structure.

This is commonly used for:

```text
DTOs
configuration objects
function parameters
API contracts
domain types
repository contracts
service contracts
event contracts
```

---

# 16. Interfaces Can Contain Multiple Members

For example:

```ts
interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  update(user: User): Promise<User>;
  deleteById(id: string): Promise<void>;
}
```

A class implementing it must satisfy all of them:

```ts
class MongoUserRepository implements UserRepository {
  async create(user: User): Promise<User> {
    // ...
  }

  async findById(id: string): Promise<User | null> {
    // ...
  }

  async update(user: User): Promise<User> {
    // ...
  }

  async deleteById(id: string): Promise<void> {
    // ...
  }
}
```

Conceptually:

```text
             UserRepository
                   │
       ┌───────────┼───────────┐
       │           │           │
     create      findById    update
                               │
                            deleteById
```

The interface describes the **capability boundary**.

---

# 17. Interface Composition

Interfaces can extend other interfaces.

For example:

```ts
interface Entity {
  id: string;
}

interface User extends Entity {
  name: string;
  email: string;
}
```

Now `User` requires:

```text
Entity
├── id

User
├── name
└── email
```

This can be useful, but don't over-generalize interfaces just for reuse.

In architecture, interfaces should usually represent **meaningful contracts**, not become giant collections of shared fields.

---

# 18. Optional Properties

Interfaces can contain optional properties:

```ts
interface CreateUserInput {
  name: string;
  email: string;
  phone?: string;
}
```

Now:

```ts
const user: CreateUserInput = {
  name: 'Anoop',
  email: 'anoop@example.com',
};
```

`phone` isn't required.

This is frequently useful for DTOs.

---

# 19. Readonly Interface Properties

Interfaces can also use `readonly`.

```ts
interface User {
  readonly id: string;
  name: string;
}
```

Then:

```ts
const user: User = {
  id: 'user-1',
  name: 'Anoop',
};
```

This is allowed:

```ts
user.name = 'Rahul';
```

but:

```ts
user.id = 'user-2';
```

is rejected.

Again, remember our previous lesson:

```text
readonly
→ property reassignment restriction
```

It isn't automatically deep immutability.

---

# 20. Function Interfaces

An interface can even describe a callable function.

For example:

```ts
interface IdGenerator {
  generate(): string;
}
```

A class can implement it:

```ts
class RandomIdGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
```

This is the pattern you'll use for infrastructure ports.

---

# 21. Our URL-Service Repository Port

Now we can finally connect this directly to the architecture.

Suppose our URL service needs storage.

The core doesn't care whether storage is:

```text
MongoDB
PostgreSQL
Redis
memory
```

So inside the core:

```ts
interface UrlRepository {
  create(url: ShortenedUrl): Promise<void>;
  findById(id: string): Promise<ShortenedUrl | null>;
  findByShortCode(
    shortCode: string,
  ): Promise<ShortenedUrl | null>;
}
```

This is a **contract**.

Then:

```ts
class MongoUrlRepository implements UrlRepository {
  async create(url: ShortenedUrl): Promise<void> {
    // MongoDB implementation
  }

  async findById(
    id: string,
  ): Promise<ShortenedUrl | null> {
    // MongoDB implementation
  }

  async findByShortCode(
    shortCode: string,
  ): Promise<ShortenedUrl | null> {
    // MongoDB implementation
  }
}
```

Now the dependency direction becomes:

```text
                 CORE
                  │
                  │ defines
                  ▼
            UrlRepository
               interface
                  ▲
                  │ implements
                  │
         MongoUrlRepository
                  │
                  ▼
               MongoDB
```

The core doesn't import MongoDB.

This is the architectural significance of interfaces.

---

# 22. Interfaces and Ports

In our architecture, we often call these interfaces **ports**.

For example:

```ts
interface UrlRepository {
  create(url: ShortenedUrl): Promise<void>;
}
```

Architecturally:

```text
Interface
   ↓
Port
```

Then:

```ts
class MongoUrlRepository implements UrlRepository
```

is an:

```text
Adapter
```

So:

```text
             Application/Core
                    │
                    │
                    ▼
             UrlRepository
                 PORT
                    ▲
                    │
              implements
                    │
                    │
        MongoUrlRepository
               ADAPTER
                    │
                    ▼
                MongoDB
```

This is exactly why you need a strong understanding of interfaces before we continue deeper into the architecture.

---

# 23. Interfaces and Module-to-Module Communication

Remember the architecture we discussed earlier:

```text
billing
   │
   ▼
UserClient
   ▲
   │
LocalUserClient
```

The contract:

```ts
interface UserClient {
  isUserActive(userId: string): Promise<boolean>;
}
```

Then:

```ts
class LocalUserClient implements UserClient {
  async isUserActive(userId: string): Promise<boolean> {
    // in-process call
  }
}
```

Later:

```ts
class HttpUserClient implements UserClient {
  async isUserActive(userId: string): Promise<boolean> {
    // HTTP call
  }
}
```

Now:

```text
                    UserClient
                       PORT
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
      LocalUserClient       HttpUserClient
             │                     │
       same process             network
```

The calling module doesn't need to know which implementation is being used.

That is the exact architectural trick we've been discussing.

---

# 24. One Very Important Distinction

Don't confuse:

```text
interface
```

with:

```text
implementation
```

Suppose:

```ts
interface EmailSender {
  send(to: string, message: string): Promise<void>;
}
```

This does **not send an email**.

It only says:

> "Something capable of sending an email must provide this operation."

Then:

```ts
class SmtpEmailSender implements EmailSender {
  async send(
    to: string,
    message: string,
  ): Promise<void> {
    // SMTP implementation
  }
}
```

actually performs the work.

Therefore:

```text
Interface
   ↓
WHAT

Class implementation
   ↓
HOW
```

This distinction should become instinctive.

---

# 25. Interface Is a Contract, Not a Dependency Locator

An interface does not tell you:

```text
Which object to instantiate
Which implementation to use
Where that implementation comes from
How dependencies are created
```

That's the job of the **composition root / wiring layer**.

For example:

```ts
const repository: UrlRepository =
  new MongoUrlRepository();
```

The interface defines:

```text
what is required
```

while `wire.ts` decides:

```text
what implementation to provide
```

This separation is extremely important in our architecture.

---

# 26. The Complete Mental Model

You should now be able to see:

```text
                 INTERFACE
                    │
                    │ defines contract
                    ▼
              ┌─────────────┐
              │    WHAT     │
              │             │
              │ create()    │
              │ findById()  │
              └──────┬──────┘
                     ▲
                     │ implements
          ┌──────────┴───────────┐
          │                      │
          ▼                      ▼
     MongoAdapter          MemoryAdapter
          │                      │
          ▼                      ▼
       MongoDB                 Map
```

And your application depends on:

```text
INTERFACE
```

rather than:

```text
CONCRETE IMPLEMENTATION
```

That's the foundation of the dependency architecture we'll build later.

---

# 27. What You Should Remember

Don't memorize interfaces as simply:

> "A way to define types."

That's technically correct but architecturally incomplete.

Remember:

> **An interface defines a contract that allows code to depend on capabilities rather than concrete implementations.**

The core progression is:

```text
Interface
    ↓
defines WHAT

Implementation
    ↓
defines HOW

implements
    ↓
compile-time verification

Reference typed as interface
    ↓
caller depends on contract
```

And for our architecture:

```text
Port
  ↓
interface

Adapter
  ↓
class implementing interface

wire.ts
  ↓
chooses implementation
```

---

# Practice Exercise

Create a small notification system.

First define:

```text
NotificationSender
```

It should have:

```text
send(message: string): Promise<void>
```

Then create three implementations:

```text
EmailNotificationSender
SmsNotificationSender
FakeNotificationSender
```

All three should implement the same interface.

Then create:

```text
NotificationService
```

whose constructor accepts:

```text
NotificationSender
```

**Do not make `NotificationService` depend directly on `EmailNotificationSender`.**

The final dependency should conceptually look like:

```text
NotificationService
        │
        ▼
NotificationSender
        ▲
        │
 ┌──────┼──────────┐
 │      │          │
Email   SMS       Fake
```

If you understand why this design works, you've understood the most important part of today's lesson.

---

# OOP Checkpoint

Completed:

```text
✓ Classes
✓ Objects / Instances
✓ Properties
✓ Methods
✓ new
✓ this
✓ Constructors
✓ Constructor parameters
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
✓ Interface-based dependency
✓ Ports and adapters connection
```

**Next single topic: Abstraction.**

We'll distinguish **abstraction vs encapsulation vs interfaces**, because these three are commonly mixed together even in Java tutorials. Then we'll build the idea from a simple real-world example toward our `UrlRepository` and `UserClient` boundaries.