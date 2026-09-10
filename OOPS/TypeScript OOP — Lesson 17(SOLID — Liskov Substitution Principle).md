# TypeScript OOP — Lesson 17: SOLID — Liskov Substitution Principle

We now move to **L — Liskov Substitution Principle (LSP)**.

This is one of the most important SOLID principles to understand correctly because it deals with something deeper than syntax:

> **If a component claims to implement an abstraction, can the consumer safely use it wherever that abstraction is expected?**

The classic formal statement is:

> **Objects of a subtype should be replaceable with objects of their base type without breaking the correctness of the program.**

But for our architecture, a better practical interpretation is:

> **Any implementation of a contract must honor the behavioral expectations of that contract.**

That second sentence is the one I want you to remember.

---

# 1. Start With What We Already Know

We previously created:

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

Then:

```ts
class StripePaymentGateway
  implements PaymentGateway {

  async pay(amount: number): Promise<void> {
    // process payment
  }
}
```

and:

```ts
class RazorpayPaymentGateway
  implements PaymentGateway {

  async pay(amount: number): Promise<void> {
    // process payment
  }
}
```

The consumer says:

```ts
class PaymentService {
  constructor(
    private readonly gateway: PaymentGateway,
  ) {}

  async execute(amount: number): Promise<void> {
    await this.gateway.pay(amount);
  }
}
```

Because of polymorphism, we can substitute:

```text
PaymentGateway
    ▲
    │
    ├── StripePaymentGateway
    └── RazorpayPaymentGateway
```

But there's an important question:

> **Does merely implementing the interface guarantee that both implementations are valid substitutes?**

**No.**

That's exactly where LSP begins.

---

# 2. Interface Compatibility Is Not Behavioral Compatibility

Consider:

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

Now someone creates:

```ts
class FakePaymentGateway
  implements PaymentGateway {

  async pay(amount: number): Promise<void> {
    throw new Error('Not supported');
  }
}
```

TypeScript accepts this.

The method exists.

The signature matches.

But imagine:

```ts
const gateway: PaymentGateway =
  new FakePaymentGateway();

await gateway.pay(1000);
```

The consumer expects:

```text
pay()
↓
payment is processed
```

Instead:

```text
pay()
↓
throws "Not supported"
```

The implementation satisfies the **syntactic contract** but violates the **behavioral contract**.

That's an LSP violation.

---

# 3. LSP Is About Behavior

This is the key distinction:

```text
TypeScript checks
       ↓
Does the shape match?

LSP asks
       ↓
Does the behavior remain valid?
```

So:

```ts
class Something implements PaymentGateway
```

only tells TypeScript:

> "This class has the required method."

It does **not** prove:

> "This class behaves correctly whenever `PaymentGateway` is expected."

That second requirement is the responsibility of the designer.

---

# 4. The Simple Substitution Test

Whenever you have:

```ts
const x: SomeAbstraction =
  new ConcreteImplementation();
```

ask:

> **Could I replace this implementation with another valid implementation without forcing the consumer to change its assumptions?**

For example:

```text
PaymentGateway
   ├── Stripe
   ├── Razorpay
   └── PayPal
```

If `PaymentService` can work correctly with all of them:

```text
✓ Stripe
✓ Razorpay
✓ PayPal
```

then substitution is working properly.

---

# 5. A Simple Violation

Suppose:

```ts
interface FileStorage {
  save(
    filename: string,
    content: Buffer,
  ): Promise<void>;
}
```

Production implementation:

```ts
class LocalFileStorage
  implements FileStorage {

  async save(
    filename: string,
    content: Buffer,
  ): Promise<void> {
    // save file
  }
}
```

Now:

```ts
class ReadOnlyFileStorage
  implements FileStorage {

  async save(
    filename: string,
    content: Buffer,
  ): Promise<void> {
    throw new Error(
      'Writing is not supported',
    );
  }
}
```

Technically:

```text
ReadOnlyFileStorage
implements FileStorage
```

But semantically:

```text
FileStorage
↓
supports save()

ReadOnlyFileStorage
↓
doesn't support save()
```

So the abstraction is wrong.

The problem isn't necessarily the implementation.

The **contract itself doesn't represent the capabilities correctly**.

---

# 6. Fix the Abstraction

Instead of:

```ts
interface FileStorage {
  save(
    filename: string,
    content: Buffer,
  ): Promise<void>;

  read(
    filename: string,
  ): Promise<Buffer>;
}
```

split the capabilities:

```ts
interface FileWriter {
  save(
    filename: string,
    content: Buffer,
  ): Promise<void>;
}

interface FileReader {
  read(
    filename: string,
  ): Promise<Buffer>;
}
```

Now:

```text
ReadOnlyStorage
      │
      └── implements FileReader
```

and:

```text
WritableStorage
      │
      ├── FileReader
      └── FileWriter
```

This is a major design lesson:

> **When an implementation cannot honor part of a contract, the contract may be too broad.**

We'll later connect this strongly to **Interface Segregation Principle**.

---

# 7. The Famous Rectangle/Square Example

Now let's look at the classic inheritance example.

Suppose:

```ts
class Rectangle {
  constructor(
    protected width: number,
    protected height: number,
  ) {}

  setWidth(width: number): void {
    this.width = width;
  }

  setHeight(height: number): void {
    this.height = height;
  }

  area(): number {
    return this.width * this.height;
  }
}
```

Then someone says:

> "A square is a rectangle, so let's inherit."

```ts
class Square extends Rectangle {
  setWidth(width: number): void {
    this.width = width;
    this.height = width;
  }

  setHeight(height: number): void {
    this.width = height;
    this.height = height;
  }
}
```

Mathematically:

```text
Square is a Rectangle
```

sounds reasonable.

But behavior causes a problem.

---

# 8. Where the Problem Appears

Imagine a function:

```ts
function resize(
  rectangle: Rectangle,
): void {
  rectangle.setWidth(10);
  rectangle.setHeight(20);
}
```

For a normal rectangle:

```text
width = 10
height = 20
area = 200
```

Now pass a square:

```ts
const square = new Square(5, 5);

resize(square);
```

After:

```ts
square.setWidth(10);
```

we have:

```text
width = 10
height = 10
```

Then:

```ts
square.setHeight(20);
```

becomes:

```text
width = 20
height = 20
```

The caller expected:

```text
width = 10
height = 20
```

but got:

```text
width = 20
height = 20
```

The subtype changed the behavior expected from `Rectangle`.

That's an LSP violation.

---

# 9. Why This Matters

The problem isn't:

```text
Square
```

itself.

The problem is:

```text
Square
```

cannot safely behave as the `Rectangle` abstraction expected by that function.

The type relationship:

```text
Square extends Rectangle
```

looks valid structurally.

But behaviorally:

```text
Square ≠ substitutable Rectangle
```

under that contract.

That's LSP.

---

# 10. LSP Is Stronger Than "It Compiles"

This is an important lesson for TypeScript.

You can have:

```ts
interface Repository {
  findById(id: string): Promise<User | null>;
}
```

and:

```ts
class BadRepository
  implements Repository {

  async findById(
    id: string,
  ): Promise<User | null> {
    throw new Error('Always fails');
  }
}
```

TypeScript:

```text
✓ Compiles
```

Architecture:

```text
✗ Violates behavioral expectations
```

Therefore:

> **The compiler verifies type compatibility; LSP is about behavioral substitutability.**

---

# 11. Repository Example From Your Architecture

Consider:

```ts
interface UrlRepository {
  findByShortCode(
    shortCode: string,
  ): Promise<ShortenedUrl | null>;
}
```

Suppose the contract implies:

```text
existing URL
    ↓
return URL

missing URL
    ↓
return null
```

Now:

```ts
class MongoUrlRepository
  implements UrlRepository {

  async findByShortCode(
    shortCode: string,
  ): Promise<ShortenedUrl | null> {
    // returns null if missing
  }
}
```

Good.

But imagine:

```ts
class CacheUrlRepository
  implements UrlRepository {

  async findByShortCode(
    shortCode: string,
  ): Promise<ShortenedUrl | null> {
    if (/* cache miss */) {
      throw new Error('Not found');
    }

    // ...
  }
}
```

If consumers expect:

```text
not found → null
```

but this implementation does:

```text
not found → exception
```

then it is not behaviorally substitutable.

Even though TypeScript accepts it.

---

# 12. Contracts Have More Than Signatures

A useful mental model is:

```text
Contract
├── method names
├── parameter types
├── return types
└── behavioral expectations
```

The first three are largely visible to TypeScript.

The fourth comes from your design.

For example:

```ts
interface UrlRepository {
  findByShortCode(
    code: string,
  ): Promise<ShortenedUrl | null>;
}
```

The return type tells us:

```text
ShortenedUrl
or
null
```

That itself communicates an important behavioral expectation:

```text
not found ≠ exceptional failure
```

The implementation should honor that meaning.

---

# 13. Preconditions

LSP becomes easier to understand using three concepts:

```text
Preconditions
Postconditions
Invariants
```

Start with **preconditions**.

A precondition is something that must be true before an operation is performed.

Suppose:

```ts
interface PaymentGateway {
  pay(amount: number): Promise<void>;
}
```

The consumer may reasonably expect:

```text
amount > 0
```

Now suppose the base abstraction accepts:

```text
amount = 100
```

but one implementation suddenly requires:

```text
amount >= 1000
```

That implementation has **strengthened the precondition**.

The caller can't safely substitute it anymore.

---

# 14. Example of Strengthening Preconditions

Suppose:

```ts
interface ImageProcessor {
  resize(
    width: number,
    height: number,
  ): Buffer;
}
```

Implementation A accepts:

```text
width = 100
height = 100
```

Implementation B says:

```text
minimum width = 500
minimum height = 500
```

If callers were allowed to request:

```text
100 × 100
```

then B cannot safely substitute A.

It demands more from the caller.

That's an LSP problem.

A useful rule:

> **A subtype should not require callers to satisfy stricter preconditions than the abstraction requires.**

---

# 15. Postconditions

A **postcondition** is what should be true after an operation succeeds.

Suppose:

```ts
interface UrlRepository {
  create(url: ShortenedUrl): Promise<void>;
}
```

The expected postcondition might be:

```text
After resolve:
URL has been persisted.
```

Now an implementation:

```ts
class FakeUrlRepository
  implements UrlRepository {

  async create(
    url: ShortenedUrl,
  ): Promise<void> {
    console.log('pretend saved');
  }
}
```

If the implementation is used in production but doesn't actually persist anything, it violates the expected behavior.

The method signature is correct.

The behavior isn't.

---

# 16. Subtypes Should Preserve Postconditions

A subtype shouldn't promise less than the abstraction promises.

Suppose:

```text
Repository.create()
```

means:

```text
"when this resolves, the entity has been persisted"
```

Then:

```text
Implementation A
```

and:

```text
Implementation B
```

must preserve that expectation.

Otherwise the caller can't safely substitute B for A.

---

# 17. Invariants

You already learned invariants earlier.

An invariant is a condition that should remain true for an object.

Suppose:

```ts
class BankAccount {
  private balance = 0;
}
```

with the invariant:

```text
balance >= 0
```

A subtype shouldn't break that invariant.

This is another reason inheritance can be dangerous.

A child class inherits assumptions from the parent.

If the child changes the meaning of the state, it may violate the parent's invariants.

---

# 18. LSP + Inheritance

LSP is especially associated with inheritance:

```text
Base
 ↑
 │
Derived
```

because a derived object is supposed to be usable where the base type is expected.

If:

```ts
const base: Base =
  new Derived();
```

causes existing code to behave incorrectly, the inheritance hierarchy is broken.

That's why LSP is a major reason to be careful with inheritance.

---

# 19. LSP + Interfaces

But LSP also applies to interfaces.

Consider:

```text
Repository
   ▲
   │
   ├── MongoRepository
   ├── PostgresRepository
   └── InMemoryRepository
```

All implementations must honor the same behavioral expectations.

So LSP is not merely:

```text
inheritance principle
```

It's really:

```text
substitutability principle
```

It applies whenever one thing is used through an abstraction.

---

# 20. A Very Practical Backend Example

Suppose:

```ts
interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
```

You have:

```text
RedisCache
MemoryCache
```

The use case:

```ts
class UrlLookupService {
  constructor(
    private readonly cache: Cache,
  ) {}

  async get(
    key: string,
  ): Promise<string | null> {
    return this.cache.get(key);
  }
}
```

For substitution to work, both implementations should agree on things like:

```text
missing key → null
set → eventually retrievable
get doesn't unexpectedly delete data
```

If `MemoryCache` returns:

```text
undefined
```

instead of:

```text
null
```

the implementation violates the declared contract.

TypeScript should catch that particular return-type mismatch.

But other behavioral differences may not be caught.

---

# 21. LSP and Error Behavior

Error behavior is especially important in backend systems.

Suppose:

```ts
interface UserRepository {
  findById(
    id: string,
  ): Promise<User | null>;
}
```

The application expects:

```text
user missing
     ↓
null
```

Now another implementation says:

```text
user missing
     ↓
throw NotFoundError
```

Technically the method signature can still be:

```ts
Promise<User | null>
```

because exceptions aren't part of the TypeScript return type.

But behavior differs.

If the application relies on `null` for a missing user, the new implementation can break the consumer.

This is a subtle but very real LSP concern.

---

# 22. LSP Helps You Design Better Ports

Suppose you have:

```ts
interface UserClient {
  isUserActive(
    userId: string,
  ): Promise<boolean>;
}
```

You have:

```text
LocalUserClient
HttpUserClient
```

For substitution to work, both should agree on:

```text
same meaning of true
same meaning of false
same handling of nonexistent users
same relevant error semantics
same input expectations
```

For example, if:

```text
LocalUserClient
```

returns:

```text
false
```

when the user doesn't exist, but:

```text
HttpUserClient
```

throws an exception for the same condition, consumers may behave differently after extraction.

This is exactly the kind of subtle problem that LSP helps you identify **before** extracting a module into another service.

---

# 23. This Is Extremely Relevant to Your Service Extraction

Remember your original architecture:

### Phase 1

```text
Billing
   ↓
UserClient
   ↓
LocalUserClient
```

### Phase 2

```text
Billing
   ↓
UserClient
   ↓
HttpUserClient
   ↓
User Service
```

It's not enough for both to implement:

```ts
interface UserClient {
  isUserActive(userId: string): Promise<boolean>;
}
```

They must have compatible behavior.

Otherwise:

```text
Phase 1 works
      ↓
extract service
      ↓
Phase 2 breaks
```

This is a practical architectural application of LSP.

---

# 24. A Good Contract Is Behavioral

For a port like:

```ts
interface UserClient {
  isUserActive(
    userId: string,
  ): Promise<boolean>;
}
```

you should document the important semantics.

For example:

```text
isUserActive(userId)

Returns:
true  → user exists and is active
false → user exists and is inactive

Throws:
UserNotFoundError → user doesn't exist
```

Now both:

```text
LocalUserClient
HttpUserClient
```

have a behavioral contract to honor.

This makes substitution much safer.

---

# 25. LSP and the Meaning of "Subtype"

In traditional OOP, subtype often means:

```text
class Dog extends Animal
```

But in TypeScript, structural typing makes this broader.

A type can satisfy another type because it has the required structure.

Therefore, for your architecture, think of subtype/substitute more broadly as:

> **Anything that is being used through a particular abstraction.**

Examples:

```text
MongoUrlRepository
        ↓
UrlRepository

InMemoryUrlRepository
        ↓
UrlRepository

LocalUserClient
        ↓
UserClient

HttpUserClient
        ↓
UserClient
```

All of these need behavioral substitutability.

---

# 26. The Three Questions for LSP

Whenever you create an implementation, ask:

### 1. Does it accept everything the abstraction promises to accept?

Don't strengthen preconditions.

```text
Contract accepts X
Implementation requires X + Y
       ↓
problem
```

### 2. Does it provide everything the abstraction promises?

Don't weaken postconditions.

```text
Contract promises X
Implementation only provides part of X
       ↓
problem
```

### 3. Does it preserve the abstraction's invariants and semantics?

```text
Contract meaning
      ↓
must remain consistent
```

This is the practical LSP checklist.

---

# 27. LSP vs OCP

These two principles are closely connected.

### OCP

Asks:

> **Can I add another implementation without modifying stable consumers?**

### LSP

Asks:

> **Can the new implementation actually substitute for the existing abstraction without breaking those consumers?**

So:

```text
OCP
 ↓
Add implementation

LSP
 ↓
Make sure implementation
is actually substitutable
```

You need both.

Otherwise you can technically achieve OCP while adding implementations that break the application.

---

# 28. LSP vs Polymorphism

Polymorphism says:

```text
Many implementations
       ↓
same abstraction
```

LSP says:

```text
Those implementations
must actually be valid substitutes.
```

Therefore:

```text
Polymorphism
     ↓
mechanism

LSP
     ↓
behavioral correctness principle
```

Again, these aren't isolated concepts.

---

# 29. The URL-Service Picture

Your future URL service could contain:

```text
                    CreateShortenedUrl
                           │
                           ▼
                     UrlRepository
                           ▲
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
        MongoUrlRepository    InMemoryUrlRepository
```

Polymorphism says both can be used through:

```text
UrlRepository
```

OCP says:

```text
Add another repository
without modifying the use case
```

LSP says:

```text
The new repository must actually
honor UrlRepository's behavioral contract
```

That's the full relationship.

---

# 30. The Deep Mental Model

Don't memorize:

> "Subtypes must be replaceable."

Instead think:

```text
Consumer
   │
   ▼
Abstraction
   ▲
   │
Implementation
```

Now ask:

> **If I secretly replace this implementation with another valid implementation, should the consumer still behave correctly?**

If yes:

```text
✓ LSP
```

If the consumer suddenly needs special handling:

```ts
if (implementation instanceof SpecialImplementation) {
  // special behavior
}
```

that's a strong warning sign that your implementations may not be genuinely substitutable.

---

# 31. Practice Exercise

Design a **NotificationSender** abstraction:

```ts
interface NotificationSender {
  send(
    recipient: string,
    message: string,
  ): Promise<void>;
}
```

Create:

```text
EmailNotificationSender
SmsNotificationSender
PushNotificationSender
```

Now define the behavioral expectations yourself.

For example:

```text
Input:
recipient + message

Success:
message is delivered

Failure:
appropriate error is returned/thrown
```

Then intentionally create:

```text
BrokenNotificationSender
```

which technically implements the interface but violates one behavioral expectation.

Your job is to identify **exactly which part of the contract it violates**.

Don't just say:

> "It violates LSP."

Explain:

```text
The abstraction promises ______.
The implementation does ______.
Therefore a consumer expecting ______
would break.
```

That reasoning is the actual skill we're training.

---

# SOLID Checkpoint

```text
✓ S — Single Responsibility Principle
    ✓ Responsibility
    ✓ Reasons to change
    ✓ Cohesion
    ✓ Responsibility boundaries

✓ O — Open/Closed Principle
    ✓ Open for extension
    ✓ Closed for modification
    ✓ Stable abstractions
    ✓ Extension through implementations

✓ L — Liskov Substitution Principle
    ✓ Substitutability
    ✓ Behavioral contracts
    ✓ Preconditions
    ✓ Postconditions
    ✓ Invariants
    ✓ Interface compatibility vs behavioral compatibility
    ✓ Inheritance and LSP
    ✓ Interface-based LSP
    ✓ LSP + polymorphism
    ✓ LSP + OCP
```

## Next: Interface Segregation Principle

Next we'll study **I — Interface Segregation Principle (ISP)**.

This will answer a problem that appeared naturally in today's lesson:

```text
interface FileStorage {
    read()
    write()
    delete()
    stream()
    ...
}
```

What happens when an implementation only supports some of those operations?

We'll learn why **small, capability-focused interfaces** are often better than giant interfaces, and how this directly improves the `Repository`, `UserClient`, `Cache`, and other ports in your architecture.