# TypeScript OOP — Lesson 18: SOLID — Interface Segregation Principle

We now move to **I — Interface Segregation Principle (ISP)**.

The formal definition is:

> **Clients should not be forced to depend on methods they do not use.**

This is one of the most practical SOLID principles for the architecture you're building because your system is heavily based on **interfaces/ports**.

The central idea is:

> **An abstraction should expose the capabilities a client actually needs, rather than forcing the client to depend on a large collection of unrelated capabilities.**

---

# 1. Start With a Real Problem

Imagine we create this interface:

```ts
interface UserService {
  createUser(): Promise<void>;
  getUser(): Promise<void>;
  updateUser(): Promise<void>;
  deleteUser(): Promise<void>;
  activateUser(): Promise<void>;
  deactivateUser(): Promise<void>;
  sendVerificationEmail(): Promise<void>;
  resetPassword(): Promise<void>;
}
```

At first this might seem convenient:

```text
UserService
├── create
├── get
├── update
├── delete
├── activate
├── deactivate
├── verification
└── password reset
```

But imagine a component only needs:

```text
getUser()
```

Why should that component depend on:

```text
createUser()
updateUser()
deleteUser()
resetPassword()
...
```

It shouldn't.

That is the problem ISP addresses.

---

# 2. The Important Word: Client

ISP talks about **clients**.

A client is simply code that consumes an abstraction.

For example:

```text
OrderService
    │
    ▼
UserService
```

Here:

```text
OrderService
```

is the client.

If `OrderService` only needs:

```text
getUser()
```

then giving it an interface containing:

```text
create
update
delete
resetPassword
...
```

creates unnecessary coupling.

---

# 3. The Better Design

Instead of:

```ts
interface UserService {
  createUser(): Promise<void>;
  getUser(): Promise<void>;
  updateUser(): Promise<void>;
  deleteUser(): Promise<void>;
}
```

we can define:

```ts
interface UserReader {
  getUser(): Promise<void>;
}
```

and:

```ts
interface UserWriter {
  createUser(): Promise<void>;
  updateUser(): Promise<void>;
  deleteUser(): Promise<void>;
}
```

Now clients depend only on what they need.

```text
UserReader
    ↑
    │
OrderService

UserWriter
    ↑
    │
AdminService
```

This is interface segregation.

---

# 4. Think in Terms of Capabilities

A very useful way to understand ISP is:

> **An interface represents a capability.**

For example:

```text
UserReader
    ↓
"can read users"

UserWriter
    ↓
"can modify users"

FileReader
    ↓
"can read files"

FileWriter
    ↓
"can write files"

CacheReader
    ↓
"can read cache"

CacheWriter
    ↓
"can write cache"
```

Instead of creating one giant:

```text
EverythingService
```

you expose focused capabilities.

---

# 5. The Classic Bad Example

Consider:

```ts
interface Machine {
  print(): void;
  scan(): void;
  fax(): void;
}
```

A modern simple printer only supports printing:

```ts
class SimplePrinter implements Machine {
  print(): void {
    console.log('Printing');
  }

  scan(): void {
    throw new Error('Not supported');
  }

  fax(): void {
    throw new Error('Not supported');
  }
}
```

TypeScript allows this because the methods exist.

But conceptually:

```text
SimplePrinter
      │
      ├── print ✓
      ├── scan  ✗
      └── fax   ✗
```

The interface forced the class to implement capabilities it doesn't possess.

This is a violation of ISP.

---

# 6. Split the Interface

Instead:

```ts
interface Printer {
  print(): void;
}

interface Scanner {
  scan(): void;
}

interface Fax {
  fax(): void;
}
```

Now:

```ts
class SimplePrinter
  implements Printer {

  print(): void {
    console.log('Printing');
  }
}
```

And a multifunction machine:

```ts
class MultiFunctionMachine
  implements Printer, Scanner, Fax {

  print(): void {
    console.log('Printing');
  }

  scan(): void {
    console.log('Scanning');
  }

  fax(): void {
    console.log('Faxing');
  }
}
```

Now each class implements only the capabilities it actually provides.

---

# 7. Why This Is Better

Before:

```text
Machine
├── print
├── scan
└── fax
```

Every implementation must know the whole thing.

After:

```text
Printer
Scanner
Fax
```

Each capability is independent.

This gives us:

```text
smaller contracts
+
lower coupling
+
more precise dependencies
```

---

# 8. ISP in Your Backend Architecture

This becomes much more interesting in your URL service.

Suppose you create:

```ts
interface UrlRepository {
  create(url: ShortenedUrl): Promise<void>;
  findById(id: string): Promise<ShortenedUrl | null>;
  findByShortCode(code: string): Promise<ShortenedUrl | null>;
  update(url: ShortenedUrl): Promise<void>;
  delete(id: string): Promise<void>;
}
```

This is not automatically wrong.

But now imagine:

```text
CreateShortenedUrl
```

only needs:

```text
create()
```

Why should it depend on:

```text
findById()
findByShortCode()
update()
delete()
```

?

It may not need them.

---

# 9. Split Repository Capabilities

You could define:

```ts
interface UrlCreator {
  create(
    url: ShortenedUrl,
  ): Promise<void>;
}
```

Then:

```ts
interface UrlFinder {
  findById(
    id: string,
  ): Promise<ShortenedUrl | null>;

  findByShortCode(
    code: string,
  ): Promise<ShortenedUrl | null>;
}
```

And:

```ts
interface UrlUpdater {
  update(
    url: ShortenedUrl,
  ): Promise<void>;
}
```

Now different use cases can depend on different capabilities.

```text
CreateShortenedUrl
       │
       ▼
   UrlCreator

GetShortenedUrl
       │
       ▼
    UrlFinder

UpdateShortenedUrl
       │
       ▼
   UrlUpdater
```

This is a very clean application of ISP.

---

# 10. But Don't Split Everything Blindly

This is extremely important.

You might now think:

> "Every repository should have one method per interface."

That can become excessive.

For example:

```text
UrlCreator
UrlFinderById
UrlFinderByShortCode
UrlUpdater
UrlDeleter
```

may be unnecessarily fragmented.

Instead, look for **meaningful capability boundaries**.

For example:

```ts
interface UrlReader {
  findById(
    id: string,
  ): Promise<ShortenedUrl | null>;

  findByShortCode(
    code: string,
  ): Promise<ShortenedUrl | null>;
}
```

is perfectly reasonable because both methods represent:

```text
read URL data
```

So ISP doesn't mean:

> **Make every interface as small as physically possible.**

It means:

> **Don't make clients depend on capabilities they don't need.**

That's a much better rule.

---

# 11. ISP and Dependency Injection

Remember our previous lesson:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
  ) {}
}
```

If `UrlRepository` is huge:

```text
create
find
update
delete
archive
restore
search
count
...
```

then the use case depends on the entire interface.

Instead:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlCreator,
  ) {}
}
```

Now the dependency communicates exactly what the use case needs.

```text
CreateShortenedUrl
       │
       ▼
   UrlCreator
       │
       └── create()
```

This is much more precise.

---

# 12. ISP + DI + Abstraction

Now connect the concepts.

```text
Interface
    ↓
defines capability

ISP
    ↓
keep capability focused

DI
    ↓
inject capability

Polymorphism
    ↓
implementation can vary
```

For example:

```ts
interface UrlCreator {
  create(url: ShortenedUrl): Promise<void>;
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

And:

```ts
const creator =
  new MongoUrlRepository();

const useCase =
  new CreateShortenedUrl(creator);
```

The use case doesn't care that the concrete object also happens to implement other repository operations.

Its **declared dependency** is only the capability it needs.

---

# 13. An Important TypeScript Feature

TypeScript's structural typing makes this particularly elegant.

Suppose:

```ts
interface UrlCreator {
  create(url: ShortenedUrl): Promise<void>;
}
```

And:

```ts
class MongoUrlRepository {
  async create(
    url: ShortenedUrl,
  ): Promise<void> {
    // ...
  }

  async findById(
    id: string,
  ): Promise<ShortenedUrl | null> {
    // ...
  }

  async delete(
    id: string,
  ): Promise<void> {
    // ...
  }
}
```

We can do:

```ts
const creator: UrlCreator =
  new MongoUrlRepository();
```

Even though `MongoUrlRepository` has more methods.

Why?

Because TypeScript uses structural typing.

It asks:

> Does this object provide everything required by `UrlCreator`?

Yes.

Therefore:

```text
MongoUrlRepository
      │
      └── structurally satisfies UrlCreator
```

The consumer sees only:

```text
create()
```

This is excellent for capability-based design.

---

# 14. ISP and Encapsulation

There's another subtle benefit.

Suppose:

```ts
interface UserReader {
  findById(id: string): Promise<User | null>;
}
```

A client receiving:

```ts
private readonly users: UserReader
```

cannot rely on:

```text
delete
update
changePassword
activate
```

because they aren't part of the abstraction.

Therefore the interface itself becomes a form of **architectural encapsulation**.

It says:

> "This client is only allowed to know about this capability."

That's powerful.

---

# 15. ISP Reduces Coupling

Consider the large interface:

```text
UserService
├── create
├── read
├── update
├── delete
├── activate
├── deactivate
├── resetPassword
└── verifyEmail
```

If 10 clients depend on it:

```text
         UserService
       / / / | \ \ \
      / / /  |  \ \ \
   Client Client Client ...
```

Any change to the interface potentially affects many consumers.

With focused interfaces:

```text
UserReader
    ↑
 Reader clients

UserActivator
    ↑
 Activation client

PasswordResetter
    ↑
 Password-reset client
```

Dependencies become more precise.

---

# 16. ISP and Microservice Boundaries

This is particularly relevant to your architecture.

Suppose:

```text
Billing
```

only needs:

```ts
interface UserClient {
  isUserActive(
    userId: string,
  ): Promise<boolean>;
}
```

That's already a very focused interface.

Billing does **not** need:

```text
createUser()
deleteUser()
changePassword()
updateProfile()
verifyEmail()
```

Therefore:

```text
Billing
   │
   ▼
UserClient
   │
   └── isUserActive()
```

is much better than:

```text
Billing
   │
   ▼
UserService
   ├── create
   ├── delete
   ├── update
   ├── reset
   ├── activate
   └── ...
```

This is exactly how ISP helps maintain **module boundaries**.

---

# 17. ISP + Your Local/HTTP Client Pattern

Remember:

```text
Phase 1

Billing
  ↓
UserClient
  ↓
LocalUserClient
```

Later:

```text
Phase 2

Billing
  ↓
UserClient
  ↓
HttpUserClient
  ↓
User Service
```

If `UserClient` contains only:

```ts
interface UserClient {
  isUserActive(
    userId: string,
  ): Promise<boolean>;
}
```

then Billing depends on exactly the capability it needs.

This is excellent interface segregation.

And because the interface is small, the HTTP implementation is easier to maintain.

---

# 18. ISP Helps LSP

Remember the LSP problem from the previous lesson.

We had:

```ts
interface FileStorage {
  read(): void;
  write(): void;
}
```

and:

```text
ReadOnlyStorage
```

couldn't properly support `write()`.

We could fix this with ISP:

```ts
interface FileReader {
  read(): void;
}

interface FileWriter {
  write(): void;
}
```

Now:

```text
ReadOnlyStorage
      │
      └── FileReader

WritableStorage
      │
      ├── FileReader
      └── FileWriter
```

This makes LSP easier to satisfy because implementations aren't forced to claim capabilities they don't support.

So:

```text
ISP
 ↓
smaller contracts
 ↓
more accurate abstractions
 ↓
easier substitutability
 ↓
better LSP
```

This is an important relationship between the SOLID principles.

---

# 19. ISP Helps OCP Too

Suppose:

```ts
interface NotificationSender {
  send(): Promise<void>;
}
```

This is a focused abstraction.

We can add:

```text
EmailSender
SmsSender
PushSender
WhatsAppSender
```

without changing consumers.

So:

```text
ISP
 ↓
focused abstraction
 ↓
clean extension point
 ↓
OCP
```

Again, the principles reinforce one another.

---

# 20. ISP and SRP

There's also a connection to SRP.

A giant interface:

```text
UserService
├── authentication
├── profile
├── billing
├── notifications
├── password reset
└── administration
```

may indicate multiple responsibilities have been combined.

Splitting the interface can expose those boundaries:

```text
AuthenticationOperations
ProfileOperations
BillingOperations
NotificationOperations
AdministrationOperations
```

This doesn't automatically mean the implementation must be split into five classes.

But the interface can expose smaller **client-specific views**.

Therefore:

```text
SRP
 ↓
separate responsibilities

ISP
 ↓
don't force clients to depend on unrelated responsibilities
```

---

# 21. A Very Important Distinction: Interface Size vs Client Needs

Suppose we have:

```ts
interface UserRepository {
  create(): Promise<void>;
  findById(): Promise<void>;
  update(): Promise<void>;
  delete(): Promise<void>;
}
```

Is this automatically bad?

**No.**

If one application service genuinely needs all four:

```text
create
find
update
delete
```

then depending on the entire interface is reasonable.

ISP violation occurs when a **client is forced to depend on methods it doesn't need**.

So the question isn't:

> "Is this interface large?"

The better question is:

> **"Does this client depend on capabilities that are irrelevant to its responsibility?"**

That's the precise interpretation.

---

# 22. Interface Segregation Is Client-Oriented

This is probably the most important sentence of today's lesson:

> **Interfaces should be designed around the needs of their clients, not merely around the implementation.**

Bad thinking:

```text
What methods does MongoRepository have?
        ↓
Put all of them into one interface.
```

Better thinking:

```text
What does CreateShortenedUrl need?
        ↓
Create an abstraction for those capabilities.
```

Then:

```text
What does RedirectUrl need?
        ↓
Create/use the abstraction for those capabilities.
```

This results in **consumer-driven interfaces**.

---

# 23. Example From a Real Application

Imagine your URL service has these use cases:

```text
CreateShortenedUrl
RedirectShortenedUrl
DeleteShortenedUrl
UpdateShortenedUrl
```

Don't automatically start with:

```ts
interface UrlRepository {
  create();
  findByCode();
  findById();
  update();
  delete();
}
```

First inspect the use cases.

### Create

Needs:

```text
create()
```

### Redirect

Needs:

```text
findByShortCode()
```

### Delete

Needs:

```text
delete()
```

### Update

Needs:

```text
findById()
update()
```

Now you can determine meaningful capability boundaries.

Potentially:

```text
UrlCreator
UrlReader
UrlUpdater
UrlDeleter
```

Or perhaps:

```text
UrlReader
UrlWriter
```

depending on the actual domain.

The architecture should emerge from **usage**, not from arbitrary rules.

---

# 24. Don't Turn ISP Into Interface Explosion

This is the opposite failure.

You might end up with:

```text
UrlCreator
UrlReaderById
UrlReaderByCode
UrlUpdater
UrlDeleter
UrlCounter
UrlArchiver
UrlRestorer
UrlSearcher
UrlExporter
...
```

Now the system becomes difficult to understand.

That's **over-segregation**.

The goal is not:

```text
smallest possible interfaces
```

The goal is:

```text
meaningful client-specific contracts
```

Think **cohesion**, not size.

---

# 25. Practical Decision Process

When designing an interface:

### Step 1 — Identify the client

```text
Who consumes this abstraction?
```

### Step 2 — Identify what the client actually needs

For example:

```text
CreateShortenedUrl
    ↓
create()
```

### Step 3 — Remove unrelated capabilities

Don't expose:

```text
delete
update
search
```

if the client doesn't need them.

### Step 4 — Check whether the remaining methods form one capability

For example:

```text
findById()
findByShortCode()
```

both represent URL reading.

Good.

### Step 5 — Check substitutability

Can implementations actually honor the resulting contract?

If yes, good.

---

# 26. The Full SOLID Connection So Far

You now have four principles.

```text
S — SRP
│
├── separate responsibilities
│
O — OCP
│
├── extend without unnecessary modification
│
L — LSP
│
├── implementations must be substitutable
│
I — ISP
│
└── clients shouldn't depend on irrelevant capabilities
```

And the OOP mechanisms underneath:

```text
Interfaces
    ↓
Abstraction

Polymorphism
    ↓
Substitution

Composition
    ↓
Object collaboration

Dependency Injection
    ↓
External construction

SOLID
    ↓
Rules for designing those collaborations
```

Now the architecture should start becoming much less mysterious.

---

# 27. Your URL Service Architecture

Putting today's lesson into your architecture:

```text
                  CreateShortenedUrl
                         │
                         ▼
                    UrlCreator
                         ▲
                         │
                 MongoUrlRepository
```

Another use case:

```text
                 RedirectShortenedUrl
                         │
                         ▼
                     UrlReader
                         ▲
                         │
                 MongoUrlRepository
```

The same concrete repository can satisfy both:

```text
MongoUrlRepository
      │
      ├── UrlCreator
      └── UrlReader
```

This is a very nice TypeScript pattern because the implementation can be broad while each consumer receives a **narrow view** of it.

---

# 28. This Is Sometimes Called "Role Interfaces"

You may encounter the term:

> **Role Interface**

It means an interface describes the role/capability an object plays for a particular client.

For example:

```ts
interface UrlReader {
  findByShortCode(
    code: string,
  ): Promise<ShortenedUrl | null>;
}
```

The concrete object might be:

```text
MongoUrlRepository
```

but for a redirect use case, its role is:

```text
UrlReader
```

So:

```text
MongoUrlRepository
       │
       ├── role → UrlReader
       └── role → UrlCreator
```

This is a powerful way to think about interfaces.

---

# 29. The Mental Model to Memorize

Don't memorize only:

> "Clients should not be forced to depend on methods they don't use."

Instead remember:

```text
Implementation
      │
      │ can provide many capabilities
      ▼
 ┌─────────────────────────┐
 │                         │
 ▼                         ▼
UrlCreator              UrlReader
 │                         │
 ▼                         ▼
CreateUseCase          RedirectUseCase
```

The implementation can be large.

The **client-facing abstraction stays narrow**.

That's the heart of ISP.

---

# 30. Practice Exercise

Take this intentionally oversized interface:

```ts
interface UserRepository {
  create(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  activate(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}
```

Now imagine these clients:

```text
CreateUser
GetUser
DeleteUser
ActivateUser
```

Your task is **not** to immediately create seven interfaces.

Instead, determine what each client actually needs.

For example:

```text
CreateUser
    ↓
?

GetUser
    ↓
?

DeleteUser
    ↓
?

ActivateUser
    ↓
?
```

Then group related capabilities into meaningful interfaces.

The important part is explaining **why a client should not depend on the other methods**.

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
    ✓ Interface vs behavioral compatibility

✓ I — Interface Segregation Principle
    ✓ Client-specific interfaces
    ✓ Capability-oriented interfaces
    ✓ Role interfaces
    ✓ Narrow contracts
    ✓ Avoiding fat interfaces
    ✓ ISP + LSP
    ✓ ISP + OCP
    ✓ ISP + SRP
    ✓ ISP + Dependency Injection
```

## Next: Dependency Inversion Principle

The final SOLID principle is **D — Dependency Inversion Principle (DIP)**.

This is the one that will tie almost everything together:

```text
High-level business logic
          │
          ▼
       abstraction
          ▲
          │
Low-level infrastructure
```

We'll start from a use case directly importing `MongoUrlRepository`, then progressively invert that dependency until the direction becomes:

```text
core
 ↓
port/interface
 ↑
adapter
```

That will directly explain **why your `ports.ts`, `adapters/`, `wire.ts`, and Clean/Hexagonal architecture have the shape they do**.