# TypeScript OOP — Lesson 15: SOLID — Single Responsibility Principle

We now enter **SOLID**. We will study only the first principle today:

> **S — Single Responsibility Principle (SRP)**

Do not memorize it as merely:

> "A class should do one thing."

That definition is too simplistic and often leads to bad designs.

A more precise definition is:

> **A class should have one coherent responsibility and therefore one primary reason to change.**

The phrase **reason to change** is the important part.

---

# 1. Why SRP Exists

Imagine we are building your URL shortener.

A beginner might start with:

```ts
class UrlService {
  createUrl(): void {
    // validate URL
    // generate short code
    // save to MongoDB
    // log operation
    // send response
  }
}
```

It looks convenient.

But this class is actually responsible for several unrelated concerns:

```text
UrlService
│
├── validation
├── short-code generation
├── persistence
├── logging
└── HTTP response
```

Now ask:

> **How many different things could force this class to change?**

Quite a few.

```text
URL validation rule changes
        ↓
UrlService changes

MongoDB implementation changes
        ↓
UrlService changes

Logging system changes
        ↓
UrlService changes

HTTP response format changes
        ↓
UrlService changes
```

That is the problem SRP tries to prevent.

---

# 2. "One Responsibility" Does Not Mean "One Method"

This is a very common misunderstanding.

This class:

```ts
class User {
  validate(): void {}
  activate(): void {}
  deactivate(): void {}
  changeName(): void {}
}
```

can still have multiple methods while having one coherent responsibility:

```text
User
↓
maintain the state and business rules
of a user
```

SRP does **not** mean:

```text
1 class = 1 method
```

Nor does it mean:

```text
1 class = 1 tiny operation
```

Instead:

```text
1 class
   ↓
1 cohesive responsibility
   ↓
1 primary reason to change
```

---

# 3. What Is a Responsibility?

A responsibility is a **coherent area of behavior or knowledge** owned by a component.

For example:

```text
UserRepository
    ↓
persist/retrieve users

EmailSender
    ↓
send emails

ShortCodeGenerator
    ↓
generate short codes

CreateShortenedUrl
    ↓
execute the business operation
```

Each has a recognizable responsibility.

The important word is **coherent**.

---

# 4. A Bad Example

Let's build a deliberately bad URL service.

```ts
class UrlService {
  async createUrl(originalUrl: string): Promise<string> {
    if (!originalUrl.startsWith('http')) {
      throw new Error('Invalid URL');
    }

    const shortCode =
      Math.random().toString(36).slice(2, 8);

    await fetch(
      'mongodb://database/urls',
      {
        method: 'POST',
        body: JSON.stringify({
          originalUrl,
          shortCode,
        }),
      },
    );

    console.log(
      `Created URL: ${shortCode}`,
    );

    return `https://example.com/${shortCode}`;
  }
}
```

This class is doing several things.

Let's identify them.

```text
UrlService
│
├── validates input
├── generates short code
├── persists data
├── logs
└── constructs public URL
```

The problem isn't that there are five methods.

The problem is that there are **five different reasons this class might change**.

---

# 5. Think in Terms of Change

Suppose your product manager says:

> "URLs must now allow only HTTPS."

Which component should change?

```text
Validation rules
```

Now suppose:

> "We're moving from MongoDB to PostgreSQL."

Which component should change?

```text
Persistence
```

Now:

> "We are replacing console logging with Pino."

Which component?

```text
Logging
```

And:

> "The public URL format changed."

Which component?

```text
URL representation
```

If all of these changes require modifying:

```text
UrlService
```

then the class has too many responsibilities.

---

# 6. Separate the Responsibilities

We can decompose the class:

```text
                  CreateShortenedUrl
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
      Validator       Generator      Repository
```

And logging can be another collaborator:

```text
CreateShortenedUrl
       │
       ├── UrlValidator
       ├── ShortCodeGenerator
       ├── UrlRepository
       └── Logger
```

Now each component has a much clearer reason to change.

---

# 7. Extract Validation

Instead of:

```ts
class UrlService {
  createUrl(url: string) {
    if (!url.startsWith('http')) {
      throw new Error('Invalid URL');
    }

    // ...
  }
}
```

we can have:

```ts
class UrlValidator {
  validate(url: string): void {
    if (!url.startsWith('http')) {
      throw new Error('Invalid URL');
    }
  }
}
```

Now:

```text
UrlValidator
    ↓
URL validation rules
```

If validation rules change, this class changes.

That's a coherent responsibility.

---

# 8. Extract Short-Code Generation

Instead of:

```ts
const shortCode =
  Math.random().toString(36).slice(2, 8);
```

inside the use case:

```ts
class ShortCodeGenerator {
  generate(): string {
    return Math.random()
      .toString(36)
      .slice(2, 8);
  }
}
```

Now:

```text
ShortCodeGenerator
        ↓
short-code generation
```

Later you might replace it with Nanoid.

The business operation doesn't need to know.

---

# 9. Extract Persistence

Instead of:

```ts
await fetch(
  'mongodb://database/urls',
  // ...
);
```

we define:

```ts
interface UrlRepository {
  create(url: ShortenedUrl): Promise<void>;
}
```

Then:

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

Now:

```text
MongoUrlRepository
       ↓
persistence implementation
```

And:

```text
UrlRepository
       ↓
persistence abstraction
```

This also connects to our previous lessons on **abstraction and polymorphism**.

---

# 10. Extract Logging

Instead of:

```ts
console.log(
  `Created URL: ${shortCode}`,
);
```

define:

```ts
interface Logger {
  info(message: string): void;
}
```

Implementation:

```ts
class ConsoleLogger implements Logger {
  info(message: string): void {
    console.log(message);
  }
}
```

Now the application can later use:

```text
PinoLogger
```

without changing the business logic.

---

# 11. The Resulting Use Case

Now our main operation becomes much smaller:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly validator: UrlValidator,
    private readonly generator: ShortCodeGenerator,
    private readonly repository: UrlRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    originalUrl: string,
  ): Promise<string> {
    this.validator.validate(originalUrl);

    const shortCode =
      this.generator.generate();

    const url = new ShortenedUrl(
      originalUrl,
      shortCode,
    );

    await this.repository.create(url);

    this.logger.info(
      `Created URL: ${shortCode}`,
    );

    return shortCode;
  }
}
```

Now the responsibility is much clearer:

```text
CreateShortenedUrl
        ↓
orchestrate the create-URL business operation
```

It doesn't know:

```text
MongoDB details
short-code algorithm
logging implementation
```

---

# 12. Notice What Happened

We didn't merely make the code "smaller."

We changed the **responsibility boundaries**.

Before:

```text
                  UrlService
                     │
        ┌────────────┼────────────┐
        │            │            │
     Business     Database      Logging
       Logic
```

After:

```text
              CreateShortenedUrl
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
 Validator       Repository     Generator
                     │
                     ▼
                  MongoDB
```

The central class now coordinates collaborators.

That's much more maintainable.

---

# 13. SRP Is About Reasons to Change

Let's make this concrete.

|Component|Primary responsibility|Example reason to change|
|---|---|---|
|`UrlValidator`|Validate URLs|Validation rules change|
|`ShortCodeGenerator`|Generate codes|Generation algorithm changes|
|`MongoUrlRepository`|Persist URLs|Database implementation changes|
|`Logger`|Record logs|Logging infrastructure changes|
|`CreateShortenedUrl`|Execute creation workflow|Business workflow changes|

This is what SRP is trying to achieve.

Notice that **each class can contain many lines of code** and still satisfy SRP.

---

# 14. SRP Does Not Mean "Never Have Dependencies"

In fact, SRP often produces **more dependencies**.

Before:

```text
UrlService
```

did everything.

After:

```text
CreateShortenedUrl
├── Validator
├── Generator
├── Repository
└── Logger
```

There are more objects.

That is intentional.

We're trading:

```text
one giant tightly coupled object
```

for:

```text
multiple focused objects
```

and connecting them through explicit dependencies.

This is where your previous lessons on **composition and DI** become useful.

---

# 15. SRP + Composition

We learned:

> Composition means building an object from other objects.

Now:

```text
CreateShortenedUrl
│
├── UrlValidator
├── ShortCodeGenerator
├── UrlRepository
└── Logger
```

is a composed object.

So SRP gives us **good responsibility boundaries**, while composition gives us a mechanism for connecting those responsibilities.

---

# 16. SRP + Dependency Injection

And because those collaborators are injected:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
  ) {}
}
```

we can change implementations without changing the use case.

So:

```text
SRP
 ↓
separate responsibilities

Abstraction
 ↓
define contracts

Composition
 ↓
connect objects

DI
 ↓
provide dependencies

Polymorphism
 ↓
allow alternative implementations
```

This is the architecture you've been gradually building toward.

---

# 17. SRP in Your Folder Structure

This also explains why your architecture has separate directories.

For example:

```text
url-service/
│
├── core/
│   ├── entities/
│   ├── use-cases/
│   └── ports.ts
│
├── adapters/
│   ├── db/
│   ├── cache/
│   └── module-clients/
│
└── entrypoints/
    └── http/
```

These aren't arbitrary folders.

They represent **different responsibility boundaries**.

For example:

```text
entities
    ↓
domain model

use-cases
    ↓
application behavior

db adapters
    ↓
persistence implementation

HTTP entrypoints
    ↓
HTTP interaction
```

SRP exists at both the **class level** and the **architectural/module level**.

---

# 18. SRP Applies Beyond Classes

This is an important point.

SRP is frequently explained as:

> "A class should have one responsibility."

But the underlying principle is broader.

You can apply the same thinking to:

```text
function
class
module
package
service
microservice
```

For example, a function doing:

```text
validation
database access
HTTP formatting
email sending
```

has too many responsibilities even if it isn't a class.

Likewise, a module that owns:

```text
billing
authentication
URL shortening
analytics
```

may have an architectural responsibility problem.

---

# 19. SRP Does Not Mean "One Class Per Concept"

Suppose:

```text
User
```

has:

```text
name
email
activate()
deactivate()
changePassword()
```

Don't immediately create:

```text
UserName
UserEmail
UserActivation
UserDeactivation
PasswordChanger
```

just because each behavior is technically different.

Ask:

> Are these behaviors part of one coherent responsibility?

If they are all part of the user domain model, keeping them together may be correct.

SRP is not a license for **class explosion**.

---

# 20. Cohesion Matters

The concept you should learn alongside SRP is **cohesion**.

High cohesion means:

> The things inside a component strongly belong together.

For example:

```text
ShortCodeGenerator
├── generate()
├── generateFromAlphabet()
└── validateCode()
```

These are related to short-code generation.

High cohesion.

But:

```text
ShortCodeGenerator
├── generate()
├── sendEmail()
├── saveToMongo()
└── formatHttpResponse()
```

Low cohesion.

The methods don't belong to one coherent responsibility.

So a good component aims for:

```text
High cohesion
+
Low unnecessary coupling
```

We'll study coupling more deeply later.

---

# 21. A Useful Test: The Change Question

When reviewing a class, ask:

> **"What kinds of changes could require me to modify this class?"**

Suppose:

```text
CreateShortenedUrl
```

could change because:

```text
business rule changes
```

That's expected.

But if it also changes because:

```text
MongoDB changes
logging library changes
HTTP framework changes
short-code library changes
```

that's a warning.

You want those concerns isolated.

---

# 22. A More Precise URL Example

Imagine this:

```ts
class CreateShortenedUrl {
  async execute(url: string) {
    // Zod validation
    // Nanoid generation
    // Mongoose model
    // Pino logging
    // Redis cache
    // HTTP response
  }
}
```

Now imagine six independent technology decisions.

```text
Zod
Nanoid
Mongoose
Pino
Redis
Express
```

If the use case directly knows all six, your core business logic is coupled to infrastructure.

Instead:

```text
CreateShortenedUrl
│
├── UrlValidator
├── ShortCodeGenerator
├── UrlRepository
├── Cache
└── Logger
```

and those abstractions are implemented elsewhere.

Now the use case expresses the **business workflow**, not the technology stack.

---

# 23. SRP and Clean Architecture

This is one of the deepest connections.

Clean Architecture tries to keep:

```text
business rules
```

separate from:

```text
external mechanisms
```

SRP helps us decide where those responsibilities belong.

For example:

```text
Business rule
    ↓
core/use-case

MongoDB
    ↓
adapter

Express
    ↓
entrypoint

Pino
    ↓
adapter/infrastructure
```

So SRP isn't the entire reason Clean Architecture works, but it is one of the principles that helps us establish those boundaries.

---

# 24. SRP and Your Future Microservices

SRP also applies at the service level.

Suppose you create:

```text
mega-service
```

that handles:

```text
authentication
URL shortening
billing
notifications
analytics
```

You may eventually discover:

```text
different scaling requirements
different deployment frequency
different ownership
different data boundaries
```

That suggests architectural separation.

Your earlier strategy:

```text
monolith
   ↓
modular monolith
   ↓
extract services
```

works partly because the modules already have **coherent responsibilities**.

For example:

```text
url-shortener
    ↓
URL lifecycle

user
    ↓
user lifecycle

billing
    ↓
billing lifecycle
```

SRP therefore influences architecture beyond individual classes.

---

# 25. What SRP Does NOT Say

SRP does **not** say:

```text
❌ Every class must be tiny.
❌ Every method needs its own class.
❌ Every responsibility needs a separate package.
❌ Every class should have exactly one method.
❌ Every piece of code needs an interface.
❌ You should split everything immediately.
```

Instead:

```text
✓ Keep responsibilities cohesive.
✓ Separate unrelated reasons for change.
✓ Keep boundaries meaningful.
✓ Avoid mixing business concerns with infrastructure concerns.
```

That's the practical interpretation.

---

# 26. The SRP Decision Process

When creating a class from scratch, use this sequence:

### Step 1 — State its responsibility in one sentence

For example:

> `CreateShortenedUrl` orchestrates creation of a shortened URL.

If your sentence becomes:

> "It validates URLs, stores URLs, sends emails, logs, handles HTTP, and generates codes..."

you probably have a problem.

### Step 2 — Ask what can cause it to change

List the reasons.

```text
business rule
database
logging
HTTP
algorithm
```

If unrelated categories appear, investigate.

### Step 3 — Extract genuinely independent responsibilities

Create:

```text
Validator
Repository
Generator
Logger
```

only when the separation is meaningful.

### Step 4 — Connect them through composition

```text
UseCase
├── Validator
├── Repository
├── Generator
└── Logger
```

### Step 5 — Inject dependencies

```ts
constructor(
  validator: Validator,
  repository: Repository,
  generator: Generator,
  logger: Logger,
)
```

Now the responsibility boundary is explicit.

---

# 27. The Big Picture

We've now built a chain of ideas:

```text
                OOP
                 │
        ┌────────┼─────────┐
        │        │         │
        ▼        ▼         ▼
   Encapsulation Abstraction Composition
        │        │         │
        └────────┼─────────┘
                 ▼
           Polymorphism
                 │
                 ▼
       Dependency Injection
                 │
                 ▼
              SOLID
                 │
                 ▼
                SRP
```

And SRP gives us a way to decide:

> **Which behavior belongs in which object?**

That's a foundational design skill.

---

# 28. Practice Exercise

Take this intentionally bad class:

```ts
class OrderService {
  async createOrder(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    // validate user
    // calculate price
    // save order to database
    // process payment
    // send confirmation email
    // write logs
    // update cache
  }
}
```

Don't implement it yet.

Instead, identify the responsibilities.

You should arrive at something conceptually like:

```text
OrderService
│
├── UserValidator
├── PriceCalculator
├── OrderRepository
├── PaymentGateway
├── EmailSender
├── Logger
└── Cache
```

Then ask:

> **What is the actual responsibility left for `OrderService`?**

The answer should be something close to:

```text
Orchestrate the order-creation workflow.
```

That distinction is extremely important.

The service doesn't need to **perform every operation itself**. It can coordinate specialized collaborators.

---

# OOP / Design Checkpoint

```text
✓ Classes
✓ Objects
✓ Properties
✓ Methods
✓ Constructors
✓ this
✓ Access modifiers
✓ Encapsulation
✓ Invariants
✓ static
✓ readonly

✓ Interfaces
✓ implements
✓ Structural typing
✓ Abstraction
✓ Abstraction boundaries

✓ Composition
✓ Has-a
✓ Delegation
✓ Object graph
✓ Composition root

✓ Inheritance
✓ extends
✓ super()
✓ Method overriding
✓ override
✓ Is-a

✓ Polymorphism
✓ Interface-based polymorphism
✓ Inheritance-based polymorphism
✓ Substitution

✓ Association
✓ Aggregation
✓ Composition as ownership
✓ Object lifecycle
✓ Dependencies

✓ Dependency Injection
✓ Constructor Injection
✓ Manual DI
✓ Dependency Inversion vs DI

✓ SOLID
✓ Single Responsibility Principle
✓ Responsibility vs method count
✓ Reasons to change
✓ Cohesion
✓ Responsibility boundaries
```

## Next: Open-Closed Principle

The next concept is **O — Open/Closed Principle (OCP)**.

We'll take a concrete problem such as:

```text
Payment processing
    ↓
if Stripe
    ↓
if Razorpay
    ↓
if PayPal
    ↓
if ...
```

and see how this turns into an increasingly fragile class.

Then we'll use **abstraction + polymorphism + composition** to make the system extensible so that adding a new payment provider doesn't require repeatedly modifying the core workflow.

This will be the first point where you'll see **why the OOP concepts we've learned are not isolated concepts but tools that work together to produce extensible architecture**.