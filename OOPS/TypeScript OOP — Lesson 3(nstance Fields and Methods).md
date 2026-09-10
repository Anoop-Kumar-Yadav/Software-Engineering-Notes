# TypeScript OOP — Lesson 3: Instance Fields and Methods

We have now covered **classes** and **constructors**. The next concept is how an object actually holds its **state** and exposes its **behavior** through instance fields and instance methods.

This matters directly to backend architecture because your future entities, services, controllers, repositories, and use cases are all objects with **state, behavior, or dependencies**.

---

## 1. What Is an Instance Field?

An **instance field** is data that belongs to a particular object created from a class.

Consider:

```ts
class User {
  name: string;
  email: string;
  age: number;

  constructor(name: string, email: string, age: number) {
    this.name = name;
    this.email = email;
    this.age = age;
  }
}
```

Create two objects:

```ts
const user1 = new User('Anoop', 'anoop@example.com', 22);
const user2 = new User('Rahul', 'rahul@example.com', 25);
```

Each object has its **own instance state**:

```text
user1
├── name  → "Anoop"
├── email → "anoop@example.com"
└── age   → 22

user2
├── name  → "Rahul"
├── email → "rahul@example.com"
└── age   → 25
```

The class defines the fields, but each instance has its own values.

---

# 2. Why Are They Called "Instance" Fields?

Because they belong to an **instance**.

```ts
const user1 = new User(...);
const user2 = new User(...);
```

There is one class:

```text
User
```

but two instances:

```text
user1
user2
```

Therefore:

```text
              User class
                  │
          ┌───────┴───────┐
          ▼               ▼
       user1             user2
          │               │
       state 1          state 2
```

Changing one doesn't change the other:

```ts
user1.name = 'Anoop Kumar';
```

Only `user1` changes.

```text
user1.name → "Anoop Kumar"
user2.name → "Rahul"
```

This is the fundamental idea of **instance state**.

---

# 3. Instance Methods

Now consider:

```ts
class BankAccount {
  balance: number;

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

The fields:

```text
balance
```

represent **state**.

The methods:

```text
deposit()
withdraw()
getBalance()
```

represent **behavior**.

So an object can be thought of as:

```text
BankAccount object
├── State
│   └── balance
│
└── Behavior
    ├── deposit()
    ├── withdraw()
    └── getBalance()
```

This relationship between **state and behavior** is fundamental to OOP.

---

# 4. Methods Operate on Instance State

Look carefully at:

```ts
deposit(amount: number): void {
  this.balance += amount;
}
```

The method doesn't have its own independent balance.

It operates on:

```ts
this.balance
```

which belongs to the current object.

For:

```ts
const account1 = new BankAccount(1000);
const account2 = new BankAccount(5000);
```

when we call:

```ts
account1.deposit(500);
```

conceptually:

```text
account1.deposit(500)
       │
       ▼
this = account1
       │
       ▼
account1.balance += 500
```

Result:

```text
account1.balance = 1500
account2.balance = 5000
```

When we call:

```ts
account2.deposit(1000);
```

then:

```text
this = account2
```

and:

```text
account2.balance = 6000
```

Same method definition, different object state.

---

# 5. This Is Why `this` Is So Important

You should now connect the previous lesson with today's lesson.

```ts
class BankAccount {
  balance: number;

  constructor(balance: number) {
    this.balance = balance;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }
}
```

There are two different concepts here:

```text
balance
```

and:

```text
this.balance
```

Inside the constructor:

```ts
constructor(balance: number) {
  this.balance = balance;
}
```

The first `balance` is the **parameter**.

The second:

```ts
this.balance
```

is the **instance field**.

Inside:

```ts
deposit(amount: number) {
  this.balance += amount;
}
```

`this.balance` refers to the balance belonging to whichever instance called the method.

---

# 6. Methods Can Receive Parameters

Instance methods can accept input.

```ts
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}
```

Then:

```ts
const calculator = new Calculator();

const result = calculator.add(10, 20);
```

Here:

```text
a = 10
b = 20
```

The method doesn't necessarily need instance state.

This distinction matters.

A method can be:

```text
instance behavior using instance state
```

or simply:

```text
behavior exposed through an instance
```

Later we'll see that methods can also be `static`, meaning they belong to the class rather than instances.

Don't mix that into today's concept yet.

---

# 7. Methods Can Return Values

For example:

```ts
class BankAccount {
  balance: number;

  constructor(balance: number) {
    this.balance = balance;
  }

  getBalance(): number {
    return this.balance;
  }
}
```

Usage:

```ts
const account = new BankAccount(5000);

const balance = account.getBalance();

console.log(balance);
```

Result:

```text
5000
```

So methods can:

```text
modify state
return state
calculate something
perform behavior
```

---

# 8. A More Realistic Example

Let's build a `ShoppingCart`.

```ts
class ShoppingCart {
  items: string[];

  constructor() {
    this.items = [];
  }

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

Usage:

```ts
const cart = new ShoppingCart();

cart.addItem('Keyboard');
cart.addItem('Mouse');

console.log(cart.getItemCount());
```

Result:

```text
2
```

The object owns:

```text
items
```

and its methods operate on that state.

That's a very typical OOP model.

---

# 9. State + Behavior Together

Compare these two approaches.

### Procedural style

```ts
const cart = {
  items: [],
};

function addItem(cart: typeof cart, item: string) {
  cart.items.push(item);
}
```

The state and behavior are separate.

### Object-oriented style

```ts
class ShoppingCart {
  items: string[] = [];

  addItem(item: string): void {
    this.items.push(item);
  }
}
```

Now:

```text
ShoppingCart
├── state
│   └── items
│
└── behavior
    └── addItem()
```

This doesn't mean OOP is automatically better than procedural programming. The value of OOP becomes more apparent when the object has **meaningful state, invariants, and behavior that belong together**.

That distinction becomes important later when deciding whether something in your backend should actually be a class.

---

# 10. Instance Methods Don't Need to Be Recreated Conceptually

Suppose we have:

```ts
class User {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  greet(): string {
    return `Hello, ${this.name}`;
  }
}
```

Then:

```ts
const user1 = new User('Anoop');
const user2 = new User('Rahul');
```

Both can do:

```ts
user1.greet();
user2.greet();
```

The method definition comes from the class, while the method operates using the current object's state.

Conceptually:

```text
                User class
                    │
                greet()
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
       user1                user2
          │                   │
       name=Anoop          name=Rahul
          │                   │
          ▼                   ▼
    Hello, Anoop          Hello, Rahul
```

The important thing is not to think of every object as containing a completely separate copy of the class definition.

JavaScript's actual runtime model involves **prototypes**.

We'll study that separately when we discuss TypeScript/JavaScript OOP internals.

---

# 11. Instance Field Initialization

TypeScript lets you initialize fields directly.

Instead of:

```ts
class ShoppingCart {
  items: string[];

  constructor() {
    this.items = [];
  }
}
```

you can write:

```ts
class ShoppingCart {
  items: string[] = [];
}
```

Then:

```ts
const cart = new ShoppingCart();
```

starts with:

```text
items = []
```

This is called **field initialization**.

You can also use:

```ts
class User {
  name: string = 'Unknown';
  age: number = 0;
}
```

Each new instance gets its initial values.

---

# 12. Constructor vs Field Initializer

Consider:

```ts
class User {
  name: string = 'Unknown';

  constructor(name: string) {
    this.name = name;
  }
}
```

There are now two initialization mechanisms.

Field initializer:

```ts
name = 'Unknown';
```

Constructor:

```ts
this.name = name;
```

The constructor value will establish the value supplied during creation.

For example:

```ts
const user = new User('Anoop');
```

results in:

```text
name = "Anoop"
```

For now, remember the practical rule:

> Use a field initializer when there is a sensible default; use the constructor when the value must be supplied or calculated during creation.

---

# 13. Real Backend Example: A Service Object

Now let's move closer to your architecture.

Consider:

```ts
class UserService {
  getUser(userId: string) {
    // ...
  }

  createUser(data: unknown) {
    // ...
  }
}
```

This class has **behavior**, but currently no meaningful instance state.

Now suppose it needs a repository:

```ts
class UserService {
  constructor(
    private readonly repository: UserRepository,
  ) {}

  async getUser(userId: string) {
    return this.repository.findById(userId);
  }
}
```

Now the object has state in the form of a dependency:

```text
UserService
└── repository
```

and behavior:

```text
getUser()
createUser()
```

This is where instance fields and methods begin connecting directly to **dependency injection**.

But we won't jump into DI yet.

---

# 14. Real Backend Example: Controller

Our URL service has:

```text
CreateShortenedUrlController
```

Conceptually:

```ts
class CreateShortenedUrlController {
  constructor(
    private readonly createShortenedUrl: CreateShortenedUrl,
  ) {}

  async handle(request: Request, response: Response) {
    const result = await this.createShortenedUrl.execute({
      originalUrl: request.body.originalUrl,
    });

    response.status(201).json(result);
  }
}
```

The controller object contains:

```text
State / dependency
└── createShortenedUrl

Behavior
└── handle()
```

So:

```text
Controller object
       │
       ├── dependency
       │
       └── method
```

This is ordinary OOP being used to construct our backend architecture.

---

# 15. Why This Matters for Clean Architecture

Remember our architecture:

```text
Route
  ↓
Controller
  ↓
Use Case
  ↓
Port
  ↓
Adapter
```

Almost every box can be represented as an object:

```text
Controller object
Use Case object
Repository object
Database adapter object
Generator object
```

And each object can have:

```text
state
+
behavior
```

For example:

```text
CreateShortenedUrl
├── repository dependency
├── idGenerator dependency
├── shortCodeGenerator dependency
│
└── execute()
```

Then:

```text
MongoUrlRepository
├── database connection
│
└── create()
```

Then:

```text
CreateShortenedUrlController
├── use-case dependency
│
└── handle()
```

This is why understanding OOP properly will make the architecture much easier.

---

# 16. One Important Design Principle

A class should generally have a **coherent responsibility**.

Compare:

```ts
class User {
  name: string;

  saveToMongoDB() {}
  sendEmail() {}
  generateJwt() {}
  validatePassword() {}
}
```

This class knows far too much.

It mixes:

```text
domain
persistence
communication
authentication
```

Instead, we can have:

```text
User
UserRepository
EmailSender
TokenService
```

Each object has a focused responsibility.

This eventually connects to **Single Responsibility Principle**, but we will study SOLID later.

For now, simply learn to ask:

> **What state and behavior naturally belong together?**

---

# 17. Practice Exercise

Now practice today's concept without introducing interfaces, private fields, inheritance, or polymorphism.

Create:

```text
class BankAccount
```

It should contain these instance fields:

```text
accountNumber
ownerName
balance
```

The constructor should initialize them.

Create these instance methods:

```text
deposit(amount)
withdraw(amount)
getBalance()
```

Then:

```text
Create account1 with balance 1000
Create account2 with balance 5000
```

Perform:

```text
account1.deposit(500)
account2.withdraw(1000)
```

Verify:

```text
account1 → 1500
account2 → 4000
```

The important thing you should be able to mentally trace is:

```text
account1.deposit(500)
       ↓
deposit()
       ↓
this = account1
       ↓
account1.balance += 500
```

and:

```text
account2.withdraw(1000)
       ↓
withdraw()
       ↓
this = account2
       ↓
account2.balance -= 1000
```

---

# Checkpoint

We have now completed:

```text
✓ Classes
✓ Objects / Instances
✓ Properties
✓ Methods
✓ new
✓ this
✓ Constructors
✓ Constructor parameters
✓ Object initialization
✓ Instance fields
✓ Instance methods
✓ Instance state
✓ State + behavior relationship
✓ Basic class design
```

The **next single topic is access modifiers**: `public`, `private`, and `protected`.

That lesson is particularly important because it takes us from:

```text
object has state
```

to:

```text
object controls who can access its state
```

which is the foundation for **encapsulation**.