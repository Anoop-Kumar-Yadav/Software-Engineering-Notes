# TypeScript OOP — Lesson 16: SOLID — Open/Closed Principle

We now move to the second SOLID principle:

> **O — Open/Closed Principle (OCP)**

The formal definition is:

> **Software entities should be open for extension but closed for modification.**

This sounds abstract, so we will derive it from a real problem rather than memorize it.

The core question is:

> **When a new behavior is added, can we add it without repeatedly modifying stable existing code?**

---

# 1. Start With a Real Problem

Imagine your URL shortener eventually supports analytics.

You want to track where a shortened URL was accessed.

You initially support:

```text
Google Analytics
```

So someone writes:

```ts
class AnalyticsService {
  track(event: string): void {
    console.log(`Sending to Google Analytics: ${event}`);
  }
}
```

Later you need:

```text
Mixpanel
PostHog
Internal analytics
```

A naive implementation might become:

```ts
class AnalyticsService {
  track(
    provider: string,
    event: string,
  ): void {
    if (provider === 'google') {
      // Google implementation
    } else if (provider === 'mixpanel') {
      // Mixpanel implementation
    } else if (provider === 'posthog') {
      // PostHog implementation
    }
  }
}
```

Every time another provider appears:

```text
New provider
     ↓
modify AnalyticsService
     ↓
add another if/else
```

This is where OCP becomes relevant.

---

# 2. What Does "Closed for Modification" Mean?

It does **not** mean:

> "The source code can never be changed."

That's impossible.

Instead, it means:

> **Once a piece of code has a stable responsibility, adding a new variation should ideally not require modifying that stable core logic.**

Suppose:

```text
AnalyticsService
```

contains the workflow:

```text
1. receive event
2. send event
```

Adding another analytics provider shouldn't require changing that workflow.

We want:

```text
Existing workflow
       │
       │ remains unchanged
       ▼
new implementation added
```

---

# 3. First See the Violation

Consider:

```ts
class PaymentService {
  pay(
    provider: string,
    amount: number,
  ): void {
    if (provider === 'stripe') {
      console.log(
        `Stripe payment: ${amount}`,
      );
    } else if (provider === 'razorpay') {
      console.log(
        `Razorpay payment: ${amount}`,
      );
    } else if (provider === 'paypal') {
      console.log(
        `PayPal payment: ${amount}`,
      );
    }
  }
}
```

Now suppose we add:

```text
Adyen
```

We must modify:

```ts
class PaymentService
```

and add:

```ts
else if (provider === 'adyen') {
  // ...
}
```

The existing class keeps changing as new providers arrive.

That's a typical OCP problem.

---

# 4. Why Is This Dangerous?

At first:

```text
Stripe
```

Then:

```text
Stripe
Razorpay
```

Then:

```text
Stripe
Razorpay
PayPal
```

Eventually:

```text
Stripe
Razorpay
PayPal
Adyen
Cashfree
...
```

The class becomes:

```text
PaymentService
├── Stripe knowledge
├── Razorpay knowledge
├── PayPal knowledge
├── Adyen knowledge
└── Cashfree knowledge
```

The class's responsibility is no longer simply:

```text
process payment
```

It has become:

```text
process payment
+
know every payment provider
```

This also starts violating **SRP**.

Notice how SOLID principles interact.

---

# 5. The First Step Toward OCP

Create an abstraction:

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

Now create implementations.

```ts
class StripePaymentGateway
  implements PaymentGateway {

  async pay(amount: number): Promise<void> {
    console.log(
      `Stripe payment: ${amount}`,
    );
  }
}
```

And:

```ts
class RazorpayPaymentGateway
  implements PaymentGateway {

  async pay(amount: number): Promise<void> {
    console.log(
      `Razorpay payment: ${amount}`,
    );
  }
}
```

Now:

```text
PaymentGateway
       ▲
       │
 ┌─────┴─────┐
 │           │
Stripe     Razorpay
```

The common abstraction remains stable.

---

# 6. Payment Service Becomes Stable

Now:

```ts
class PaymentService {
  constructor(
    private readonly gateway: PaymentGateway,
  ) {}

  async pay(
    amount: number,
  ): Promise<void> {
    await this.gateway.pay(amount);
  }
}
```

Notice what disappeared:

```text
if Stripe
if Razorpay
if PayPal
```

The service doesn't know which provider is being used.

It only knows:

```text
PaymentGateway
└── pay()
```

---

# 7. Adding a New Provider

Suppose we add PayPal:

```ts
class PayPalPaymentGateway
  implements PaymentGateway {

  async pay(amount: number): Promise<void> {
    console.log(
      `PayPal payment: ${amount}`,
    );
  }
}
```

Did we modify:

```text
PaymentService
```

No.

We **extended the system** by adding a new implementation.

```text
PaymentGateway
       ▲
       │
 ┌─────┼───────────┐
 │     │           │
Stripe Razorpay   PayPal
```

This is the essence of **open for extension**.

---

# 8. What Is Actually "Open"?

The abstraction is open to new implementations.

```text
PaymentGateway
      │
      ├── Stripe
      ├── Razorpay
      └── PayPal
```

The system can be extended by adding another:

```text
PaymentGateway implementation
```

without modifying the consumer.

So:

```text
Open
 ↓
new implementations can be added
```

---

# 9. What Is Actually "Closed"?

The stable consumer:

```ts
class PaymentService {
  constructor(
    private readonly gateway: PaymentGateway,
  ) {}

  async pay(amount: number) {
    await this.gateway.pay(amount);
  }
}
```

doesn't need modification when a new provider is added.

So:

```text
Closed
 ↓
stable business workflow doesn't change
```

That's what OCP means in practice.

---

# 10. OCP Depends Heavily on Polymorphism

Look at what makes this possible.

We have:

```text
PaymentGateway
```

with multiple implementations:

```text
StripePaymentGateway
RazorpayPaymentGateway
PayPalPaymentGateway
```

That's **polymorphism**.

The service can work with any implementation satisfying:

```ts
PaymentGateway
```

Therefore:

```text
Polymorphism
      ↓
multiple implementations
      ↓
new implementation can be added
      ↓
existing consumer remains unchanged
```

So OCP isn't an isolated principle.

It builds on the OOP concepts you've already learned.

---

# 11. OCP + Dependency Injection

How does `PaymentService` receive the gateway?

Through DI:

```ts
class PaymentService {
  constructor(
    private readonly gateway: PaymentGateway,
  ) {}
}
```

Then composition decides:

```ts
const paymentService =
  new PaymentService(
    new StripePaymentGateway(),
  );
```

Or:

```ts
const paymentService =
  new PaymentService(
    new RazorpayPaymentGateway(),
  );
```

Or:

```ts
const paymentService =
  new PaymentService(
    new PayPalPaymentGateway(),
  );
```

The service itself doesn't change.

So:

```text
Abstraction
      ↓
Polymorphism
      ↓
Composition
      ↓
Dependency Injection
      ↓
Open/Closed Principle
```

This is exactly the kind of chain you want to internalize.

---

# 12. OCP in Your URL Shortener

Now use the same idea for short-code generation.

Suppose initially:

```ts
class ShortCodeGenerator {
  generate(): string {
    // random algorithm
  }
}
```

Later you want:

```text
Nanoid
Base62
UUID-derived
Custom algorithm
```

Instead of putting all algorithms into one class:

```ts
class ShortCodeGenerator {
  generate(type: string): string {
    if (type === 'nanoid') {
      // ...
    }

    if (type === 'base62') {
      // ...
    }

    if (type === 'uuid') {
      // ...
    }

    return '';
  }
}
```

define:

```ts
interface ShortCodeGenerator {
  generate(): string;
}
```

Then:

```text
ShortCodeGenerator
       ▲
       │
 ┌─────┼─────────────┐
 │     │             │
Nanoid Base62     UuidBased
```

Your use case:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly generator: ShortCodeGenerator,
  ) {}

  async execute(): Promise<void> {
    const code =
      this.generator.generate();

    // ...
  }
}
```

Adding another algorithm doesn't require changing `CreateShortenedUrl`.

---

# 13. OCP and Your Repository

Same principle:

```ts
interface UrlRepository {
  create(url: ShortenedUrl): Promise<void>;
}
```

Implementations:

```text
MongoUrlRepository
PostgresUrlRepository
InMemoryUrlRepository
```

The use case:

```text
CreateShortenedUrl
        │
        ▼
   UrlRepository
```

doesn't need to know which database implementation exists.

If tomorrow you implement:

```text
DynamoUrlRepository
```

you add it.

You don't rewrite the use case.

That's OCP.

---

# 14. OCP and Local/HTTP Module Clients

This is the exact example from your architecture strategy.

You have:

```ts
interface UserClient {
  isUserActive(
    userId: string,
  ): Promise<boolean>;
}
```

Phase 1:

```text
LocalUserClient
```

Phase 2:

```text
HttpUserClient
```

Potentially later:

```text
GrpcUserClient
```

The billing use case remains:

```ts
class BillingService {
  constructor(
    private readonly userClient: UserClient,
  ) {}

  async check(
    userId: string,
  ): Promise<boolean> {
    return this.userClient.isUserActive(userId);
  }
}
```

Adding:

```text
HttpUserClient
```

doesn't require modifying:

```text
BillingService
```

This is OCP in a very real architectural scenario.

---

# 15. OCP Does Not Mean "Never Modify Existing Code"

This distinction matters.

Suppose your business requirement changes:

> "A payment must now require a transaction ID."

Then you may need to modify:

```ts
interface PaymentGateway {
  pay(
    amount: number,
    transactionId: string,
  ): Promise<void>;
}
```

and:

```text
PaymentService
```

That's completely fine.

OCP isn't saying:

> "Existing code must never change."

It's saying:

> **When adding a new variation of an existing abstraction, prefer extending the system rather than adding another branch to stable code.**

---

# 16. The "If/Else Explosion"

A very useful warning sign is:

```ts
if (type === 'A') {
  // A
} else if (type === 'B') {
  // B
} else if (type === 'C') {
  // C
}
```

This isn't automatically bad.

But if `type` represents **different implementations of the same conceptual behavior**, ask whether polymorphism would be better.

For example:

```text
payment provider
notification channel
storage backend
shipping provider
file format
authentication strategy
pricing strategy
```

These are often good candidates for an abstraction.

---

# 17. Example: Notification System

Bad:

```ts
class NotificationService {
  send(
    type: string,
    message: string,
  ): void {
    if (type === 'email') {
      // email
    } else if (type === 'sms') {
      // SMS
    } else if (type === 'push') {
      // push
    }
  }
}
```

Every new notification mechanism modifies the service.

Better:

```ts
interface NotificationSender {
  send(message: string): Promise<void>;
}
```

Implement:

```text
EmailNotificationSender
SmsNotificationSender
PushNotificationSender
```

Then:

```ts
class NotificationService {
  constructor(
    private readonly sender: NotificationSender,
  ) {}

  async send(
    message: string,
  ): Promise<void> {
    await this.sender.send(message);
  }
}
```

Now the system is extensible.

---

# 18. OCP and SRP Together

Let's compare the bad implementation.

```text
PaymentService
│
├── payment workflow
├── Stripe implementation
├── Razorpay implementation
├── PayPal implementation
└── provider selection
```

It violates SRP because it has multiple reasons to change.

It also makes OCP difficult because every provider addition modifies the class.

After refactoring:

```text
PaymentService
     │
     └── payment workflow

PaymentGateway
     │
     ├── Stripe
     ├── Razorpay
     └── PayPal
```

Now:

```text
PaymentService
    ↓
one coherent responsibility

PaymentGateway implementations
    ↓
provider-specific behavior
```

SRP and OCP reinforce each other.

---

# 19. OCP and Abstraction

Why does the abstraction matter?

Without:

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

the consumer has to know concrete implementations.

With the abstraction:

```text
PaymentService
      │
      ▼
PaymentGateway
```

the consumer can remain stable.

Therefore:

```text
Abstraction
   ↓
hides implementation details

Polymorphism
   ↓
allows multiple implementations

OCP
   ↓
allows new implementations without
changing stable consumers
```

---

# 20. OCP and Composition Root

Where do we choose the implementation?

At the composition root.

```ts
const gateway =
  new StripePaymentGateway();

const paymentService =
  new PaymentService(gateway);
```

If we change:

```ts
const gateway =
  new RazorpayPaymentGateway();
```

the composition changes.

The business service doesn't.

This is why `wire.ts` is so important in your architecture.

```text
wire.ts
   │
   ├── chooses implementation
   │
   ▼
PaymentService
```

The core stays stable.

---

# 21. OCP at the Service-Extraction Level

Now consider your monolith-to-service strategy.

Suppose:

```text
Billing
```

depends on:

```text
UserClient
```

Initially:

```text
UserClient
   ↓
LocalUserClient
```

After extraction:

```text
UserClient
   ↓
HttpUserClient
```

The billing business logic remains closed for this variation.

The system is extended by introducing:

```text
HttpUserClient
```

and changing composition.

This is an architectural application of OCP.

---

# 22. OCP Does Not Mean "Create an Interface for Everything"

This is critical.

Don't see:

```text
OCP
```

and immediately create:

```text
IUser
IUserService
IUserValidator
IStringFormatter
INumberFormatter
IObjectMapper
```

for every class.

Abstractions should exist around **meaningful variation or boundaries**.

Good candidate:

```text
PaymentGateway
```

because you genuinely expect multiple providers.

Good candidate:

```text
UrlRepository
```

because persistence technology may vary.

Potentially unnecessary:

```text
INameFormatter
```

if there will only ever be one trivial implementation.

The goal is **flexibility where variation actually exists**, not maximum abstraction.

---

# 23. OCP Has a Cost

There is a trade-off.

Without abstraction:

```text
simple
few files
easy initially
```

With abstraction:

```text
more files
more types
more indirection
more concepts
```

Therefore don't abstract every possible future variation.

A good rule is:

> **Abstract around real or highly probable variation and meaningful architectural boundaries, not hypothetical possibilities.**

This keeps your architecture flexible without turning it into an abstraction maze.

---

# 24. A Practical Design Question

When writing code, ask:

> **"What will likely vary independently?"**

For a URL shortener:

```text
Database
      ↓
likely variation

Cache
      ↓
likely variation

Short-code algorithm
      ↓
possible variation

HTTP framework
      ↓
architectural boundary

Business rule
      ↓
core behavior
```

For something that genuinely varies, an abstraction can make sense.

Then:

```text
stable logic
      ↓
depends on abstraction

variation
      ↓
implemented behind abstraction
```

---

# 25. OCP Mental Model

Remember this diagram:

```text
                 Stable Core
                     │
                     ▼
               Abstraction
                     ▲
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   Implementation A  B            C
```

When D arrives:

```text
                 Stable Core
                     │
                     ▼
               Abstraction
                     ▲
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
        A            B            C
                                  │
                                  ▼
                                  D
```

The stable core doesn't need:

```text
if D
```

added to it.

You **extend** the implementation set.

That's OCP.

---

# 26. The Chain From Today's Lesson

You should now see:

```text
SRP
↓
Separate responsibilities

Abstraction
↓
Define stable boundary

Polymorphism
↓
Allow multiple implementations

Composition
↓
Connect implementation to consumer

Dependency Injection
↓
Provide implementation externally

OCP
↓
Add new implementations without
modifying stable consumer logic
```

This is why we deliberately studied the OOP concepts before SOLID.

You're not memorizing isolated principles.

You're seeing **why they emerge from each other**.

---

# Practice Exercise

Design a **URL redirect strategy**.

Your URL shortener eventually needs different redirect behaviors:

```text
Permanent redirect
Temporary redirect
Preview redirect
```

Start with a bad design:

```ts
class RedirectService {
  redirect(
    type: string,
    url: string,
  ): void {
    if (type === 'permanent') {
      // ...
    } else if (type === 'temporary') {
      // ...
    } else if (type === 'preview') {
      // ...
    }
  }
}
```

Your task is to redesign it using:

```text
1. An abstraction
2. Multiple implementations
3. Composition
4. Dependency injection
5. Polymorphism
```

The target shape should be conceptually:

```text
RedirectService
       │
       ▼
RedirectStrategy
       ▲
   ┌───┼────────┐
   │   │        │
   ▼   ▼        ▼
Permanent Temporary Preview
```

Then imagine a new strategy:

```text
GeoBasedRedirect
```

Ask yourself:

> **Can I add `GeoBasedRedirect` without modifying `RedirectService`?**

If yes, you've applied OCP correctly.

---

# Checkpoint

```text
✓ OOP foundations

✓ Encapsulation
✓ Abstraction
✓ Interfaces
✓ Composition
✓ Delegation
✓ Object graph
✓ Inheritance
✓ Polymorphism
✓ Association
✓ Aggregation
✓ Composition as ownership

✓ Dependency Injection
✓ Constructor Injection
✓ Manual DI
✓ Composition Root
✓ Dependency Inversion vs DI

✓ SOLID
✓ S — Single Responsibility Principle
✓ Responsibility vs method count
✓ Reasons to change
✓ Cohesion
✓ Responsibility boundaries

✓ O — Open/Closed Principle
✓ Open for extension
✓ Closed for modification
✓ Stable core
✓ Extension through implementations
✓ OCP + polymorphism
✓ OCP + abstraction
✓ OCP + composition
✓ OCP + dependency injection
✓ OCP vs excessive abstraction
```

## Next: Liskov Substitution Principle

Next is **L — Liskov Substitution Principle (LSP)**.

This one is particularly important because it exposes a subtle problem:

```ts
const repository: UrlRepository =
  new SomeRepository();
```

may compile perfectly while the implementation **doesn't actually behave like the abstraction promises**.

We'll learn what substitutability really means, why inheritance can violate it, why interfaces don't automatically guarantee LSP, and we'll use concrete examples such as **repositories, payment gateways, and the classic Rectangle/Square problem**.