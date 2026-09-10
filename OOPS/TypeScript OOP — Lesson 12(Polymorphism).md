# TypeScript OOP — Lesson 12: Polymorphism

We now move to **polymorphism**, which naturally follows inheritance and interfaces.

The word comes from:

```text
poly → many
morph → forms
```

So polymorphism literally means:

> **One common interface/type can represent different concrete forms, and the appropriate behavior is selected for the actual object.**

For your backend architecture, this is a critical concept because this is what makes the following possible:

```text
UrlRepository
   ├── MongoUrlRepository
   └── InMemoryUrlRepository
```

and:

```text
UserClient
   ├── LocalUserClient
   └── HttpUserClient
```

without changing the code that consumes them.

---

# 1. Start With the Simplest Example

Consider:

```ts
interface Animal {
  speak(): void;
}
```

Now:

```ts
class Dog implements Animal {
  speak(): void {
    console.log('Woof');
  }
}
```

and:

```ts
class Cat implements Animal {
  speak(): void {
    console.log('Meow');
  }
}
```

Both satisfy:

```text
Animal
└── speak()
```

But they behave differently.

```text
Dog
└── speak() → Woof

Cat
└── speak() → Meow
```

Now we can write:

```ts
const animals: Animal[] = [
  new Dog(),
  new Cat(),
];
```

And:

```ts
for (const animal of animals) {
  animal.speak();
}
```

Output:

```text
Woof
Meow
```

This is polymorphism.

---

# 2. The Key Idea

Look at this variable:

```ts
const animal: Animal = new Dog();
```

There are two things to distinguish:

```text
VARIABLE TYPE
     ↓
Animal

ACTUAL OBJECT
     ↓
Dog
```

The variable is saying:

> "I will interact with this object through the `Animal` contract."

The object is saying:

> "I am actually a `Dog`."

So:

```text
Animal reference
       │
       ▼
   Dog object
```

Then:

```ts
animal.speak();
```

executes the behavior belonging to the actual object:

```text
Dog.speak()
```

---

# 3. Why Is This Useful?

Suppose we have:

```ts
interface NotificationSender {
  send(message: string): void;
}
```

Implementations:

```text
EmailNotificationSender
SmsNotificationSender
PushNotificationSender
```

Now a service can simply depend on:

```ts
NotificationSender
```

It doesn't need separate code for every implementation.

```ts
class NotificationService {
  constructor(
    private readonly sender: NotificationSender,
  ) {}

  notify(message: string): void {
    this.sender.send(message);
  }
}
```

Now:

```text
                    NotificationService
                            │
                            ▼
                  NotificationSender
                            ▲
              ┌─────────────┼─────────────┐
              │             │             │
             Email          SMS           Push
```

The service calls:

```ts
this.sender.send(message);
```

and polymorphism determines which concrete implementation performs the operation.

---

# 4. Polymorphism Through Interfaces

This is the form you'll use most in your architecture.

```ts
interface PaymentGateway {
  pay(amount: number): void;
}
```

Implementations:

```ts
class StripePaymentGateway implements PaymentGateway {
  pay(amount: number): void {
    console.log(`Stripe: ${amount}`);
  }
}

class RazorpayPaymentGateway implements PaymentGateway {
  pay(amount: number): void {
    console.log(`Razorpay: ${amount}`);
  }
}
```

Now:

```ts
const gateway: PaymentGateway =
  new StripePaymentGateway();

gateway.pay(1000);
```

The consumer only knows:

```text
PaymentGateway
└── pay()
```

but the actual object is:

```text
StripePaymentGateway
```

If we change:

```ts
const gateway: PaymentGateway =
  new RazorpayPaymentGateway();
```

the calling code remains:

```ts
gateway.pay(1000);
```

Only the implementation changes.

---

# 5. Polymorphism Through Inheritance

Polymorphism isn't limited to interfaces.

Remember:

```ts
class Animal {
  speak(): void {
    console.log('Animal sound');
  }
}
```

Then:

```ts
class Dog extends Animal {
  override speak(): void {
    console.log('Woof');
  }
}
```

and:

```ts
class Cat extends Animal {
  override speak(): void {
    console.log('Meow');
  }
}
```

Now:

```ts
const animals: Animal[] = [
  new Dog(),
  new Cat(),
];
```

Then:

```ts
for (const animal of animals) {
  animal.speak();
}
```

The output is:

```text
Woof
Meow
```

The variable type is:

```text
Animal
```

but the behavior depends on the actual object.

---

# 6. `override` in TypeScript

TypeScript provides:

```ts
override
```

to explicitly say:

> "This method is overriding a method from the parent class."

Example:

```ts
class Animal {
  speak(): void {
    console.log('Animal sound');
  }
}

class Dog extends Animal {
  override speak(): void {
    console.log('Woof');
  }
}
```

This is preferable when overriding because TypeScript can verify that the parent actually contains the member being overridden.

For example, if you accidentally write:

```ts
class Dog extends Animal {
  override run(): void {
    console.log('Running');
  }
}
```

TypeScript will complain because `Animal` doesn't have `run()`.

So `override` gives you an additional compile-time safety check.

---

# 7. Polymorphism Means "Same Message, Different Behavior"

A useful mental model is:

```text
Caller
  │
  │ speak()
  ▼
Animal contract
  │
  ├── Dog → Woof
  ├── Cat → Meow
  └── Cow → Moo
```

The caller sends the same message:

```text
speak()
```

but different objects respond differently.

This is the essence of polymorphic behavior.

---

# 8. A Real Example

Suppose we have:

```ts
interface ReportGenerator {
  generate(): string;
}
```

Implementations:

```ts
class PdfReportGenerator implements ReportGenerator {
  generate(): string {
    return 'PDF report';
  }
}

class CsvReportGenerator implements ReportGenerator {
  generate(): string {
    return 'CSV report';
  }
}
```

Then:

```ts
class ReportService {
  constructor(
    private readonly generator: ReportGenerator,
  ) {}

  createReport(): string {
    return this.generator.generate();
  }
}
```

Now:

```ts
const pdfService = new ReportService(
  new PdfReportGenerator(),
);

const csvService = new ReportService(
  new CsvReportGenerator(),
);
```

Same service:

```text
ReportService
```

Different behavior:

```text
PDF → PDF report
CSV → CSV report
```

The behavior changed because the **composed dependency changed**.

This is where polymorphism and composition work together.

---

# 9. Polymorphism + Composition

We've now learned two concepts:

```text
Composition
→ object uses another object

Polymorphism
→ different objects can satisfy the same abstraction
```

Combine them:

```text
                Service
                   │
                   ▼
             SomeInterface
                   ▲
             ┌─────┴─────┐
             │           │
          Impl A       Impl B
```

Then composition chooses which implementation is used:

```text
Service
  │
  └── Impl A
```

or:

```text
Service
  │
  └── Impl B
```

The service code doesn't change.

---

# 10. This Is Exactly Your Repository Pattern

Consider:

```ts
interface UrlRepository {
  create(url: ShortenedUrl): Promise<void>;

  findByShortCode(
    shortCode: string,
  ): Promise<ShortenedUrl | null>;
}
```

Implementation 1:

```ts
class MongoUrlRepository
  implements UrlRepository {

  async create(url: ShortenedUrl): Promise<void> {
    // MongoDB
  }

  async findByShortCode(
    shortCode: string,
  ): Promise<ShortenedUrl | null> {
    // MongoDB
  }
}
```

Implementation 2:

```ts
class InMemoryUrlRepository
  implements UrlRepository {

  async create(url: ShortenedUrl): Promise<void> {
    // Map
  }

  async findByShortCode(
    shortCode: string,
  ): Promise<ShortenedUrl | null> {
    // Map
  }
}
```

The use case:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
  ) {}

  async execute(): Promise<void> {
    // uses repository
  }
}
```

Now:

```text
                 CreateShortenedUrl
                         │
                         ▼
                   UrlRepository
                         ▲
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
        MongoUrlRepository  InMemoryUrlRepository
```

This is **polymorphism**.

The use case doesn't need:

```ts
if (repository instanceof MongoUrlRepository) {
  // ...
}
```

That would defeat the purpose.

---

# 11. Local vs HTTP Module Client

This is even more directly connected to the architecture you originally wanted.

Suppose:

```ts
interface UserClient {
  isUserActive(
    userId: string,
  ): Promise<boolean>;
}
```

Phase 1:

```ts
class LocalUserClient implements UserClient {
  async isUserActive(
    userId: string,
  ): Promise<boolean> {
    // call user module directly
  }
}
```

Phase 2:

```ts
class HttpUserClient implements UserClient {
  async isUserActive(
    userId: string,
  ): Promise<boolean> {
    // HTTP request
  }
}
```

Billing only knows:

```ts
interface UserClient {
  isUserActive(
    userId: string,
  ): Promise<boolean>;
}
```

Then:

```text
                  Billing
                     │
                     ▼
                 UserClient
                     ▲
            ┌────────┴────────┐
            │                 │
            ▼                 ▼
     LocalUserClient     HttpUserClient
            │                 │
       same process        network
```

The same abstraction supports two completely different runtime behaviors.

**That is polymorphism doing real architectural work.**

---

# 12. Why This Makes Service Extraction Easier

Remember our original goal:

```text
Monolith first
      ↓
extract services gradually
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

After extraction:

```text
Billing
  │
  ▼
HttpUserClient
  │
  ▼
User service
```

The billing use case still calls:

```ts
await this.userClient.isUserActive(userId);
```

It doesn't care whether:

```text
local function call
```

or:

```text
HTTP request
```

happens underneath.

The architecture works because:

```text
Interface
+
Composition
+
Polymorphism
```

allow the implementation to change without changing the consumer.

---

# 13. Polymorphism and Dependency Injection

This also explains why **Dependency Injection** is so powerful.

Suppose:

```ts
class PaymentService {
  constructor(
    private readonly gateway: PaymentGateway,
  ) {}
}
```

The constructor accepts the abstraction:

```text
PaymentGateway
```

Then the composition root chooses:

```ts
new StripePaymentGateway()
```

or:

```ts
new RazorpayPaymentGateway()
```

Therefore:

```text
                 Composition Root
                        │
               chooses implementation
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
       StripeGateway          RazorpayGateway
            │                       │
            └───────────┬───────────┘
                        ▼
                 PaymentGateway
                        │
                        ▼
                 PaymentService
```

This is the combination you'll use constantly.

---

# 14. Polymorphism Doesn't Require Inheritance

This is important in TypeScript.

You might initially think:

```text
polymorphism = inheritance
```

That's not correct.

Interfaces can provide polymorphism:

```ts
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {}
}

class FileLogger implements Logger {
  log(message: string): void {}
}
```

No inheritance is necessary.

Yet:

```ts
const logger: Logger =
  new ConsoleLogger();
```

or:

```ts
const logger: Logger =
  new FileLogger();
```

works.

So:

```text
Polymorphism
   │
   ├── inheritance-based
   │
   └── interface/structural-based
```

For your backend architecture, the second form is especially important.

---

# 15. Structural Typing Makes TypeScript Interesting

Because TypeScript uses structural typing, an object doesn't always need to explicitly say:

```ts
implements Logger
```

Suppose:

```ts
interface Logger {
  log(message: string): void;
}
```

and:

```ts
class ConsoleLogger {
  log(message: string): void {
    console.log(message);
  }
}
```

This is valid:

```ts
const logger: Logger =
  new ConsoleLogger();
```

because the structure matches.

Conceptually:

```text
Required:

Logger
└── log(string)

Provided:

ConsoleLogger
└── log(string)
```

The shape matches.

This is **structural polymorphism**.

---

# 16. Polymorphism vs Method Overloading

Don't confuse these.

You may see:

```text
polymorphism
```

and:

```text
method overloading
```

in OOP discussions.

They are different concepts.

Polymorphism is about:

```text
same abstraction
+
different implementations
```

For example:

```text
PaymentGateway
├── Stripe
└── Razorpay
```

Method overloading is about allowing different parameter signatures for an operation.

We won't cover overloading today because it is a separate TypeScript/Java topic.

---

# 17. Why `instanceof` Is Usually a Warning Sign Here

Suppose:

```ts
interface PaymentGateway {
  pay(amount: number): void;
}
```

Then someone writes:

```ts
if (gateway instanceof StripePaymentGateway) {
  // Stripe-specific logic
} else if (
  gateway instanceof RazorpayPaymentGateway
) {
  // Razorpay-specific logic
}
```

You've now defeated much of the abstraction.

The consumer has become aware of the implementations.

Instead:

```ts
gateway.pay(amount);
```

Let polymorphism select the appropriate behavior.

This principle is extremely useful:

> **When code starts branching on concrete implementations, ask whether the abstraction is being bypassed.**

There are legitimate cases for `instanceof`, but it shouldn't be the default architecture for interchangeable implementations.

---

# 18. A Backend Example With Logging

Suppose:

```ts
interface Logger {
  info(message: string): void;
  error(message: string): void;
}
```

Implementations:

```text
ConsoleLogger
PinoLogger
SilentLogger
```

Then:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly logger: Logger,
  ) {}

  async execute(): Promise<void> {
    this.logger.info(
      'Creating shortened URL',
    );
  }
}
```

Production:

```text
CreateShortenedUrl
        │
        ▼
    PinoLogger
```

Tests:

```text
CreateShortenedUrl
        │
        ▼
    SilentLogger
```

The use case doesn't change.

That's polymorphism combined with composition.

---

# 19. The Deep Mental Model

You should now think of polymorphism like this:

```text
              Common Contract
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    Concrete A  Concrete B  Concrete C
        │           │           │
        ▼           ▼           ▼
    behavior A  behavior B  behavior C
```

The consumer does:

```text
contract.operation()
```

not:

```text
concreteImplementation.operation()
```

This gives us **substitutability**.

A valid implementation can be substituted for another implementation without changing the consumer's expected interaction.

---

# 20. Connection to Everything We've Learned

At this point, several OOP concepts are joining together.

```text
Interface
    ↓
defines contract

Abstraction
    ↓
defines what consumer needs

Encapsulation
    ↓
hides implementation details

Composition
    ↓
connects objects together

Polymorphism
    ↓
allows different implementations
to satisfy the same abstraction
```

Together:

```text
                  Application
                      │
                      ▼
                 Abstraction
                      │
                 Interface
                      │
             ┌────────┴────────┐
             ▼                 ▼
        Implementation A  Implementation B
             │                 │
             └────────┬────────┘
                      ▼
                 Composition
                      │
                      ▼
                 Application
```

This is becoming the conceptual foundation of your architecture.

---

# 21. Your URL-Service Mental Model

When we eventually build the actual URL service, you should be able to see:

```text
CreateShortenedUrl
│
├── UrlRepository
│      ├── MongoUrlRepository
│      └── InMemoryUrlRepository
│
├── IdGenerator
│      ├── UuidGenerator
│      └── FakeIdGenerator
│
└── ShortCodeGenerator
       ├── NanoidGenerator
       └── FakeShortCodeGenerator
```

The use case only knows:

```text
UrlRepository
IdGenerator
ShortCodeGenerator
```

The composition root chooses:

```text
Mongo
UUID
Nanoid
```

or during tests:

```text
Memory
Fake ID
Fake code
```

That's not just a collection of patterns.

It is the combined result of the OOP concepts you've been learning.

---

# 22. Practice Exercise

Build a small **Storage System**.

Define:

```ts
interface Storage {
  save(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
}
```

Create:

```text
MemoryStorage
FileStorage
```

Both must implement `Storage`.

Then:

```ts
class CacheService {
  constructor(
    private readonly storage: Storage,
  ) {}

  async set(
    key: string,
    value: string,
  ): Promise<void> {
    await this.storage.save(key, value);
  }

  async get(
    key: string,
  ): Promise<string | null> {
    return this.storage.get(key);
  }
}
```

Then construct:

```text
CacheService
     │
     ├── MemoryStorage
     │
     └── FileStorage
```

Ask yourself:

1. **Where is abstraction?**
    
2. **Where is encapsulation?**
    
3. **Where is composition?**
    
4. **Where is polymorphism?**
    
5. **Why doesn't `CacheService` need to know the concrete storage implementation?**
    

If you can answer all five, the concepts are connecting correctly.

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
✓ Inheritance vs composition
✓ Is-a vs has-a
✓ Polymorphism
✓ Interface-based polymorphism
✓ Inheritance-based polymorphism
✓ Substitution
✓ Polymorphism + composition
✓ Polymorphism + dependency injection
```

## Next: Association, Aggregation, and Composition

Before moving into SOLID, there is one useful OOP relationship topic worth learning properly: **how objects relate to each other**.

We'll distinguish:

```text
Association
Aggregation
Composition
```

using concrete examples such as:

```text
User ↔ Order
Department → Employee
Order → OrderItem
Car → Engine
```

and, importantly, determine **ownership and lifetime**. This will make the object relationships in your backend architecture much easier to model correctly.