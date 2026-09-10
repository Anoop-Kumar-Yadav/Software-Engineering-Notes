# TypeScript OOP — Lesson 14: Dependency Injection

This is one of the most important lessons in the entire OOP sequence because **Dependency Injection connects the OOP concepts we've learned to the architecture you're building**.

You already know:

- **Encapsulation** — control internal state.
    
- **Abstraction** — expose what a consumer needs.
    
- **Interfaces** — define contracts.
    
- **Composition** — build objects using other objects.
    
- **Polymorphism** — substitute different implementations.
    

Dependency Injection brings these together.

> **Dependency Injection means an object receives the objects it depends on from outside instead of creating those dependencies itself.**

---

# 1. First Understand the Problem

Consider:

```ts
class UserService {
  private readonly repository: MongoUserRepository;

  constructor() {
    this.repository = new MongoUserRepository();
  }

  async getUser(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }
}
```

At first glance, this looks perfectly reasonable.

But look carefully.

`UserService` is responsible for:

```text
UserService
    │
    ├── business logic
    │
    └── creating MongoUserRepository
```

The service now knows:

```text
MongoDB implementation
```

rather than simply knowing:

```text
UserRepository capability
```

This creates unnecessary coupling.

---

# 2. What Is the Dependency?

A **dependency** is something an object needs in order to perform its responsibility.

Here:

```text
UserService
      │
      └── needs → UserRepository
```

Therefore:

```text
UserRepository
```

is a dependency of:

```text
UserService
```

In the first implementation, `UserService` creates its own dependency:

```text
UserService
      │
      └── new MongoUserRepository()
```

That's the problem we want to solve.

---

# 3. Move Creation Outside

Instead of:

```ts
class UserService {
  constructor() {
    this.repository = new MongoUserRepository();
  }
}
```

we do:

```ts
class UserService {
  constructor(
    private readonly repository: UserRepository,
  ) {}

  async getUser(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }
}
```

Now someone outside creates the repository:

```ts
const repository =
  new MongoUserRepository();

const userService =
  new UserService(repository);
```

This is **Dependency Injection**.

The dependency:

```text
MongoUserRepository
```

is injected into:

```text
UserService
```

instead of being created inside it.

---

# 4. The Basic Transformation

Remember this transformation.

### Before

```text
UserService
    │
    └── creates
          ↓
    MongoUserRepository
```

### After

```text
Outside
   │
   ├── creates MongoUserRepository
   │
   └── injects it
          ↓
      UserService
```

That is the core of DI.

Everything else is an extension of this idea.

---

# 5. Why Use an Interface?

We could write:

```ts
class UserService {
  constructor(
    private readonly repository: MongoUserRepository,
  ) {}
}
```

We've injected the dependency, so technically this is DI.

But we're still coupled to MongoDB.

Better:

```ts
interface UserRepository {
  findById(
    id: string,
  ): Promise<User | null>;
}
```

Then:

```ts
class UserService {
  constructor(
    private readonly repository: UserRepository,
  ) {}
}
```

Now:

```text
UserService
      │
      ▼
UserRepository
   interface
      ▲
      │
 ┌────┴─────┐
 │          │
Mongo     Memory
```

This combines:

```text
Abstraction
+
Composition
+
Polymorphism
+
Dependency Injection
```

---

# 6. Dependency Injection vs Dependency Inversion

These two names sound almost identical, but **they are different concepts**.

### Dependency Injection

A technique:

> **Provide dependencies from outside the object.**

Example:

```ts
new UserService(repository);
```

### Dependency Inversion

An architectural/design principle:

> **High-level code should depend on abstractions rather than low-level implementation details.**

Example:

```text
UserService
    │
    ▼
UserRepository
   interface
    ▲
    │
MongoUserRepository
```

So:

```text
Dependency Inversion
        ↓
design principle

Dependency Injection
        ↓
implementation technique
```

DI often helps us achieve Dependency Inversion, but they are not the same thing.

This distinction is extremely important.

---

# 7. Constructor Injection

There are multiple ways to inject dependencies.

The most important one for your architecture is:

> **Constructor Injection**

Example:

```ts
class UserService {
  constructor(
    private readonly repository: UserRepository,
  ) {}
}
```

Then:

```ts
const service =
  new UserService(repository);
```

The dependency is available immediately after object construction.

This is usually the preferred form because the object cannot be created without its required dependencies.

---

# 8. Why Constructor Injection Is Strong

Suppose a service requires:

```text
Repository
Logger
EmailSender
```

With constructor injection:

```ts
class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly logger: Logger,
    private readonly emailSender: EmailSender,
  ) {}
}
```

Now the constructor communicates:

> **These are required dependencies of UserService.**

The object cannot exist without them.

Conceptually:

```text
UserService
├── UserRepository
├── Logger
└── EmailSender
```

The dependency requirements are explicit.

---

# 9. Why `readonly` Fits DI So Well

Notice:

```ts
private readonly repository: UserRepository
```

Why `readonly`?

Because the dependency is established when the object is constructed.

You normally don't want:

```ts
service.repository = anotherRepository;
```

midway through the object's lifetime.

So:

```text
private
    ↓
consumer cannot directly access it

readonly
    ↓
object cannot replace it

constructor injection
    ↓
dependency supplied at creation
```

Together, this gives a very clean dependency model.

---

# 10. Optional Dependencies Are Different

Not every dependency must be mandatory.

For example:

```ts
class ReportService {
  constructor(
    private readonly logger?: Logger,
  ) {}
}
```

Now the logger is optional.

But be careful.

If a service genuinely requires something to function, making it optional simply to make construction easier usually weakens the design.

Prefer:

```ts
constructor(
  private readonly repository: UserRepository,
) {}
```

over:

```ts
constructor(
  private readonly repository?: UserRepository,
) {}
```

if the repository is fundamentally required.

A good constructor communicates the object's **minimum valid configuration**.

---

# 11. Manual DI — No Framework Needed

This is very important.

You don't need:

```text
NestJS DI
Inversify
tsyringe
Awilix
```

to use Dependency Injection.

You can do it manually.

For example:

```ts
const repository =
  new MongoUserRepository();

const logger =
  new PinoLogger();

const emailSender =
  new SmtpEmailSender();

const userService =
  new UserService(
    repository,
    logger,
    emailSender,
  );
```

That's Dependency Injection.

In fact, **you should understand manual DI before using a DI container**.

Otherwise the container can hide the underlying mechanism from you.

---

# 12. The Composition Root

Now we reach a concept you've already encountered:

> **Composition Root**

The composition root is the place where your application's object graph is assembled.

For example:

```text
wire.ts
```

could contain:

```ts
const repository =
  new MongoUserRepository();

const logger =
  new PinoLogger();

const emailSender =
  new SmtpEmailSender();

const userService =
  new UserService(
    repository,
    logger,
    emailSender,
  );
```

The important principle is:

> **Application objects should generally not decide which concrete dependencies to construct.**

The composition root makes those decisions.

---

# 13. Object Graph + DI

Let's make the object graph explicit.

Suppose:

```text
Controller
   ↓
UserService
   ↓
UserRepository
   ↓
MongoDB
```

With DI, `wire.ts` can construct:

```text
MongoDB
   ↓
MongoUserRepository
   ↓
UserService
   ↓
UserController
```

Notice the construction order.

You construct **from the bottom dependencies upward**.

```text
Infrastructure
      ↓
Repository
      ↓
Use Case / Service
      ↓
Controller
      ↓
Routes
      ↓
Server
```

This is a very useful practical rule.

---

# 14. Why This Construction Order Works

Suppose:

```text
UserService
```

needs:

```text
UserRepository
```

and:

```text
UserController
```

needs:

```text
UserService
```

Therefore:

```text
UserController
      │
      ▼
UserService
      │
      ▼
UserRepository
```

You cannot construct the controller before the service exists.

And you cannot construct the service before the repository exists.

Therefore:

```text
Repository
   ↓
Service
   ↓
Controller
```

This is **dependency order**.

---

# 15. Your URL Service

Now apply this directly to the project.

Suppose:

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

  async execute(
    originalUrl: string,
  ): Promise<void> {
    const id =
      this.idGenerator.generate();

    const shortCode =
      this.shortCodeGenerator.generate();

    // create entity

    // save through repository
  }
}
```

This use case doesn't create:

```text
MongoUrlRepository
UUIDGenerator
NanoidGenerator
```

It only requires:

```text
UrlRepository
IdGenerator
ShortCodeGenerator
```

---

# 16. `wire.ts` Decides the Implementations

Now:

```ts
const repository =
  new MongoUrlRepository();

const idGenerator =
  new UuidGenerator();

const shortCodeGenerator =
  new NanoidShortCodeGenerator();

const createShortenedUrl =
  new CreateShortenedUrl(
    repository,
    idGenerator,
    shortCodeGenerator,
  );
```

The dependency graph becomes:

```text
                    wire.ts
                      │
          ┌───────────┼────────────┐
          │           │            │
          ▼           ▼            ▼
      MongoRepo   UUIDGenerator  NanoidGenerator
          │           │            │
          └───────────┼────────────┘
                      ▼
             CreateShortenedUrl
```

This is the **composition root assembling the object graph**.

---

# 17. DI Makes Testing Easy

This is one of the biggest practical benefits.

Production:

```text
CreateShortenedUrl
       │
       ▼
MongoUrlRepository
```

Testing:

```text
CreateShortenedUrl
       │
       ▼
InMemoryUrlRepository
```

The use case remains unchanged.

You simply inject another implementation.

For example:

```ts
const repository =
  new InMemoryUrlRepository();

const useCase =
  new CreateShortenedUrl(
    repository,
    fakeIdGenerator,
    fakeShortCodeGenerator,
  );
```

No MongoDB is necessary.

---

# 18. DI Makes Environment-Specific Composition Possible

Development:

```text
UrlRepository
      ↓
MongoUrlRepository
```

Testing:

```text
UrlRepository
      ↓
InMemoryUrlRepository
```

Production:

```text
UrlRepository
      ↓
MongoUrlRepository
```

Potentially another environment:

```text
UrlRepository
      ↓
PostgresUrlRepository
```

The use case doesn't change.

Only composition changes.

---

# 19. DI and Your Monolith → Microservice Strategy

This is the most important connection to your earlier architecture.

Suppose billing needs:

```ts
interface UserClient {
  isUserActive(
    userId: string,
  ): Promise<boolean>;
}
```

The billing use case:

```ts
class CheckBillingEligibility {
  constructor(
    private readonly userClient: UserClient,
  ) {}

  async execute(
    userId: string,
  ): Promise<boolean> {
    return this.userClient.isUserActive(userId);
  }
}
```

Now Phase 1:

```ts
const userClient =
  new LocalUserClient();

const useCase =
  new CheckBillingEligibility(
    userClient,
  );
```

Phase 2:

```ts
const userClient =
  new HttpUserClient();

const useCase =
  new CheckBillingEligibility(
    userClient,
  );
```

Nothing inside the use case changes.

This is:

```text
Abstraction
      +
Polymorphism
      +
Composition
      +
Dependency Injection
```

working together.

---

# 20. The Critical Rule

Your business logic should generally **not do this**:

```ts
class CreateShortenedUrl {
  constructor() {
    this.repository =
      new MongoUrlRepository();

    this.generator =
      new NanoidGenerator();
  }
}
```

Instead:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
    private readonly generator: ShortCodeGenerator,
  ) {}
}
```

And outside:

```ts
const repository =
  new MongoUrlRepository();

const generator =
  new NanoidGenerator();

const useCase =
  new CreateShortenedUrl(
    repository,
    generator,
  );
```

The first version mixes:

```text
business behavior
+
dependency construction
```

The second separates:

```text
business behavior
+
object composition
```

That's a major architectural improvement.

---

# 21. DI Does Not Mean "Everything Must Be an Interface"

This is another important misconception.

You don't need:

```ts
interface Logger
interface DateService
interface StringHelper
interface ArrayHelper
interface MathHelper
```

just because DI exists.

The purpose of abstraction is to create a meaningful boundary.

For example, this is reasonable:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
  ) {}
}
```

But creating:

```text
IStringFormatter
IObjectHelper
IArrayUtility
```

for every tiny class can create unnecessary complexity.

Use abstractions where they provide meaningful decoupling, substitution, or architectural boundaries.

---

# 22. DI Doesn't Mean "Pass Everything Everywhere"

Another common mistake is excessive dependency injection.

Suppose:

```ts
class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly logger: Logger,
    private readonly clock: Clock,
    private readonly config: Config,
    private readonly metrics: Metrics,
    private readonly tracer: Tracer,
    private readonly formatter: Formatter,
    private readonly validator: Validator,
    private readonly cache: Cache,
    private readonly eventBus: EventBus,
  ) {}
}
```

This may indicate the class has too many responsibilities.

DI doesn't fix bad object design.

It makes dependencies explicit.

If there are too many dependencies, investigate whether the class itself is doing too much.

---

# 23. Constructor as a Validity Boundary

There's another important OOP idea here.

If an object requires:

```text
Repository
Generator
Logger
```

then:

```ts
constructor(
  repository: Repository,
  generator: Generator,
  logger: Logger,
)
```

ensures the object receives them before it becomes usable.

So after:

```ts
const service = new Service(
  repository,
  generator,
  logger,
);
```

you know:

```text
service
├── repository ✓
├── generator ✓
└── logger ✓
```

This is stronger than creating a partially configured object and calling setters later.

---

# 24. Why Setter Injection Is Usually Weaker

You could do:

```ts
class UserService {
  private repository!: UserRepository;

  setRepository(
    repository: UserRepository,
  ): void {
    this.repository = repository;
  }
}
```

Then:

```ts
const service = new UserService();

service.setRepository(repository);
```

The problem is:

```text
new UserService()
      ↓
object exists
      ↓
repository missing
      ↓
invalid state possible
```

Someone could forget:

```ts
service.setRepository(repository);
```

Constructor injection prevents this class of problem:

```text
new UserService(repository)
        ↓
valid dependency state
```

This is one reason constructor injection is generally preferred for **required dependencies**.

---

# 25. DI Is Really About Control of Construction

A very useful way to think about DI is:

> **Who controls object construction?**

Without DI:

```text
UserService
    │
    └── controls creation of Repository
```

With DI:

```text
Composition Root
       │
       ├── controls Repository creation
       │
       └── gives it to UserService
```

This is a much better separation of concerns.

The service focuses on:

```text
business behavior
```

The composition root focuses on:

```text
object construction
```

---

# 26. The Complete Architecture Picture

Now connect everything we've learned:

```text
                    Composition Root
                         wire.ts
                            │
            ┌───────────────┼────────────────┐
            │               │                │
            ▼               ▼                ▼
       MongoRepository  UUIDGenerator   NanoidGenerator
            │               │                │
            └───────────────┼────────────────┘
                            ▼
                  CreateShortenedUrl
                            │
                            ▼
                       Controller
                            │
                            ▼
                          Routes
                            │
                            ▼
                       HTTP Server
```

The important direction is:

```text
HTTP
 ↓
Controller
 ↓
Use Case
 ↓
Port
 ↑
Adapter
 ↓
Infrastructure
```

And `wire.ts` sits outside that flow and **connects the implementations together**.

---

# 27. The Mental Model to Memorize

When you design a class, ask:

### 1. What does this class need?

```text
Repository
Logger
Generator
Client
```

### 2. Are those dependencies created inside it?

If yes, consider moving creation outside.

### 3. Can the class depend on an abstraction?

Instead of:

```text
MongoRepository
```

use:

```text
Repository
```

if that boundary is meaningful.

### 4. Where should the concrete implementation be selected?

Usually:

```text
composition root
wire.ts
```

### 5. How is the dependency provided?

Prefer constructor injection for required dependencies:

```ts
constructor(
  private readonly repository: Repository,
) {}
```

This five-step thought process will be extremely useful when you start creating new applications from scratch.

---

# 28. One Final Distinction

Don't collapse these concepts into one.

```text
Abstraction
    ↓
What should the consumer know?

Interface
    ↓
How can TypeScript express the contract?

Composition
    ↓
How are objects connected?

Polymorphism
    ↓
How can different implementations satisfy the contract?

Dependency Injection
    ↓
How does the object receive those dependencies?

Composition Root
    ↓
Where are concrete objects assembled?
```

This is the conceptual chain you've been building.

```text
Interface
    ↓
Abstraction
    ↓
Polymorphism
    ↓
Composition
    ↓
Dependency Injection
    ↓
Architecture
```

---

# Practice Exercise

Build a small **URL Service object graph** manually.

Create these interfaces:

```text
UrlRepository
IdGenerator
ShortCodeGenerator
```

Create these implementations:

```text
InMemoryUrlRepository
SimpleIdGenerator
SimpleShortCodeGenerator
```

Create:

```text
CreateShortenedUrl
```

which receives all three through its constructor.

Then create a `wire.ts`-style composition function:

```text
createUrlModule()
```

which:

1. Creates the concrete dependencies.
    
2. Injects them into `CreateShortenedUrl`.
    
3. Returns the configured use case.
    

Your final mental structure should be:

```text
createUrlModule()
       │
       ├── new InMemoryUrlRepository()
       ├── new SimpleIdGenerator()
       ├── new SimpleShortCodeGenerator()
       │
       └── new CreateShortenedUrl(...)
                    │
                    ├── UrlRepository
                    ├── IdGenerator
                    └── ShortCodeGenerator
```

**Don't use a DI library. Don't use Express. Don't use MongoDB yet.** The objective is to make manual dependency injection completely natural before we introduce frameworks or infrastructure.

---

# OOP Checkpoint

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

✓ Inheritance
✓ extends
✓ Parent / child classes
✓ super()
✓ Method overriding
✓ override
✓ Is-a vs has-a

✓ Polymorphism
✓ Interface-based polymorphism
✓ Inheritance-based polymorphism
✓ Substitution

✓ Association
✓ Aggregation
✓ Composition as ownership
✓ Object lifecycle

✓ Dependency Injection
✓ Constructor Injection
✓ Dependency Inversion vs DI
✓ Manual DI
✓ Dependency graph
✓ Composition Root
```

## Next: SOLID — Single Responsibility Principle

We now have enough OOP mechanics to start studying **SOLID** properly.

We'll **not** cover all five principles at once. We'll take exactly one: **Single Responsibility Principle (SRP)**, starting from a badly designed backend class and progressively decomposing it into domain logic, persistence, logging, and HTTP responsibilities.

The goal will be to learn **how to recognize a responsibility boundary yourself**, rather than memorizing the phrase "a class should have one reason to change."