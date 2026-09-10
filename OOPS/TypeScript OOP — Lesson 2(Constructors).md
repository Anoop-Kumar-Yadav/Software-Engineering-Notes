# TypeScript OOP — Lesson 2: Constructors

We finished **Classes** in the previous lesson. The concepts established were:

```text
Class
Object / Instance
Properties
Methods
new
this
```

Now we move to exactly **one new concept: constructors**.

The central question for this lesson is:

> **How do we make sure an object is created in a valid, properly initialized state?**

---

# 1. The Problem Constructors Solve

Consider the class from our previous lesson:

```ts
class Product {
  id: string;
  name: string;
  price: number;

  increasePrice(amount: number): void {
    this.price += amount;
  }

  decreasePrice(amount: number): void {
    this.price -= amount;
  }

  getPrice(): number {
    return this.price;
  }
}
```

We can create an object:

```ts
const product = new Product();
```

But notice what happens next.

We have to manually initialize everything:

```ts
product.id = 'p-001';
product.name = 'Keyboard';
product.price = 1000;
```

So object creation becomes a two-step process:

```text
Create object
    ↓
Initialize object manually
```

This is dangerous because someone could forget something:

```ts
const product = new Product();

product.name = 'Keyboard';
// price forgotten
```

Now the object is incomplete.

A constructor solves this problem by making **object initialization part of object creation**.

---

# 2. What Is a Constructor?

A **constructor is a special method that executes when a new instance of a class is created.**

Example:

```ts
class Product {
  id: string;
  name: string;
  price: number;

  constructor(
    id: string,
    name: string,
    price: number,
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
  }
}
```

Now:

```ts
const product = new Product(
  'p-001',
  'Keyboard',
  1000,
);
```

The constructor receives:

```text
'p-001'
'Keyboard'
1000
```

and initializes:

```text
product
├── id = 'p-001'
├── name = 'Keyboard'
└── price = 1000
```

---

# 3. Understand the Relationship Between `new` and Constructor

This is extremely important.

When you write:

```ts
const product = new Product(
  'p-001',
  'Keyboard',
  1000,
);
```

conceptually, the process is:

```text
new Product(...)
       │
       ▼
Create a new instance
       │
       ▼
Run Product constructor
       │
       ▼
Initialize instance
       │
       ▼
Return instance
       │
       ▼
product
```

So the constructor isn't something you manually call like:

```ts
product.constructor();
```

Normally, it runs as part of:

```ts
new Product(...)
```

---

# 4. Constructor Parameters

A constructor can receive parameters just like a normal function.

```ts
class User {
  name: string;
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}
```

Then:

```ts
const user = new User(
  'Anoop',
  'anoop@example.com',
);
```

Inside the constructor:

```text
name parameter
      ↓
this.name

email parameter
      ↓
this.email
```

This distinction is important:

```ts
constructor(name: string) {
  this.name = name;
}
```

The left side:

```ts
this.name
```

is the **property belonging to the object**.

The right side:

```ts
name
```

is the **constructor parameter**.

---

# 5. Why Do We Use `this`?

Remember from Lesson 1:

> `this` refers to the current object instance.

Suppose:

```ts
const user1 = new User('Anoop', 'anoop@example.com');
```

During the constructor execution:

```text
this
 ↓
user1
```

Therefore:

```ts
this.name = name;
```

means:

```text
user1.name = 'Anoop'
```

Now:

```ts
const user2 = new User('Rahul', 'rahul@example.com');
```

During this constructor execution:

```text
this
 ↓
user2
```

Therefore:

```text
user2.name = 'Rahul'
```

The same constructor initializes different instances with different data.

---

# 6. Constructor Establishes Initial State

This is one of the most important ways to think about constructors:

> **A constructor establishes the initial state of an object.**

For example:

```ts
class BankAccount {
  accountNumber: string;
  owner: string;
  balance: number;

  constructor(
    accountNumber: string,
    owner: string,
    initialBalance: number,
  ) {
    this.accountNumber = accountNumber;
    this.owner = owner;
    this.balance = initialBalance;
  }
}
```

Now:

```ts
const account = new BankAccount(
  'ACC001',
  'Anoop',
  5000,
);
```

The resulting object starts as:

```text
BankAccount
├── accountNumber = ACC001
├── owner = Anoop
└── balance = 5000
```

There is no intermediate invalid-looking object that requires several assignments.

---

# 7. Constructor Can Establish Rules

A constructor isn't merely a place to copy parameters into properties.

It can also enforce **initialization rules**.

Suppose a bank account cannot start with a negative balance.

```ts
class BankAccount {
  accountNumber: string;
  owner: string;
  balance: number;

  constructor(
    accountNumber: string,
    owner: string,
    initialBalance: number,
  ) {
    if (initialBalance < 0) {
      throw new Error(
        'Initial balance cannot be negative',
      );
    }

    this.accountNumber = accountNumber;
    this.owner = owner;
    this.balance = initialBalance;
  }
}
```

Now:

```ts
const account = new BankAccount(
  'ACC001',
  'Anoop',
  -500,
);
```

throws an error.

The constructor prevented an invalid object from being created.

This idea becomes **very important later when we study encapsulation and domain entities**.

---

# 8. Constructor vs Normal Method

A constructor and a normal method have different purposes.

|Constructor|Normal method|
|---|---|
|Initializes an object|Performs behavior after creation|
|Runs during `new`|Called explicitly|
|Runs once during normal instance creation|Can generally be called multiple times|
|Establishes initial state|Changes or operates on existing state|
|Named `constructor`|Can have any valid method name|

Example:

```ts
class BankAccount {
  constructor(
    public accountNumber: string,
    public balance: number,
  ) {}

  deposit(amount: number): void {
    this.balance += amount;
  }
}
```

Usage:

```ts
const account = new BankAccount(
  'ACC001',
  1000,
);
```

Constructor:

```text
Create + initialize
```

Then:

```ts
account.deposit(500);
```

Method:

```text
Operate on existing object
```

---

# 9. Constructor Is Not a Factory

This distinction will matter later.

A constructor:

```ts
new Product(...)
```

directly creates an instance of the class.

A factory is a separate concept that we'll study much later.

For now:

```text
Constructor
    ↓
initializes an instance

Factory
    ↓
decides how/which object to create
```

Don't introduce factories yet.

They are often overused in beginner architecture.

---

# 10. TypeScript Constructor Shorthand

Now we can introduce a very useful TypeScript feature.

Previously:

```ts
class Product {
  id: string;
  name: string;
  price: number;

  constructor(
    id: string,
    name: string,
    price: number,
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
  }
}
```

TypeScript allows:

```ts
class Product {
  constructor(
    public id: string,
    public name: string,
    public price: number,
  ) {}
}
```

This is called a **parameter property**.

TypeScript effectively creates the properties and performs the assignments for you.

Conceptually:

```ts
constructor(
  public id: string,
)
```

is roughly equivalent to:

```ts
id: string;

constructor(id: string) {
  this.id = id;
}
```

We'll study `public`, `private`, and `protected` separately later, so for now focus on the constructor mechanism itself.

---

# 11. Constructor With `readonly`

We can combine constructors with `readonly`.

```ts
class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public price: number,
  ) {}
}
```

Now:

```ts
const product = new Product(
  'p-001',
  'Keyboard',
  1000,
);
```

This is allowed:

```ts
product.name = 'Mechanical Keyboard';
product.price = 1200;
```

But this isn't:

```ts
product.id = 'p-002';
```

because `id` is readonly.

Don't worry about the deeper immutability discussion yet. We'll dedicate a separate lesson to `readonly`.

---

# 12. Constructors and Our URL Shortener

Now connect this to the architecture we've already built.

Our current entity is conceptually:

```text
ShortenedUrl
├── id
├── originalUrl
├── shortCode
├── createdAt
└── expiresAt
```

If we represented it as a class, a constructor could establish the initial state:

```ts
class ShortenedUrl {
  constructor(
    public readonly id: string,
    public readonly originalUrl: string,
    public readonly shortCode: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date | null,
  ) {}
}
```

Then:

```ts
const url = new ShortenedUrl(
  'url-1',
  'https://example.com',
  'abc123',
  new Date(),
  null,
);
```

The constructor guarantees that the object starts with all required fields.

But notice something important:

**We aren't changing our project to this yet.**

We're learning the OOP mechanism first.

Later, when we revisit the domain model, we'll make a deliberate decision about whether `ShortenedUrl` should be a class and what behavior should belong inside it.

---

# 13. Constructor Overloading

TypeScript doesn't support runtime constructor overloading like Java in exactly the same way.

In Java you might write:

```java
class Product {
    Product() {}
    Product(String name) {}
    Product(String name, double price) {}
}
```

TypeScript doesn't allow multiple constructor implementations:

```ts
class Product {
  constructor() {}
  constructor(name: string) {} // ❌
}
```

Instead, TypeScript supports **constructor overload signatures** with one implementation.

For example:

```ts
class Product {
  name: string;
  price: number;

  constructor();
  constructor(name: string, price: number);

  constructor(
    name = 'Unknown',
    price = 0,
  ) {
    this.name = name;
    this.price = price;
  }
}
```

Then both are valid:

```ts
const product1 = new Product();

const product2 = new Product(
  'Keyboard',
  1000,
);
```

However, **don't use constructor overloads just because you can**.

In backend code, a clear constructor with explicit required dependencies/data is often easier to understand.

---

# 14. Constructor Visibility

A constructor can also have an access modifier.

For example:

```ts
class User {
  private constructor(
    public readonly id: string,
  ) {}
}
```

Now:

```ts
const user = new User('user-1');
```

is not allowed from outside the class because the constructor is private.

Why would we ever do this?

One reason is controlling object creation through another mechanism such as a static factory.

For example:

```ts
class User {
  private constructor(
    public readonly id: string,
  ) {}

  static create(id: string): User {
    return new User(id);
  }
}
```

Then:

```ts
const user = User.create('user-1');
```

We will **not go deeper into this yet**, because that belongs to factories and static members.

The important point for today is simply:

> A constructor itself can have access restrictions.

---

# 15. Constructor and Dependency Injection

This is where today's lesson directly connects to our architecture.

Remember:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly dependencies: CreateShortenedUrlDependencies,
  ) {}
}
```

That constructor isn't initializing business data like:

```text
id
name
price
```

It's receiving **dependencies**.

For example:

```text
CreateShortenedUrl
       │
       ├── UrlRepository
       ├── IdGenerator
       └── ShortCodeGenerator
```

Then:

```ts
const useCase = new CreateShortenedUrl({
  urlRepository,
  idGenerator,
  shortCodeGenerator,
});
```

The constructor establishes:

> "This use-case object cannot exist without these dependencies."

That's a very important use of constructors in backend architecture.

---

# 16. Two Major Constructor Roles

You should recognize these two patterns.

### Object initialization

```ts
class Product {
  constructor(
    public name: string,
    public price: number,
  ) {}
}
```

Meaning:

> Initialize the object's state.

### Dependency injection

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
  ) {}
}
```

Meaning:

> Give this object the external capability it needs.

Both use the same TypeScript feature, but conceptually they're different purposes.

---

# 17. Constructor Design Rule

A professional rule is:

> **After construction, the object should be in a usable and coherent state.**

Avoid:

```ts
const user = new User();

user.name = 'Anoop';
user.email = '...';
user.role = 'admin';
```

if those values are fundamentally required.

Prefer:

```ts
const user = new User(
  'Anoop',
  '...',
  'admin',
);
```

Now the constructor communicates the object's requirements immediately.

This is particularly important for domain objects and services.

---

# 18. But Don't Put Everything in Constructors

A common beginner mistake is making constructors enormous.

For example:

```ts
class Order {
  constructor(
    userRepository: UserRepository,
    productRepository: ProductRepository,
    paymentGateway: PaymentGateway,
    emailSender: EmailSender,
    inventoryService: InventoryService,
    ...
  ) {}
}
```

If you're modeling an `Order` entity, that is suspicious.

Those are probably **application dependencies**, not properties of an order.

You might instead have:

```text
PlaceOrder use case
├── UserRepository
├── ProductRepository
├── PaymentGateway
├── InventoryService
└── OrderRepository
```

while:

```text
Order entity
├── id
├── customerId
├── items
└── total
```

This distinction will become very important when we study **composition and dependency injection**.

---

# 19. What You Should Remember From This Lesson

Don't memorize dozens of syntax rules.

Remember these five things:

```text
1. Constructor runs during new.
2. Constructor initializes the instance.
3. this refers to the instance being created.
4. Constructor can enforce initial invariants.
5. Constructors are commonly used for dependency injection.
```

The fundamental flow is:

```text
new Class(...)
      ↓
new instance
      ↓
constructor(...)
      ↓
initialize state
      ↓
usable object
```

And in our architecture:

```text
wire.ts
   │
   │ creates
   ▼
Use Case
   │
   │ constructor receives
   ▼
Ports / Dependencies
```

---

# Practice — Constructor Only

Before moving to the next OOP concept, practice this without using `private`, inheritance, interfaces, or anything else.

Create:

```text
class Employee
```

It should contain:

```text
id
name
salary
department
```

The constructor should initialize all four.

Then create two employees:

```text
Employee 1
id = "emp-001"
name = "Anoop"
salary = 50000
department = "Backend"

Employee 2
id = "emp-002"
name = "Rahul"
salary = 60000
department = "Frontend"
```

Then print both objects.

The goal is to make this flow completely natural:

```text
class
  ↓
constructor
  ↓
new Employee(...)
  ↓
object initialized
```

**Checkpoint after Lesson 2:**

```text
✓ Class
✓ Object / Instance
✓ Properties
✓ Methods
✓ new
✓ this
✓ Constructor
✓ Constructor parameters
✓ Object initialization
✓ Constructor as dependency injection entry point
```

Next we'll study **instance fields and methods more deeply**, including how methods are associated with instances, what `this` actually means at runtime, and why method context becomes important when passing class methods to Express.