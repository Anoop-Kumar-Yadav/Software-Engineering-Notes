# TypeScript OOP — Lesson 1: Classes

Understood. We will do this like a **professional Java OOP course**, not as a quick list of concepts.

We will take **one concept at a time**, go from fundamentals to internals and practical usage, and only move forward when the current concept is solid.

Our sequence will be:

```text
Lesson 1 → Classes
Lesson 2 → Objects
Lesson 3 → Constructors
Lesson 4 → Instance fields & methods
Lesson 5 → Access modifiers
Lesson 6 → Encapsulation
Lesson 7 → static members
Lesson 8 → readonly & immutability
Lesson 9 → Interfaces
Lesson 10 → Abstraction
Lesson 11 → Composition
Lesson 12 → Inheritance
Lesson 13 → Polymorphism
Lesson 14 → Abstract classes
Lesson 15 → Dependency Injection
Lesson 16 → Dependency Inversion
```

Today: **Classes only**.

---

# 1. What Is a Class?

A **class is a definition that describes the structure and behavior of objects**.

Suppose we're building a banking application.

We have many bank accounts:

```text
Account 1
Account 2
Account 3
Account 4
...
```

Every account has similar characteristics:

```text
account number
owner
balance
```

and similar behavior:

```text
deposit
withdraw
check balance
```

Instead of defining every account separately, we define the common structure once:

```ts
class BankAccount {
  accountNumber: string;
  owner: string;
  balance: number;

  deposit(amount: number): void {
    this.balance += amount;
  }

  withdraw(amount: number): void {
    this.balance -= amount;
  }
}
```

This is a **class definition**.

It describes what a `BankAccount` object should contain and what it can do.

---

# 2. Class Is Not an Object

This distinction is fundamental.

When we write:

```ts
class BankAccount {
  accountNumber: string;
  owner: string;
  balance: number;

  deposit(amount: number): void {
    this.balance += amount;
  }
}
```

we have **not created a bank account**.

We have only defined the structure.

Think of it like:

```text
             CLASS
               │
               │ blueprint
               ▼
        ┌───────────────┐
        │  BankAccount  │
        │               │
        │ accountNumber │
        │ owner         │
        │ balance       │
        │               │
        │ deposit()     │
        │ withdraw()    │
        └───────────────┘
```

An actual account is created from that class.

```ts
const account1 = new BankAccount();
```

Now:

```text
BankAccount
     │
     │ new
     ▼
 account1
```

`account1` is an **object**, also called an **instance** of `BankAccount`.

---

# 3. Why Do We Need Classes?

The fundamental purpose of a class is to define a common structure and behavior for objects.

Suppose we didn't use a class.

We could write:

```ts
const account1 = {
  accountNumber: 'ACC001',
  owner: 'Anoop',
  balance: 1000,
};

const account2 = {
  accountNumber: 'ACC002',
  owner: 'Rahul',
  balance: 5000,
};
```

This works.

But where do we put common behavior?

We could manually add:

```ts
const account1 = {
  accountNumber: 'ACC001',
  owner: 'Anoop',
  balance: 1000,

  deposit(amount: number) {
    this.balance += amount;
  },
};
```

and repeat it for every account.

That's duplication.

A class gives us one definition:

```ts
class BankAccount {
  accountNumber: string;
  owner: string;
  balance: number;

  deposit(amount: number): void {
    this.balance += amount;
  }
}
```

Then create many objects:

```ts
const account1 = new BankAccount();
const account2 = new BankAccount();
const account3 = new BankAccount();
```

Each object has the structure and behavior defined by the class.

---

# 4. Creating an Object With `new`

The `new` keyword is extremely important.

```ts
const account = new BankAccount();
```

Conceptually:

```text
new BankAccount()
       │
       ▼
Create an object
       │
       ▼
Return the object
       │
       ▼
account
```

So:

```ts
const account = new BankAccount();
```

means:

> Create a new instance of the `BankAccount` class and store its reference in `account`.

---

# 5. Multiple Objects From One Class

This is where classes become useful.

```ts
const account1 = new BankAccount();
const account2 = new BankAccount();
const account3 = new BankAccount();
```

We have:

```text
             BankAccount class
                    │
          ┌─────────┼─────────┐
          │         │         │
          ▼         ▼         ▼
      account1  account2  account3
```

Each object is a separate instance.

For example:

```ts
account1.balance = 1000;
account2.balance = 5000;
```

These are separate values.

```text
account1
└── balance = 1000

account2
└── balance = 5000
```

Changing one doesn't automatically change the other.

---

# 6. Class Properties

Our class contains:

```ts
class BankAccount {
  accountNumber: string;
  owner: string;
  balance: number;
}
```

These are **instance properties**.

Each object gets its own values.

Conceptually:

```text
BankAccount
│
├── accountNumber
├── owner
└── balance
```

Then:

```text
account1
├── accountNumber = ACC001
├── owner = Anoop
└── balance = 1000

account2
├── accountNumber = ACC002
├── owner = Rahul
└── balance = 5000
```

The class defines the structure; each instance holds its own state.

---

# 7. Class Methods

Now consider:

```ts
class BankAccount {
  deposit(amount: number): void {
    this.balance += amount;
  }
}
```

`deposit()` is a **method**.

A method represents behavior associated with the object.

We can call:

```ts
account1.deposit(500);
```

The important keyword here is:

```ts
this
```

---

# 8. Understanding `this`

`this` refers to the **current object instance**.

Suppose:

```ts
const account1 = new BankAccount();
```

and:

```ts
account1.deposit(500);
```

Inside `deposit()`:

```ts
this.balance += 500;
```

`this` refers to:

```text
account1
```

So conceptually:

```text
account1.deposit(500)

        ↓

this = account1

        ↓

account1.balance += 500
```

If:

```ts
account2.deposit(1000);
```

then:

```text
this = account2
```

Therefore the same method operates on different object state.

This is one of the central ideas behind object-oriented programming.

---

# 9. A Complete Small Example

Let's make the example executable and correct.

```ts
class BankAccount {
  accountNumber: string;
  owner: string;
  balance: number;

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

const account1 = new BankAccount();

account1.accountNumber = 'ACC001';
account1.owner = 'Anoop';
account1.balance = 1000;

account1.deposit(500);
account1.withdraw(200);

console.log(account1.getBalance());
```

Result:

```text
1300
```

Execution:

```text
Initial
balance = 1000

deposit(500)
balance = 1500

withdraw(200)
balance = 1300

getBalance()
returns 1300
```

---

# 10. One Problem With This Class

Our class currently allows this:

```ts
account1.balance = -500000;
```

Nothing stops it.

We could do:

```ts
account1.balance = 999999999;
```

or:

```ts
account1.balance = -1000000;
```

This exposes an important limitation.

Our class currently has:

```text
data
+
behavior
```

but **no control over its internal state**.

This is the problem that the next OOP concept, **encapsulation**, eventually solves.

But don't jump there yet.

First understand classes themselves.

---

# 11. Class as a Type

TypeScript has another important concept.

A class isn't only a blueprint for creating objects. It also introduces a **type**.

For example:

```ts
class BankAccount {
  balance: number;

  getBalance(): number {
    return this.balance;
  }
}
```

You can write:

```ts
let account: BankAccount;
```

This means:

> `account` should reference an object compatible with the `BankAccount` class type.

Then:

```ts
account = new BankAccount();
```

is valid.

This is where TypeScript differs somewhat from plain JavaScript: TypeScript gives us compile-time type information around classes.

---

# 12. Class vs Object vs Instance

These terms are often mixed together.

|Term|Meaning|
|---|---|
|Class|Definition/blueprint|
|Object|Runtime value containing state/behavior|
|Instance|An object created from a particular class|
|Property|Data/state associated with an object|
|Method|Behavior associated with an object|
|`new`|Creates an instance|
|`this`|Refers to the current instance|

For example:

```ts
class User {
  name: string;
}
```

```ts
const user = new User();
```

Here:

```text
User
 ↓
class

user
 ↓
object / instance of User
```

---

# 13. Real Backend Example

Now let's connect this to the architecture we're building.

Suppose our URL service has:

```text
ShortenedUrl
```

We could model it as:

```ts
class ShortenedUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;

  getRedirectUrl(): string {
    return this.originalUrl;
  }
}
```

Then:

```ts
const url = new ShortenedUrl();
```

This object represents one shortened URL.

Conceptually:

```text
ShortenedUrl class
       │
       ├── id
       ├── originalUrl
       ├── shortCode
       ├── createdAt
       │
       └── getRedirectUrl()
```

An actual URL:

```text
url
├── id = "url-1"
├── originalUrl = "https://example.com"
├── shortCode = "abc123"
└── createdAt = ...
```

This is where OOP starts becoming relevant to our architecture.

---

# 14. But Why Didn't We Initially Use a Class?

Notice that our current project used:

```ts
interface ShortenedUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  expiresAt: Date | null;
}
```

rather than:

```ts
class ShortenedUrl {
  ...
}
```

That was intentional.

An **interface describes a shape**.

A **class can represent both structure and runtime behavior**.

We will eventually discuss exactly when a domain model should be:

```text
interface
```

versus:

```text
class
```

versus:

```text
value object
```

That is an important architecture decision, but **not today's lesson**.

---

# 15. The OOP Idea Behind Classes

At a deeper level, a class allows us to model something as a cohesive unit:

```text
                OBJECT
                  │
        ┌─────────┴─────────┐
        │                   │
      STATE              BEHAVIOR
        │                   │
        ▼                   ▼
    properties            methods
```

For a bank account:

```text
BankAccount
├── STATE
│   ├── accountNumber
│   ├── owner
│   └── balance
│
└── BEHAVIOR
    ├── deposit()
    ├── withdraw()
    └── getBalance()
```

Instead of having unrelated data and functions floating around the application, the class groups related state and behavior.

That idea leads directly into **encapsulation**, but we'll treat that as a separate lesson.

---

# 16. Professional OOP Development Pattern

When designing a class, don't start with syntax.

Ask:

### 1. What real concept am I modeling?

```text
BankAccount
```

### 2. What state does it own?

```text
accountNumber
owner
balance
```

### 3. What behavior belongs to it?

```text
deposit()
withdraw()
getBalance()
```

Then:

```text
             BankAccount
                  │
        ┌─────────┴─────────┐
        │                   │
       State             Behavior
        │                   │
 accountNumber           deposit()
 owner                   withdraw()
 balance                 getBalance()
```

This way of thinking becomes extremely valuable when designing domain entities.

---

# 17. Practice Exercise

Before moving to constructors, build this yourself.

Create a class:

```text
Product
```

It should have:

```text
id
name
price
```

and methods:

```text
increasePrice()
decreasePrice()
getPrice()
```

Requirements:

```text
increasePrice(amount)
→ increases price

decreasePrice(amount)
→ decreases price

getPrice()
→ returns current price
```

Then create **two Product objects** with different values and perform operations on both.

For example, conceptually:

```text
Product 1
name = "Keyboard"
price = 1000

Product 2
name = "Mouse"
price = 500
```

Then:

```text
Keyboard + 200
Mouse - 100
```

Verify that changing one product does not affect the other.

**Don't worry about validation or private fields yet.** We're intentionally practicing only:

```text
class
object
properties
methods
new
this
```

Once you can write this comfortably, the next lesson will be **constructors**, where we'll learn how objects are initialized properly instead of doing:

```ts
const product = new Product();

product.name = ...;
product.price = ...;
```

and we'll also look at what actually happens when `new` creates an object.