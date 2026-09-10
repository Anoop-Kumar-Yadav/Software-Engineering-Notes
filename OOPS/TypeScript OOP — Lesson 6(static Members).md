# TypeScript OOP — Lesson 6: `static` Members

We now move to the next single OOP concept: **`static`**.

This is an important transition because until now, everything we've created has belonged to an **individual object instance**:

```text
Class
  │
  ├── object 1 → instance fields/methods
  ├── object 2 → instance fields/methods
  └── object 3 → instance fields/methods
```

`static` introduces something different:

> **A static member belongs to the class itself, not to individual instances.**

---

# 1. First Understand the Problem

Consider our `BankAccount`:

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

We create:

```ts
const account1 = new BankAccount(1000);
const account2 = new BankAccount(5000);
```

Each account has its own:

```text
account1.balance → 1000
account2.balance → 5000
```

That's instance data.

But imagine we want to track:

> How many `BankAccount` objects have been created?

Does that number belong to `account1`?

No.

Does it belong to `account2`?

No.

It belongs to the **BankAccount class as a whole**.

That's exactly the kind of situation `static` is designed for.

---

# 2. Static Field

We can write:

```ts
class BankAccount {
  static accountCount = 0;

  constructor(
    public balance: number,
  ) {
    BankAccount.accountCount++;
  }
}
```

Now:

```ts
const account1 = new BankAccount(1000);
const account2 = new BankAccount(5000);
const account3 = new BankAccount(2000);
```

Then:

```ts
console.log(BankAccount.accountCount);
```

returns:

```text
3
```

Notice the access:

```ts
BankAccount.accountCount
```

not:

```ts
account1.accountCount
```

That's the defining difference.

---

# 3. Instance vs Static

Compare:

```ts
class BankAccount {
  balance: number;

  static accountCount = 0;
}
```

There are two different levels:

```text
                    BankAccount
                        │
              ┌─────────┴─────────┐
              │                   │
          STATIC LEVEL       INSTANCE LEVEL
              │                   │
       accountCount             balance
              │                   │
         belongs to          belongs to each
          the class              object
```

Therefore:

```text
BankAccount.accountCount
```

versus:

```text
account1.balance
account2.balance
```

---

# 4. Static Method

The same idea applies to methods.

An instance method:

```ts
class MathCalculator {
  add(a: number, b: number): number {
    return a + b;
  }
}
```

requires an object:

```ts
const calculator = new MathCalculator();

calculator.add(10, 20);
```

But `add()` doesn't actually need any object-specific state.

We could make it static:

```ts
class MathCalculator {
  static add(a: number, b: number): number {
    return a + b;
  }
}
```

Now:

```ts
MathCalculator.add(10, 20);
```

No object is required.

Conceptually:

```text
Instance method

object
  ↓
object.method()


Static method

class
  ↓
Class.method()
```

---

# 5. Why Doesn't a Static Method Need an Object?

Because it doesn't operate on **instance state**.

Consider:

```ts
class MathUtils {
  static add(a: number, b: number): number {
    return a + b;
  }
}
```

What would `this.balance` mean here?

There is no particular `MathUtils` object involved.

The operation is associated with the class itself.

So:

```ts
MathUtils.add(10, 20);
```

makes semantic sense.

---

# 6. Static Methods Cannot Normally Access Instance Fields

Consider:

```ts
class User {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  static printName(): void {
    console.log(this.name);
  }
}
```

This doesn't mean:

```text
Which user's name?
```

There could be:

```text
user1 → Anoop
user2 → Rahul
user3 → Priya
```

A static method doesn't have a particular instance.

Therefore static code cannot directly use instance members.

This is a crucial mental model:

> **Instance members need an instance. Static members need only the class.**

---

# 7. Static Can Have Its Own State

A static method can access static fields.

```ts
class BankAccount {
  static accountCount = 0;

  constructor(
    public balance: number,
  ) {
    BankAccount.accountCount++;
  }

  static getAccountCount(): number {
    return BankAccount.accountCount;
  }
}
```

Usage:

```ts
new BankAccount(1000);
new BankAccount(5000);

console.log(
  BankAccount.getAccountCount(),
);
```

Result:

```text
2
```

Both:

```text
accountCount
getAccountCount()
```

belong to the class.

---

# 8. Static Is Shared at the Class Level

Suppose:

```ts
class Configuration {
  static environment = 'development';
}
```

Then:

```ts
console.log(Configuration.environment);
```

Every piece of code accessing:

```ts
Configuration.environment
```

refers to the same class-level value.

This makes static state fundamentally different from instance state.

```text
              BankAccount class
                     │
              accountCount = 3
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      account1   account2   account3
       balance    balance    balance
        1000       5000       2000
```

There is:

```text
ONE accountCount
```

but:

```text
ONE balance per instance
```

---

# 9. Static Constants

One very common use of `static` is class-level constants.

For example:

```ts
class HttpStatus {
  static readonly OK = 200;
  static readonly CREATED = 201;
  static readonly NOT_FOUND = 404;
}
```

Usage:

```ts
HttpStatus.CREATED;
```

This is useful because there is no reason to create:

```ts
const status = new HttpStatus();
```

just to access a constant.

The values conceptually belong to the **type/class**, not an individual object.

---

# 10. Static Factory Methods

Here's another common use.

Suppose:

```ts
class User {
  constructor(
    public readonly name: string,
    public readonly email: string,
  ) {}

  static create(
    name: string,
    email: string,
  ): User {
    return new User(name, email);
  }
}
```

Now:

```ts
const user = User.create(
  'Anoop',
  'anoop@example.com',
);
```

This is called a **static factory method**.

Why is it useful?

Because sometimes object creation requires more logic than a simple constructor call.

For example:

```ts
User.createFromEmail(...)
User.createAdmin(...)
User.createGuest(...)
```

We'll study factories later. For now, recognize that static methods can be used as **class-level creation operations**.

---

# 11. Static and `this`

There is an interesting detail.

Inside an instance method:

```ts
class User {
  name: string;

  print(): void {
    console.log(this.name);
  }
}
```

`this` refers to the **instance**.

```text
user.print()
    ↓
this = user
```

Inside a static method:

```ts
class User {
  static count = 0;

  static printCount(): void {
    console.log(this.count);
  }
}
```

Here `this` refers to the **class context**, not an individual instance.

Conceptually:

```text
Instance method
this → object

Static method
this → class
```

This distinction becomes important when we later study JavaScript's actual runtime model.

---

# 12. Static and Our Backend Architecture

Now let's connect this to the architecture we've been building.

Suppose we have:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
  ) {}

  async execute() {
    // ...
  }
}
```

`execute()` is an **instance method**.

Why?

Because it operates using the dependency:

```text
repository
```

which belongs to a particular `CreateShortenedUrl` instance.

We create:

```ts
const useCase = new CreateShortenedUrl(repository);
```

Then:

```ts
useCase.execute();
```

This makes sense because each use-case object can potentially have different dependencies.

---

# 13. Why We Usually Don't Make Use Cases Static

A beginner might think:

```ts
class CreateShortenedUrl {
  static async execute() {
    // ...
  }
}
```

Looks simpler.

But then where do dependencies come from?

You might end up with:

```ts
class CreateShortenedUrl {
  static async execute() {
    const repository = new MongoUrlRepository();
    // ...
  }
}
```

Now the use case has directly created its infrastructure dependency.

You've destroyed one of the architectural boundaries we worked so hard to create.

Instead:

```text
wire.ts
  │
  ├── creates repository
  │
  └── creates use case
          │
          └── repository injected
```

This is one reason **instance-based objects are important in dependency-injected backend systems**.

---

# 14. Static Utility Classes

You may see code like:

```ts
class StringUtils {
  static capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
```

Then:

```ts
StringUtils.capitalize('hello');
```

This works.

But modern TypeScript code doesn't necessarily need a class for this.

You could simply write:

```ts
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
```

So don't adopt this pattern:

```text
Everything must be a class.
```

OOP doesn't mean every function belongs inside a class.

**Use `static` when class-level ownership is meaningful.**

---

# 15. Static State Can Become Dangerous

Consider:

```ts
class AppState {
  static currentUser: User | null = null;
}
```

Now anywhere:

```ts
AppState.currentUser = user;
```

can mutate global-ish state.

This can introduce:

```text
hidden dependencies
shared mutable state
testing problems
concurrency concerns
unexpected coupling
```

So static mutable state should be used carefully.

This is particularly relevant to backend applications because a Node.js process can serve many requests concurrently.

If you put request-specific information into:

```ts
static currentUser
```

you can create serious correctness problems.

---

# 16. Static vs Instance — The Core Comparison

|Instance|Static|
|---|---|
|Belongs to an object|Belongs to the class|
|Requires `new`|Doesn't require `new`|
|Accessed through instance|Accessed through class|
|Can access instance state|Cannot directly access instance state|
|Different value per object|Shared class-level value|
|Useful for object behavior|Useful for class-level operations/constants|

Example:

```ts
class Product {
  static category = 'electronics';

  constructor(
    public readonly name: string,
    public price: number,
  ) {}

  increasePrice(amount: number): void {
    this.price += amount;
  }

  static getCategory(): string {
    return Product.category;
  }
}
```

Usage:

```ts
const keyboard = new Product(
  'Keyboard',
  1000,
);

const mouse = new Product(
  'Mouse',
  500,
);
```

Instance:

```ts
keyboard.price
mouse.price

keyboard.increasePrice(100)
mouse.increasePrice(50)
```

Static:

```ts
Product.category
Product.getCategory()
```

---

# 17. A Useful Mental Model

Think of a class as having two conceptual sides:

```text
                    CLASS
                      │
          ┌───────────┴───────────┐
          │                       │
     CLASS LEVEL             INSTANCE LEVEL
       static                      │
          │                        │
          ▼                        ▼
   shared information          object-specific
   class operations            state + behavior
```

For:

```ts
class Product {
  static taxRate = 0.18;

  constructor(
    public price: number,
  ) {}
}
```

You have:

```text
Product.taxRate
       │
       └── one shared value

product1.price
       │
       └── belongs to product1

product2.price
       │
       └── belongs to product2
```

---

# 18. Important Connection to `new`

We've now learned something useful about `new`.

When you write:

```ts
const product = new Product(1000);
```

you're creating an **instance**.

Therefore instance members become available:

```ts
product.price
product.increasePrice()
```

But static members are available without creating an instance:

```ts
Product.taxRate
Product.someStaticMethod()
```

So:

```text
new Product()
     ↓
instance-level API

Product
     ↓
class-level API
```

This distinction should now be clear.

---

# 19. When Should You Consider `static`?

Ask:

> **Does this operation or value conceptually belong to a particular object?**

If yes:

```text
instance member
```

If no, and it belongs to the class/type as a whole:

```text
static member
```

Examples:

```text
User.name
        → instance

User.login()
        → usually instance

User.create()
        → potentially static factory

User.MAX_NAME_LENGTH
        → potentially static constant
```

---

# 20. What You Should Remember

The essential model is:

```text
INSTANCE
──────────────
created with new
belongs to one object
uses this → instance
has individual state


STATIC
──────────────
belongs to class
doesn't require new
class-level state/behavior
```

Or:

```text
account1.balance
account2.balance
account3.balance

        vs.

BankAccount.accountCount
```

Three accounts → three balances.

Three accounts → **one account count**.

---

# Practice Exercise

Build:

```text
class Employee
```

### Instance members

Each employee should have:

```text
id
name
salary
```

and:

```text
increaseSalary(amount)
getSalary()
```

### Static members

The class should track:

```text
totalEmployees
```

Every time an employee is created, increment it.

Then add:

```text
static getTotalEmployees()
```

Test:

```text
const employee1 = new Employee(...);
const employee2 = new Employee(...);
const employee3 = new Employee(...);

employee1.increaseSalary(...);

console.log(employee1.getSalary());

console.log(Employee.getTotalEmployees());
```

You should be able to explain why:

```text
employee1.getSalary()
```

is instance-level, while:

```text
Employee.getTotalEmployees()
```

is class-level.

---

# Checkpoint

Our OOP progress is now:

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
✓ static fields
✓ static methods
✓ Class-level vs instance-level members
```

### Next: `readonly` and Immutability

We'll treat this as a separate topic rather than mixing it into access modifiers. We'll go deeply into **what `readonly` actually guarantees, why it is not the same as immutability, shallow vs deep immutability, references and arrays/objects, and how these concepts matter when designing domain objects and dependencies in your backend architecture**.