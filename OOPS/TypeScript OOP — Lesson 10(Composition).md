# TypeScript OOP — Lesson 10: Composition

Now we move to **composition**, one of the most important OOP design techniques for the architecture you're building.

You've learned that an object contains **state + behavior**, that encapsulation controls access to that state, and that interfaces let us depend on abstractions. Composition answers a different question:

> **How do we build a complex object from smaller objects?**

The short answer is:

> **An object can contain and use other objects instead of inheriting their behavior.**

This is the foundation of the dependency-injection style you'll use throughout your URL service.

---

# 1. Start With a Simple Example

Suppose we have a car.

A car has:

```text
Engine
Wheels
Transmission
Battery
```

We could model this as:

```ts
class Engine {
  start(): void {
    console.log('Engine started');
  }
}

class Car {
  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  start(): void {
    this.engine.start();
  }
}
```

Now:

```ts
const engine = new Engine();
const car = new Car(engine);

car.start();
```

The important relationship is:

```text
Car
 │
 └── has an Engine
```

This is **composition**.

---

# 2. The "Has-A" Relationship

Composition is often described using:

> **has-a relationship**

Examples:

```text
Car has an Engine
Order has OrderItems
UserService has a UserRepository
UseCase has a Repository
Controller has a UseCase
```

Compare:

```text
Car → has an Engine
```

with:

```text
Dog → is an Animal
```

The second is an **inheritance** relationship.

So:

```text
Composition
    ↓
HAS-A

Inheritance
    ↓
IS-A
```

We'll study inheritance later. For now, focus entirely on composition.

---

# 3. Why Not Create Dependencies Inside the Class?

Consider:

```ts
class Car {
  private engine: Engine;

  constructor() {
    this.engine = new Engine();
  }
}
```

This works.

But the `Car` is now responsible for creating its own dependency.

```text
Car
 │
 └── creates Engine
```

That creates tight coupling.

Instead:

```ts
class Car {
  constructor(
    private readonly engine: Engine,
  ) {}
}
```

Now:

```ts
const engine = new Engine();
const car = new Car(engine);
```

The relationship becomes:

```text
Outside
  │
  ├── creates Engine
  │
  └── creates Car
         │
         └── receives Engine
```

This is much more flexible.

---

# 4. Composition Means Building Objects From Other Objects

Suppose we have:

```ts
class Logger {
  log(message: string): void {
    console.log(message);
  }
}
```

and:

```ts
class UserService {
  constructor(
    private readonly logger: Logger,
  ) {}

  createUser(): void {
    this.logger.log('Creating user');
  }
}
```

Now `UserService` is composed with `Logger`.

```text
UserService
    │
    └── Logger
```

The service doesn't need to implement logging itself.

It delegates that responsibility to another object.

---

# 5. Delegation

This introduces another useful term:

> **Delegation**

Instead of doing the work itself, an object asks another object to do it.

Example:

```ts
class Car {
  constructor(
    private readonly engine: Engine,
  ) {}

  start(): void {
    this.engine.start();
  }
}
```

`Car` doesn't implement engine mechanics.

It delegates:

```text
Car.start()
    │
    ▼
Engine.start()
```

Conceptually:

```text
Car
 │
 │ delegates
 ▼
Engine
```

This allows each object to focus on its own responsibility.

---

# 6. Composition With Interfaces

This is where composition becomes extremely powerful.

Instead of:

```ts
class Car {
  constructor(
    private readonly engine: Engine,
  ) {}
}
```

we can define:

```ts
interface Engine {
  start(): void;
}
```

Then:

```ts
class Car {
  constructor(
    private readonly engine: Engine,
  ) {}

  start(): void {
    this.engine.start();
  }
}
```

Now the `Car` doesn't depend on a particular engine implementation.

It depends on the **capability**:

```text
Engine
└── start()
```

Possible implementations:

```ts
class PetrolEngine implements Engine {
  start(): void {
    console.log('Petrol engine started');
  }
}

class ElectricEngine implements Engine {
  start(): void {
    console.log('Electric motor started');
  }
}
```

Now:

```ts
const petrolCar = new Car(
  new PetrolEngine(),
);

const electricCar = new Car(
  new ElectricEngine(),
);
```

Same `Car`.

Different composition.

---

# 7. The Architecture Becomes Flexible

We now have:

```text
                    Car
                     │
                     ▼
                   Engine
                 interface
                     ▲
             ┌───────┴───────┐
             │               │
             ▼               ▼
       PetrolEngine     ElectricEngine
```

The `Car` doesn't need to change.

We simply compose it differently.

This is a very important architectural property:

> **Behavior can change by changing the objects we compose together rather than modifying the object that uses them.**

---

# 8. Composition in Your URL Service

Now let's translate this directly into your project.

Suppose our use case needs:

```text
UrlRepository
IdGenerator
ShortCodeGenerator
```

We can write:

```ts
interface UrlRepository {
  create(url: ShortenedUrl): Promise<void>;
}

interface IdGenerator {
  generate(): string;
}

interface ShortCodeGenerator {
  generate(): string;
}
```

Then:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
    private readonly idGenerator: IdGenerator,
    private readonly shortCodeGenerator: ShortCodeGenerator,
  ) {}

  async execute(originalUrl: string): Promise<void> {
    const id = this.idGenerator.generate();

    const shortCode =
      this.shortCodeGenerator.generate();

    // create entity...

    // persist through repository...
  }
}
```

This object is **composed from three collaborators**.

```text
CreateShortenedUrl
│
├── UrlRepository
├── IdGenerator
└── ShortCodeGenerator
```

This is composition.

---

# 9. Then `wire.ts` Becomes Important

Who creates these objects?

Not the use case.

The **composition root** does.

For example:

```ts
const repository = new MongoUrlRepository();
const idGenerator = new UuidGenerator();
const shortCodeGenerator =
  new NanoidShortCodeGenerator();

const createShortenedUrl =
  new CreateShortenedUrl(
    repository,
    idGenerator,
    shortCodeGenerator,
  );
```

Look at what's happening.

```text
                    wire.ts
                      │
          ┌───────────┼────────────┐
          │           │            │
          ▼           ▼            ▼
      Repository   ID Generator   Code Generator
          │           │            │
          └───────────┼────────────┘
                      ▼
             CreateShortenedUrl
```

This is the beginning of **Dependency Injection**.

Don't jump ahead yet. The important thing today is recognizing that `wire.ts` is **composing objects together**.

---

# 10. Composition Is the Reason `wire.ts` Exists

Remember your earlier question about wiring.

Now you can see it from the OOP perspective.

The use case says:

```text
"I need something that satisfies UrlRepository."
```

It doesn't create that object itself.

`wire.ts` says:

```text
"I know which implementation should satisfy that requirement."
```

So:

```text
Use Case
   │
   │ requires
   ▼
UrlRepository
   ▲
   │ provided by
   │
wire.ts
   │
   ▼
MongoUrlRepository
```

The composition root is where the object graph is assembled.

---

# 11. Object Graph

This introduces an important term:

> **Object graph**

An application isn't just a collection of unrelated objects.

Objects depend on other objects.

For your URL service:

```text
HTTP Server
     │
     ▼
Controller
     │
     ▼
CreateShortenedUrl
     │
     ├───────────────┐
     ▼               ▼
UrlRepository    ShortCodeGenerator
     │
     ▼
MongoUrlRepository
     │
     ▼
MongoDB
```

This entire connected structure is an **object graph**.

`wire.ts` constructs this graph.

---

# 12. Composition Can Have Multiple Levels

Consider:

```ts
class Controller {
  constructor(
    private readonly useCase: UseCase,
  ) {}
}
```

Then:

```ts
class UseCase {
  constructor(
    private readonly repository: Repository,
  ) {}
}
```

Then:

```ts
class Repository {
  constructor(
    private readonly database: Database,
  ) {}
}
```

You get:

```text
Controller
    │
    ▼
  UseCase
    │
    ▼
Repository
    │
    ▼
Database
```

This is composition at multiple levels.

Each object has a focused responsibility.

---

# 13. Why This Is Better Than One Giant Class

Imagine:

```ts
class UrlService {
  createUrl() {
    // validate URL
    // generate ID
    // generate short code
    // connect MongoDB
    // save document
    // send logs
    // handle HTTP
    // format response
  }
}
```

This class is doing too much.

Instead:

```text
Controller
   ↓
Use Case
   ↓
Repository
   ↓
Database
```

with:

```text
ShortCodeGenerator
IdGenerator
Logger
```

as collaborators.

Now each component can be understood independently.

This is one of the major benefits of composition.

---

# 14. Composition vs Duplication

Suppose both:

```text
CreateUrl
UpdateUrl
```

need an ID generator.

Instead of duplicating the logic:

```ts
class CreateUrl {
  generateId() {
    // ...
  }
}

class UpdateUrl {
  generateId() {
    // ...
  }
}
```

we can compose both with:

```text
IdGenerator
```

```text
CreateUrl ───────┐
                 │
                 ▼
             IdGenerator
                 ▲
                 │
UpdateUrl ───────┘
```

The behavior becomes reusable without inheritance.

---

# 15. Composition vs Inheritance

You will eventually learn inheritance, but you need to understand the motivation for composition first.

Imagine:

```text
PaymentService
   │
   └── PaymentGateway
```

Composition says:

> PaymentService **has a** PaymentGateway.

Inheritance would say:

> PaymentService **is a** PaymentGateway.

That second statement makes no semantic sense.

Therefore composition is the natural relationship.

```text
PaymentService
      │
      └── has → PaymentGateway
```

This sounds obvious, but this simple test prevents a lot of bad inheritance designs.

---

# 16. Composition Allows Runtime Substitution

Suppose:

```ts
interface Logger {
  log(message: string): void;
}
```

Implement:

```ts
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}
```

and:

```ts
class SilentLogger implements Logger {
  log(message: string): void {}
}
```

Now:

```ts
class UserService {
  constructor(
    private readonly logger: Logger,
  ) {}

  createUser(): void {
    this.logger.log('Creating user');
  }
}
```

We can compose:

```ts
const developmentService =
  new UserService(
    new ConsoleLogger(),
  );
```

or:

```ts
const testService =
  new UserService(
    new SilentLogger(),
  );
```

The `UserService` itself didn't change.

Only the **composition** changed.

---

# 17. This Is Extremely Useful for Testing

Suppose your production repository is:

```text
MongoUrlRepository
```

But tests don't need a real MongoDB connection.

Create:

```ts
class InMemoryUrlRepository
  implements UrlRepository {
  // store data in memory
}
```

Then:

```text
Production

CreateShortenedUrl
        │
        ▼
MongoUrlRepository
        │
        ▼
MongoDB
```

Testing:

```text
CreateShortenedUrl
        │
        ▼
InMemoryUrlRepository
        │
        ▼
Memory
```

The use case doesn't change.

This is composition + abstraction working together.

---

# 18. Composition Is Not Just Dependency Injection

Another important distinction.

**Composition** is the broader idea:

```text
Build object A using object B.
```

**Dependency Injection** is a technique for providing dependencies from outside rather than creating them internally.

For example:

```ts
class Car {
  constructor(
    private readonly engine: Engine,
  ) {}
}
```

This is:

```text
composition
+
dependency injection
```

But composition can exist without DI.

For example:

```ts
class Car {
  private readonly wheels = new Wheels();
}
```

The `Car` is still composed of `Wheels`, but it creates the dependency itself.

Later we'll study why DI is usually preferable for architectural dependencies.

---

# 19. Composition in Clean Architecture

Now you can see why Clean Architecture naturally encourages composition.

The application consists of objects:

```text
Controller
UseCase
Repository
Generator
Logger
```

and the composition root assembles them:

```text
                 Composition Root
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
  Controller        UseCase        Repository
       │               │               │
       └───────────────┼───────────────┘
                       ▼
                    Adapters
```

The business objects don't need to know **where their collaborators came from**.

That's a powerful separation.

---

# 20. Composition and Your Monolith → Service Extraction Strategy

This is where today's concept connects directly to your larger architecture.

Initially:

```text
Monolith
│
├── URL Module
│   ├── Controller
│   ├── Use Cases
│   └── Repository
│
└── User Module
```

A module might depend on another module through:

```text
UserClient
```

The billing module is composed with:

```text
UserClient
```

Initially:

```text
Billing
   │
   ▼
LocalUserClient
   │
   ▼
User module
```

Later:

```text
Billing
   │
   ▼
HttpUserClient
   │
   ▼
User Service
```

The **composition changes**.

The business object doesn't.

That's a direct consequence of designing objects around abstractions and composing implementations externally.

---

# 21. Composition Root — The Big Picture

At this point, you should understand why `wire.ts` is not just some random setup file.

It is the place where we say:

```text
"These objects work together."
```

For example:

```text
wire.ts
│
├── MongoUrlRepository
│
├── NanoidShortCodeGenerator
│
├── UuidGenerator
│
├── CreateShortenedUrl
│       │
│       ├── repository
│       ├── idGenerator
│       └── shortCodeGenerator
│
├── CreateShortenedUrlController
│       │
│       └── createShortenedUrl
│
└── routes
        │
        └── controller
```

That's an **object composition graph**.

---

# 22. The Mental Model You Should Keep

When you see:

```ts
class A {
  constructor(
    private readonly b: B,
  ) {}
}
```

don't just think:

> "A constructor accepts B."

Think:

```text
A has-a B
     ↓
A collaborates with B
     ↓
A delegates some responsibility to B
     ↓
A is composed with B
```

If `B` is an interface:

```text
A
│
└── depends on abstraction B
          ▲
          │
     implementation
```

And if the dependency is supplied externally:

```text
composition
+
dependency injection
```

---

# 23. Practice Exercise

Build a small **Order Processing System**.

Create:

```text
OrderRepository
PaymentGateway
EmailSender
```

as interfaces.

Then create:

```text
OrderService
```

which receives all three through its constructor.

Conceptually:

```text
OrderService
│
├── OrderRepository
├── PaymentGateway
└── EmailSender
```

Its `placeOrder()` method should conceptually:

```text
1. Save order
2. Process payment
3. Send confirmation email
```

Then create two implementations of `PaymentGateway`:

```text
StripePaymentGateway
FakePaymentGateway
```

You should be able to construct:

```text
Production

OrderService
 ├── MongoOrderRepository
 ├── StripePaymentGateway
 └── SmtpEmailSender
```

and:

```text
Testing

OrderService
 ├── InMemoryOrderRepository
 ├── FakePaymentGateway
 └── FakeEmailSender
```

**Do not use inheritance yet. Do not create a DI container. Do not introduce decorators.**

The purpose is to make this idea automatic:

```text
Different behavior
       ↓
different objects
       ↓
different composition
       ↓
same OrderService
```

---

# OOP Checkpoint

Your progression is now:

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
✓ readonly
✓ Immutability basics
✓ Interfaces
✓ implements
✓ Structural typing
✓ Abstraction
✓ Abstraction boundaries
✓ Composition
✓ Has-a relationship
✓ Delegation
✓ Object graph
✓ Composition root
```

The next single concept is **Inheritance**.

We'll approach it carefully because inheritance is frequently overused. We'll first understand **what inheritance actually does at the object/type level**, then `extends`, method reuse, overriding, `super`, and the exact distinction between **inheritance and composition**.