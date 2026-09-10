# TypeScript OOP — Lesson 19: SOLID — Dependency Inversion Principle

We have reached the final SOLID principle:

> **D — Dependency Inversion Principle (DIP)**

This is the principle that most directly connects your OOP knowledge to the **Clean / Hexagonal architecture** you've been learning.

The formal definition has two parts:

> **High-level modules should not depend on low-level modules. Both should depend on abstractions.**

> **Abstractions should not depend on details. Details should depend on abstractions.**

The important word is **direction**.

---

# 1. First Understand "Dependency"

Suppose:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: MongoUrlRepository,
  ) {}
}
```

There is a dependency:

```text
CreateShortenedUrl
       │
       ▼
MongoUrlRepository
```

The high-level business operation depends directly on a low-level infrastructure implementation.

Why is that undesirable?

Because `CreateShortenedUrl` now knows:

```text
MongoDB
MongoRepository
database implementation
```

The business logic has become coupled to infrastructure.

---

# 2. Identify High-Level and Low-Level

This terminology is important.

### High-level module

A high-level module contains **business/application policy**.

For example:

```text
CreateShortenedUrl
RedirectShortenedUrl
DeleteShortenedUrl
```

These express what the application does.

### Low-level module

A low-level module contains **implementation details**.

For example:

```text
MongoUrlRepository
RedisCache
PinoLogger
ExpressController
SMTPEmailSender
```

These explain how things are technically implemented.

So:

```text
HIGH LEVEL
    │
    ▼
Business policy

LOW LEVEL
    │
    ▼
Technical details
```

---

# 3. The Problem DIP Solves

Consider:

```text
CreateShortenedUrl
       │
       ▼
MongoUrlRepository
       │
       ▼
MongoDB
```

Now imagine you want to move to PostgreSQL.

You have to change:

```text
CreateShortenedUrl
```

That's undesirable because the business logic shouldn't care which database you use.

We want:

```text
CreateShortenedUrl
       │
       ▼
    UrlRepository
       ▲
       │
MongoUrlRepository
```

Now the business logic depends on an **abstraction**.

---

# 4. The Dependency Direction Changes

Before:

```text
CreateShortenedUrl
        │
        ▼
MongoUrlRepository
```

Dependency direction:

```text
Business
   ↓
Infrastructure
```

After:

```text
CreateShortenedUrl
        │
        ▼
   UrlRepository
        ▲
        │
MongoUrlRepository
```

Now:

```text
Business
   ↓
Abstraction
   ↑
Infrastructure
```

This is **dependency inversion**.

---

# 5. Why Is It Called "Inversion"?

Because traditionally you might think:

```text
High-level code
       ↓
Low-level implementation
```

DIP says:

```text
High-level code
       ↓
Abstraction
       ↑
Low-level implementation
```

The low-level implementation now depends on the abstraction defined for the high-level policy.

The dependency direction has effectively been inverted.

---

# 6. Create the Port

Define:

```ts
interface UrlRepository {
  create(
    url: ShortenedUrl,
  ): Promise<void>;
}
```

Then the use case:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
  ) {}

  async execute(
    url: ShortenedUrl,
  ): Promise<void> {
    await this.repository.create(url);
  }
}
```

The use case knows:

```text
UrlRepository
```

but doesn't know:

```text
MongoDB
PostgreSQL
Mongoose
Prisma
```

---

# 7. Adapter Implements the Port

Now:

```ts
class MongoUrlRepository
  implements UrlRepository {

  async create(
    url: ShortenedUrl,
  ): Promise<void> {
    // MongoDB implementation
  }
}
```

The dependency structure is:

```text
              UrlRepository
               interface
                  ▲
                  │
          implements
                  │
        MongoUrlRepository
```

The adapter depends on the abstraction.

---

# 8. This Is Your Hexagonal Architecture

You have been seeing this structure:

```text
                ┌─────────────────┐
                │      CORE       │
                │                 │
                │    Use Case     │
                └────────┬────────┘
                         │
                         ▼
                    Port/Interface
                         ▲
                         │
                ┌────────┴────────┐
                │     Adapter     │
                │                 │
                │ MongoRepository │
                └─────────────────┘
```

That isn't just folder organization.

It's **dependency direction**.

The core owns the abstraction.

Infrastructure implements it.

---

# 9. Why Should the Core Own the Interface?

This is a subtle but important point.

Suppose you put:

```ts
interface UrlRepository {
  create(...);
}
```

inside:

```text
adapters/db/
```

Then the business layer would need to import an abstraction defined by infrastructure.

That gives:

```text
core
 ↓
adapter abstraction
```

which is backwards.

Instead:

```text
core
└── ports.ts
      │
      ▼
UrlRepository
      ▲
      │
adapters/db/
└── MongoUrlRepository
```

Now:

```text
adapter → core abstraction
```

This is the dependency direction we want.

---

# 10. The Important Rule

For your architecture, remember:

> **The core defines what it needs; infrastructure decides how to provide it.**

For example, the use case says:

```text
"I need something capable of storing URLs."
```

So the core defines:

```ts
interface UrlRepository {
  create(
    url: ShortenedUrl,
  ): Promise<void>;
}
```

Infrastructure says:

```text
"I can provide that capability using MongoDB."
```

and implements:

```ts
class MongoUrlRepository
  implements UrlRepository {
  // ...
}
```

This is the heart of DIP.

---

# 11. DIP Is Not Just "Use Interfaces"

This distinction is important.

Someone might say:

> "I created an interface, so I'm following DIP."

Not necessarily.

Consider:

```ts
interface MongoRepository {
  save(): Promise<void>;
}

class CreateUrl {
  constructor(
    private readonly repository: MongoRepository,
  ) {}
}
```

Technically there is an interface.

But the abstraction is still named and designed around the infrastructure:

```text
MongoRepository
```

The high-level policy is still shaped around the low-level detail.

A better abstraction is:

```ts
interface UrlRepository {
  save(): Promise<void>;
}
```

The abstraction represents **what the business/application needs**, not the technology providing it.

---

# 12. Abstraction Should Represent Policy Needs

Compare:

```text
MongoRepository
PostgresRepository
RedisRepository
```

These are implementation concepts.

Versus:

```text
UrlRepository
UrlCache
UserClient
EventPublisher
```

These represent capabilities required by the application.

That is a much healthier abstraction boundary.

---

# 13. DIP + Dependency Injection

Now we can distinguish the two clearly.

### Dependency Inversion

A **design principle**:

```text
High-level
    ↓
Abstraction
    ↑
Low-level
```

### Dependency Injection

A **technique for supplying the dependency**:

```ts
new CreateShortenedUrl(
  new MongoUrlRepository(),
);
```

So:

```text
DIP
 ↓
defines desired dependency direction

DI
 ↓
provides the concrete dependency
```

They work together but aren't the same concept.

---

# 14. The Composition Root Completes the Picture

Now ask:

> Who connects `MongoUrlRepository` to `CreateShortenedUrl`?

Not the use case.

The composition root.

For example:

```ts
function createUrlModule() {
  const repository =
    new MongoUrlRepository();

  const createUrl =
    new CreateShortenedUrl(
      repository,
    );

  return {
    createUrl,
  };
}
```

The resulting architecture is:

```text
                createUrlModule()
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
 MongoUrlRepository     CreateShortenedUrl
             │                   │
             │ implements        │ depends on
             ▼                   ▼
       UrlRepository ←───────────┘
```

The composition root knows both sides.

The core doesn't need to.

---

# 15. This Is Why `wire.ts` Exists

Now your earlier question about `wire.ts` should become clearer.

`wire.ts` isn't business logic.

It is the place where you say:

```text
Which concrete implementation
does this application use?
```

For example:

```ts
const repository =
  new MongoUrlRepository();

const generator =
  new NanoidShortCodeGenerator();

const logger =
  new PinoLogger();

const useCase =
  new CreateShortenedUrl(
    repository,
    generator,
    logger,
  );
```

The core says:

```text
I need:
UrlRepository
ShortCodeGenerator
Logger
```

The composition root says:

```text
I'll provide:
MongoUrlRepository
NanoidShortCodeGenerator
PinoLogger
```

That is the separation.

---

# 16. DIP and Testing

This architecture makes testing much easier.

Production:

```text
CreateShortenedUrl
      ↓
MongoUrlRepository
```

Test:

```text
CreateShortenedUrl
      ↓
InMemoryUrlRepository
```

The use case doesn't change.

You can even use a tiny fake:

```ts
class FakeUrlRepository
  implements UrlRepository {

  async create(
    url: ShortenedUrl,
  ): Promise<void> {
    // store in memory
  }
}
```

Then:

```ts
const useCase =
  new CreateShortenedUrl(
    new FakeUrlRepository(),
  );
```

DIP gives you the boundary.

DI gives you the mechanism to substitute the implementation.

---

# 17. DIP + OCP

These principles are strongly connected.

OCP says:

> **We should be able to extend behavior without modifying stable high-level logic.**

DIP gives us the structure that makes this possible:

```text
Stable high-level logic
          │
          ▼
     abstraction
          ▲
          │
 ┌────────┼─────────┐
 │        │         │
Mongo   Postgres   Memory
```

Add:

```text
Dynamo
```

and the core doesn't change.

So:

```text
DIP
 ↓
dependency on abstraction

OCP
 ↓
new implementation can be added
without changing stable consumer
```

---

# 18. DIP + LSP

We learned:

> Implementations must be behaviorally substitutable.

Now:

```text
UrlRepository
      ▲
      │
 ┌────┴─────┐
 │          │
Mongo      Memory
```

DIP allows the core to depend on:

```text
UrlRepository
```

LSP says:

```text
Mongo and Memory implementations
must actually honor that contract.
```

So:

```text
DIP
 ↓
depend on abstraction

LSP
 ↓
implementations must honor abstraction
```

---

# 19. DIP + ISP

We learned that interfaces should be client-focused.

Now instead of:

```ts
interface UrlRepository {
  create(): Promise<void>;
  find(): Promise<void>;
  update(): Promise<void>;
  delete(): Promise<void>;
}
```

you might define:

```ts
interface UrlCreator {
  create(
    url: ShortenedUrl,
  ): Promise<void>;
}
```

Then:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly creator: UrlCreator,
  ) {}
}
```

Now the high-level module depends on:

```text
small application-specific abstraction
```

rather than an infrastructure-shaped abstraction.

That's DIP + ISP working together.

---

# 20. DIP + SRP

SRP says:

```text
CreateShortenedUrl
    ↓
business workflow
```

shouldn't also be responsible for:

```text
MongoDB
logging infrastructure
HTTP
```

DIP lets those concerns be moved behind abstractions.

Therefore:

```text
SRP
 ↓
separate responsibility

DIP
 ↓
separate dependency direction
```

Together they produce much cleaner components.

---

# 21. The Most Important Architecture Diagram

This is worth memorizing.

```text
                  ENTRYPOINT
                     │
                     ▼
                Controller
                     │
                     ▼
                  Use Case
                     │
                     ▼
                   PORT
                / interface
                     ▲
                     │
                  ADAPTER
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
        Mongo       Redis      HTTP
```

The arrows are important.

The use case:

```text
depends on
    ↓
port
```

The adapter:

```text
implements
    ↑
port
```

The adapter is therefore pointing **toward the core abstraction**.

This is dependency inversion.

---

# 22. Compare Traditional Layering

Traditional architecture might look like:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

and the dependency chain follows the technical layers:

```text
Business
   ↓
Persistence
```

In dependency-inverted architecture:

```text
Controller
    ↓
Use Case
    ↓
Port
    ↑
Adapter
    ↓
Database
```

The important difference is:

```text
Use Case
   ↓
Port
```

rather than:

```text
Use Case
   ↓
MongoRepository
```

---

# 23. Why This Makes Your Core Framework-Agnostic

Suppose your use case imports:

```ts
import mongoose from 'mongoose';
```

Then:

```text
core
 ↓
Mongoose
```

Your core isn't really framework-agnostic anymore.

Similarly:

```ts
import express from 'express';
```

inside your use case creates:

```text
core
 ↓
Express
```

DIP helps prevent this.

Your core should ideally know:

```text
business entities
business rules
ports
use cases
```

while infrastructure knows:

```text
MongoDB
Mongoose
Express
Redis
Pino
SMTP
```

---

# 24. DIP Is the Foundation of Your Ports

Your `ports.ts` isn't just a TypeScript convenience.

Conceptually:

```text
ports.ts
   ↓
declares what the core needs
```

For example:

```ts
export interface UrlRepository {
  create(
    url: ShortenedUrl,
  ): Promise<void>;

  findByShortCode(
    code: string,
  ): Promise<ShortenedUrl | null>;
}
```

Then:

```text
adapters/db/
    ↓
MongoUrlRepository
```

implements it.

This is the **port-and-adapter relationship** from Hexagonal Architecture.

---

# 25. Why It Is Called Ports and Adapters

The port is:

```text
What the application expects
```

The adapter is:

```text
Something that satisfies that expectation
```

For example:

```text
Application
     │
     ▼
UrlRepository ← PORT
     ▲
     │
MongoUrlRepository ← ADAPTER
```

Or:

```text
Application
     │
     ▼
UserClient ← PORT
     ▲
     │
HttpUserClient ← ADAPTER
```

Or:

```text
Application
     │
     ▼
EventBus ← PORT
     ▲
     │
RabbitMQEventBus ← ADAPTER
```

Same pattern everywhere.

---

# 26. Your Monolith → Microservice Strategy Revisited

Now we can connect everything we've learned.

Phase 1:

```text
Billing
  │
  ▼
UserClient
  ▲
  │
LocalUserClient
```

Phase 2:

```text
Billing
  │
  ▼
UserClient
  ▲
  │
HttpUserClient
  │
  ▼
User Service
```

The business logic remains:

```text
Billing
   ↓
UserClient
```

The adapter changes:

```text
LocalUserClient
      ↓
HttpUserClient
```

This is:

```text
DIP
+
DI
+
OCP
+
Polymorphism
+
Ports & Adapters
```

all working together.

---

# 27. The Full Mental Model

At this point, the architecture can be understood as a sequence of decisions:

```text
1. Identify business responsibility
              ↓
2. Put it in a use case/domain object
              ↓
3. Identify external capabilities required
              ↓
4. Define ports/interfaces
              ↓
5. Implement adapters
              ↓
6. Inject adapters into core
              ↓
7. Assemble everything in wire.ts
```

And the dependency direction becomes:

```text
              CORE
               │
               ▼
             PORTS
               ▲
               │
            ADAPTERS
               │
               ▼
        External Systems
```

This is the central architectural pattern you've been working toward.

---

# 28. All Five SOLID Principles Together

Now we can finally see why these principles are called a group.

### S — Single Responsibility

```text
Keep responsibilities cohesive.
```

### O — Open/Closed

```text
Allow new variations through extension.
```

### L — Liskov Substitution

```text
Implementations must honor their abstractions.
```

### I — Interface Segregation

```text
Expose only capabilities clients need.
```

### D — Dependency Inversion

```text
High-level policy depends on abstractions,
not low-level details.
```

Together:

```text
                  SOLID
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
   Cohesion     Abstraction   Substitution
       │            │            │
       └────────────┼────────────┘
                    ▼
              Composition
                    │
                    ▼
           Dependency Injection
                    │
                    ▼
          Dependency Inversion
                    │
                    ▼
        Clean / Hexagonal Design
```

---

# 29. The Most Important Thing to Remember

Don't memorize five isolated definitions.

Remember this architectural thought process:

```text
My business logic needs something.
             │
             ▼
What capability does it need?
             │
             ▼
Define that capability as a port.
             │
             ▼
Whoever can provide it implements the port.
             │
             ▼
Inject the implementation.
             │
             ▼
Composition root chooses the implementation.
```

That is the practical application of DIP.

---

# 30. Your URL Shortener in One Picture

Your eventual design can look like:

```text
                         HTTP
                          │
                          ▼
                    URL Controller
                          │
                          ▼
                 CreateShortenedUrl
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
     UrlCreator    ShortCodeGenerator    Logger
       PORT              PORT              PORT
          ▲               ▲                ▲
          │               │                │
          ▼               ▼                ▼
    MongoAdapter        Nanoid          PinoLogger
```

And:

```text
                       wire.ts
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
    MongoAdapter         Nanoid        PinoLogger
          │               │                │
          └───────────────┼────────────────┘
                          ▼
                 CreateShortenedUrl
```

The **business logic doesn't construct those infrastructure objects**.

The **composition root does**.

That is the architecture you've been learning from the inside out.

---

# Final OOP → Architecture Checkpoint

```text
OOP FOUNDATIONS
✓ Classes
✓ Objects
✓ Constructors
✓ Properties
✓ Methods
✓ this
✓ Access modifiers
✓ Encapsulation
✓ Invariants
✓ static
✓ readonly

ABSTRACTION
✓ Interfaces
✓ implements
✓ Structural typing
✓ Abstraction
✓ Abstraction boundaries
✓ Capability-based interfaces

OBJECT RELATIONSHIPS
✓ Composition
✓ Association
✓ Aggregation
✓ Has-a
✓ Is-a
✓ Object lifecycle
✓ Delegation

INHERITANCE & POLYMORPHISM
✓ extends
✓ super()
✓ Method overriding
✓ override
✓ Interface polymorphism
✓ Inheritance polymorphism
✓ Substitutability

DEPENDENCIES
✓ Dependency
✓ Dependency graph
✓ Constructor Injection
✓ Manual DI
✓ Composition Root
✓ wire.ts
✓ Dependency Inversion

SOLID
✓ S — Single Responsibility
✓ O — Open/Closed
✓ L — Liskov Substitution
✓ I — Interface Segregation
✓ D — Dependency Inversion

ARCHITECTURAL CONNECTIONS
✓ Ports
✓ Adapters
✓ Core
✓ Infrastructure
✓ Framework independence
✓ DIP + DI
✓ DIP + OCP
✓ DIP + LSP
✓ DIP + ISP
✓ SOLID + Clean Architecture
✓ SOLID + Hexagonal Architecture
```

## Next: Putting OOP Into Practice

We've now finished the **SOLID theory sequence**. Before jumping to another principle, the next stage should be practical: we'll build a **small URL-shortener domain from scratch using only TypeScript**, without Express, MongoDB, or any framework.

We'll deliberately build it in this order:

```text
1. Requirements
       ↓
2. Identify domain objects
       ↓
3. Create entities
       ↓
4. Define behavior
       ↓
5. Define ports
       ↓
6. Create use cases
       ↓
7. Create adapters
       ↓
8. Create wire.ts
       ↓
9. Test the object graph
       ↓
10. Only then introduce HTTP
```

That exercise will test whether you can **derive the architecture yourself instead of recognizing an architecture after someone gives you the folders**.