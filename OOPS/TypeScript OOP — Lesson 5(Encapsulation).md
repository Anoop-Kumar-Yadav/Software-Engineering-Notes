# TypeScript OOP — Lesson 5: Encapsulation

We now have enough mechanics to understand the actual OOP principle behind them.

So far:

```text
Lesson 1 → Classes
Lesson 2 → Constructors
Lesson 3 → Instance fields & methods
Lesson 4 → Access modifiers
```

Now we study **encapsulation**.

This is not another TypeScript keyword. It is an **OOP design principle** that uses mechanisms such as classes, methods, `private`, `public`, and controlled state changes.

---

# 1. What Is Encapsulation?

A professional definition:

> **Encapsulation is the practice of bundling an object's state and behavior together while controlling how its internal state can be accessed or modified.**

There are two ideas inside that definition:

```text
Encapsulation
     │
     ├── Bundle related state + behavior
     │
     └── Control access to internal state
```

For example:

```text
BankAccount
├── State
│   └── balance
│
└── Behavior
    ├── deposit()
    ├── withdraw()
    └── getBalance()
```

The account owns its balance **and** the operations that are allowed to manipulate it.

---

# 2. The Problem Encapsulation Solves

Consider this class:

```ts
class BankAccount {
  public balance: number;

  constructor(balance: number) {
    this.balance = balance;
  }
}
```

Now external code can do:

```ts
const account = new BankAccount(5000);

account.balance = -100000;
```

The object cannot prevent this.

We have exposed its internal state directly.

```text
External Code
     │
     ├── balance = 5000
     ├── balance = -100
     ├── balance = 999999
     └── balance = anything
           │
           ▼
      BankAccount
```

This is **poor encapsulation**.

---

# 3. Hide the Internal State

Now change:

```ts
public balance: number;
```

to:

```ts
private balance: number;
```

Then:

```ts
class BankAccount {
  private balance: number;

  constructor(balance: number) {
    this.balance = balance;
  }
}
```

External code cannot do:

```ts
account.balance = -100;
```

Instead, we expose operations:

```ts
class BankAccount {
  private balance: number;

  constructor(balance: number) {
    this.balance = balance;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }

  withdraw(amount: number): void {
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}
```

Now:

```text
                 BankAccount
              ┌───────────────┐
              │ private       │
              │ balance       │
              │               │
              │ deposit()     │
              │ withdraw()    │
              │ getBalance()  │
              └───────▲───────┘
                      │
                 controlled
                   access
                      │
                 External Code
```

The external code doesn't manipulate `balance` directly.

It asks the object to perform an operation.

---

# 4. Encapsulation Is More Than `private`

This is important.

A beginner may think:

> Encapsulation = making variables private.

That's incomplete.

`private` is a **mechanism**.

Encapsulation is the **design principle**.

For example, this isn't particularly useful:

```ts
class User {
  private name: string;

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }
}
```

We've technically hidden the field, but we haven't necessarily created meaningful encapsulation.

Why?

Because we've simply created:

```text
private field
    ↓
getter
    ↓
setter
```

with no meaningful control over state.

Good encapsulation asks:

> **What operations should this object allow?**

---

# 5. Behavior-Oriented Encapsulation

Consider an order.

Bad:

```ts
class Order {
  public status: string;
}
```

External code:

```ts
order.status = 'SHIPPED';
```

Then:

```ts
order.status = 'DELIVERED';
```

Then:

```ts
order.status = 'CANCELLED';
```

Nothing controls the state transitions.

Instead:

```ts
class Order {
  private status: string;

  constructor() {
    this.status = 'PENDING';
  }

  ship(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending orders can be shipped');
    }

    this.status = 'SHIPPED';
  }

  cancel(): void {
    if (this.status === 'DELIVERED') {
      throw new Error('Delivered order cannot be cancelled');
    }

    this.status = 'CANCELLED';
  }

  getStatus(): string {
    return this.status;
  }
}
```

Now the object owns its state transitions.

```text
Order
│
├── private status
│
├── ship()
│     └── validates transition
│
└── cancel()
      └── validates transition
```

This is much stronger encapsulation.

---

# 6. Encapsulation Protects Invariants

This is a very important term for backend development.

An **invariant** is a condition that should always remain true for a valid object.

For a bank account:

```text
balance >= 0
```

might be an invariant.

For an order:

```text
DELIVERED → cannot become CANCELLED
```

might be an invariant.

For a URL:

```text
shortCode must exist
```

might be an invariant.

If external code can freely modify state, invariants are difficult to protect.

Encapsulation creates a boundary:

```text
Outside
   │
   │ valid operation
   ▼
Object
   │
   ├── validate
   ├── enforce invariant
   └── change state
```

This is one reason encapsulation is so valuable in domain-driven backend systems.

---

# 7. Real Example: Shopping Cart

Consider:

```ts
class ShoppingCart {
  private items: string[] = [];

  addItem(item: string): void {
    this.items.push(item);
  }

  removeItem(item: string): void {
    this.items = this.items.filter(
      currentItem => currentItem !== item,
    );
  }

  getItemCount(): number {
    return this.items.length;
  }
}
```

Outside code can do:

```ts
cart.addItem('Keyboard');
```

but not:

```ts
cart.items = [];
```

The cart decides how its collection is manipulated.

---

# 8. A More Important Problem: Returning Internal State

Suppose we write:

```ts
class ShoppingCart {
  private items: string[] = [];

  getItems(): string[] {
    return this.items;
  }
}
```

This looks encapsulated because `items` is private.

But consider:

```ts
const items = cart.getItems();

items.length = 0;
```

You've potentially modified the cart's internal array through the returned reference.

This is a subtle but important point:

> **Encapsulation is about protecting the object's state, not merely hiding the variable name.**

One solution is to return a copy:

```ts
getItems(): string[] {
  return [...this.items];
}
```

Now:

```text
Internal items
      │
      │ copy
      ▼
External caller
```

The caller doesn't receive the original array reference.

---

# 9. Encapsulation and Readonly

Suppose:

```ts
class User {
  constructor(
    public readonly id: string,
    public name: string,
  ) {}
}
```

`readonly` prevents reassignment of `id`.

But remember:

> `readonly` is not the same thing as encapsulation.

It protects **reassignment through that property**, but doesn't automatically make an entire object immutable.

For example:

```ts
class User {
  constructor(
    public readonly roles: string[],
  ) {}
}
```

You can't do:

```ts
user.roles = [];
```

but the array itself may still be mutated:

```ts
user.roles.push('admin');
```

So:

```text
readonly
   ↓
protects property reassignment

encapsulation
   ↓
controls how object state is accessed and changed
```

We'll study `readonly` and immutability separately.

---

# 10. Encapsulation in a Domain Entity

Now let's return to our URL shortener.

Suppose:

```text
ShortenedUrl
├── originalUrl
├── shortCode
├── createdAt
└── expiresAt
```

Imagine expiration is part of the domain.

We don't want arbitrary code doing:

```ts
url.expiresAt = new Date();
```

Instead, the entity could expose behavior:

```ts
class ShortenedUrl {
  private expiresAt: Date | null;

  constructor(
    private readonly id: string,
    private readonly originalUrl: string,
    private readonly shortCode: string,
    private readonly createdAt: Date,
    expiresAt: Date | null,
  ) {
    this.expiresAt = expiresAt;
  }

  isExpired(now: Date): boolean {
    if (this.expiresAt === null) {
      return false;
    }

    return now >= this.expiresAt;
  }

  expireAt(date: Date): void {
    if (date <= this.createdAt) {
      throw new Error(
        'Expiration must be after creation',
      );
    }

    this.expiresAt = date;
  }
}
```

Now:

```text
ShortenedUrl
│
├── private state
│
├── isExpired()
│
└── expireAt()
        │
        └── validates domain rule
```

This is where OOP becomes directly useful to the architecture we're building.

---

# 11. Encapsulation Creates a Boundary

Think of a well-designed object as a small boundary:

```text
             OBJECT
┌─────────────────────────────┐
│                             │
│       INTERNAL STATE        │
│                             │
│   private fields            │
│                             │
│          ▲                  │
│          │                  │
│     controlled             │
│      operations             │
│          │                  │
└──────────┼──────────────────┘
           │
       public API
           │
           ▼
      Other Objects
```

The public methods form the object's **public API**.

The private fields and implementation details remain hidden.

This is exactly the same idea we later apply at a larger scale with architecture.

---

# 12. Object-Level Encapsulation vs Architecture-Level Encapsulation

This is an important connection for you.

At the OOP level:

```text
Object
  ↓
private state
  ↓
public behavior
```

At the architecture level:

```text
Application
  ↓
ports
  ↓
external implementations hidden
```

For example:

```text
Use Case
   │
   │ knows
   ▼
UrlRepository interface
   │
   │ hides
   ▼
MongoUrlRepository
   │
   │ hides
   ▼
MongoDB details
```

So there is a similar principle at two scales:

```text
OOP
──────────────────────
Hide implementation
Expose controlled behavior


Architecture
──────────────────────
Hide implementation
Expose controlled contracts
```

This is one reason OOP concepts are so useful for understanding Clean/Hexagonal Architecture.

---

# 13. Encapsulation Does Not Mean "Hide Everything"

You shouldn't make everything private just because private sounds safer.

Suppose:

```ts
class User {
  public readonly id: string;
  public readonly email: string;

  constructor(
    id: string,
    email: string,
  ) {
    this.id = id;
    this.email = email;
  }
}
```

It may be completely reasonable for callers to read:

```ts
user.id
user.email
```

But changing the ID may not be allowed.

So:

```text
id
 ↓
public readonly

email
 ↓
public readonly

passwordHash
 ↓
private
```

Access control should represent **actual design intent**.

---

# 14. Encapsulation and Security Are Not the Same

Another important distinction.

`private` in TypeScript is primarily a **code-level access restriction**.

It isn't a security boundary like:

```text
authentication
authorization
encryption
process isolation
```

For example:

```ts
class User {
  private passwordHash: string;
}
```

doesn't mean the password hash is cryptographically protected.

It means:

> TypeScript code outside the class shouldn't directly access this member.

So don't confuse:

```text
OOP encapsulation
```

with:

```text
security
```

They solve different problems.

---

# 15. Encapsulation in Backend Services

Consider our use case:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
    private readonly idGenerator: IdGenerator,
    private readonly shortCodeGenerator: ShortCodeGenerator,
  ) {}

  async execute() {
    // ...
  }
}
```

Why are these dependencies private?

Because callers should use:

```ts
createShortenedUrl.execute(...)
```

rather than:

```ts
createShortenedUrl.repository.create(...)
```

The internal dependency graph is hidden.

So:

```text
Controller
   │
   │ public API
   ▼
CreateShortenedUrl
   │
   ├── private repository
   ├── private ID generator
   └── private code generator
```

This is encapsulation applied to an application service.

---

# 16. Encapsulation vs Data Hiding

These terms are related but not identical.

### Data hiding

Means:

> Prevent direct access to internal data.

Example:

```ts
private balance
```

### Encapsulation

Means:

> Organize state and behavior together and control interaction through a well-defined interface.

So:

```text
Data hiding
    ↓
one mechanism supporting
    ↓
Encapsulation
```

`private` helps you implement encapsulation, but **encapsulation is the larger design principle**.

---

# 17. The Most Important Design Question

When designing an object, ask:

> **What should this object be responsible for protecting?**

For `BankAccount`:

```text
balance
valid withdrawals
valid deposits
```

For `Order`:

```text
status
valid state transitions
items
total
```

For `ShortenedUrl`:

```text
expiration rules
short-code identity
URL state
```

For `CreateShortenedUrl`:

```text
the creation workflow
its dependencies
```

This question is much more useful than mechanically making every property private.

---

# 18. Practical Encapsulation Pattern

A common pattern is:

```text
Private State
     +
Public Behavior
     +
Invariant Enforcement
```

Example:

```ts
class BankAccount {
  private balance: number;

  constructor(initialBalance: number) {
    if (initialBalance < 0) {
      throw new Error('Invalid initial balance');
    }

    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Invalid deposit');
    }

    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error('Invalid withdrawal');
    }

    if (amount > this.balance) {
      throw new Error('Insufficient balance');
    }

    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}
```

Now the object guarantees:

```text
balance >= 0
```

assuming all state changes go through the class.

That is **real encapsulation**.

---

# 19. What We Have Learned

The progression is now:

```text
Class
  ↓
defines object structure

Constructor
  ↓
establishes initial state

Instance fields
  ↓
store object state

Instance methods
  ↓
provide object behavior

Access modifiers
  ↓
control visibility

Encapsulation
  ↓
uses those mechanisms to protect
state and enforce valid interaction
```

The key distinction:

```text
private ≠ encapsulation

private
    ↓
language mechanism

encapsulation
    ↓
design principle
```

---

# Practice Exercise

Build a `BankAccount` class with proper encapsulation.

Requirements:

```text
State:
- accountNumber
- ownerName
- balance
```

Rules:

```text
1. accountNumber cannot be changed after creation.
2. balance cannot be directly modified from outside.
3. Initial balance cannot be negative.
4. Deposit amount must be greater than zero.
5. Withdrawal amount must be greater than zero.
6. Withdrawal cannot exceed balance.
7. External code can read the balance.
```

Your object should provide behavior similar to:

```text
deposit(amount)
withdraw(amount)
getBalance()
```

The important part isn't the syntax. Think about the boundary:

```text
Outside
   │
   ├── deposit()
   ├── withdraw()
   └── getBalance()
          │
          ▼
     BankAccount
          │
          └── private balance
```

Don't use interfaces, inheritance, abstract classes, or static members yet. **We're still building the OOP foundation one concept at a time.**

---

## Checkpoint

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
✓ Controlled state access
```

**Next lesson: `static` members.**

We'll learn the difference between **instance-level members** and **class-level members**, why `static` exists, how memory/ownership differs conceptually, and where `static` is useful—and where using it in backend architecture is a bad design choice.