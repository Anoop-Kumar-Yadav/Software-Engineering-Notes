# TypeScript OOP — Lesson 11: Inheritance

Now we move to **inheritance**.

Inheritance is one of the classic pillars of OOP, but for backend architecture it is especially important to understand **when not to use it**. We will first learn the mechanism properly, then later compare it with composition.

The central idea is:

> **Inheritance allows one class to derive from another class and reuse/extend its structure and behavior.**

---

# 1. Start With the `is-a` Relationship

Suppose we have:

```text
Animal
```

and:

```text
Dog
Cat
```

A dog **is an animal**.

A cat **is an animal**.

That gives us:

```text
Animal
  │
  ├── Dog
  └── Cat
```

This is the classic use case for inheritance.

In TypeScript:

```ts
class Animal {
  eat(): void {
    console.log('Animal is eating');
  }
}

class Dog extends Animal {
  bark(): void {
    console.log('Dog is barking');
  }
}
```

`Dog` inherits from `Animal`.

---

# 2. `extends`

The keyword responsible for class inheritance is:

```ts
extends
```

Example:

```ts
class Dog extends Animal {
}
```

This means:

> `Dog` derives from `Animal`.

Conceptually:

```text
Animal
   ↑
   │ extends
   │
  Dog
```

The child class gets access to inherited members.

---

# 3. Using the Inherited Method

Consider:

```ts
class Animal {
  eat(): void {
    console.log('Eating');
  }
}

class Dog extends Animal {
  bark(): void {
    console.log('Barking');
  }
}
```

Create:

```ts
const dog = new Dog();
```

You can call:

```ts
dog.eat();
dog.bark();
```

`bark()` comes from `Dog`.

`eat()` comes from `Animal`.

Conceptually:

```text
Dog object
│
├── inherited behavior
│   └── eat()
│
└── own behavior
    └── bark()
```

This is the basic mechanism of inheritance.

---

# 4. Why Inheritance Exists

Inheritance primarily allows a class to:

```text
reuse behavior
specialize behavior
extend behavior
```

Suppose:

```ts
class Vehicle {
  start(): void {
    console.log('Vehicle started');
  }
}
```

Then:

```ts
class Car extends Vehicle {
  drive(): void {
    console.log('Car driving');
  }
}
```

A car gets the general vehicle behavior and adds specialized behavior.

```text
Vehicle
│
└── start()

     ↓ inherited

Car
├── start()
└── drive()
```

---

# 5. Parent and Child Terminology

You will see several terms for the same relationship.

```text
Parent class
Base class
Superclass
```

and:

```text
Child class
Derived class
Subclass
```

For:

```ts
class Dog extends Animal {}
```

we have:

```text
Animal
→ parent / base / superclass

Dog
→ child / derived / subclass
```

All describe the same inheritance relationship.

---

# 6. Constructor Inheritance

Now consider:

```ts
class Animal {
  constructor(
    public name: string,
  ) {}
}
```

If `Dog` extends `Animal`:

```ts
class Dog extends Animal {
}
```

then:

```ts
const dog = new Dog('Bruno');
```

The derived class must follow JavaScript's class initialization rules. If the child has **no constructor**, the base constructor can be invoked through the derived construction process.

But when the child defines its own constructor, something important happens.

---

# 7. `super()`

Consider:

```ts
class Animal {
  constructor(
    public name: string,
  ) {}
}

class Dog extends Animal {
  constructor(
    name: string,
    public breed: string,
  ) {
    super(name);
  }
}
```

The:

```ts
super(name);
```

calls the parent class constructor.

Conceptually:

```text
new Dog(...)
     │
     ▼
Dog constructor
     │
     ▼
super(name)
     │
     ▼
Animal constructor
     │
     ▼
name initialized
```

Then `Dog` initializes:

```text
breed
```

---

# 8. Why Is `super()` Required?

A derived class cannot use its instance `this` before the parent class has been initialized.

For example:

```ts
class Animal {
  constructor(
    public name: string,
  ) {}
}

class Dog extends Animal {
  constructor(
    name: string,
    public breed: string,
  ) {
    this.breed = breed;
    super(name);
  }
}
```

This is invalid.

The parent portion of the object must be initialized first.

Therefore:

```ts
super(name);
```

comes before using `this`.

Conceptually:

```text
Parent initialization
        ↓
this becomes usable
        ↓
Child initialization
```

---

# 9. What Is `super`?

`super` has two major uses in inheritance.

### Call parent constructor

```ts
super(name);
```

### Access parent methods

```ts
super.someMethod();
```

For example:

```ts
class Animal {
  speak(): void {
    console.log('Animal sound');
  }
}

class Dog extends Animal {
  speak(): void {
    super.speak();

    console.log('Woof');
  }
}
```

Calling:

```ts
const dog = new Dog();

dog.speak();
```

produces conceptually:

```text
Animal sound
Woof
```

The child extends the parent's behavior.

---

# 10. Method Overriding

A child class can provide a different implementation of an inherited method.

Example:

```ts
class Animal {
  speak(): void {
    console.log('Some animal sound');
  }
}

class Dog extends Animal {
  speak(): void {
    console.log('Woof');
  }
}
```

Now:

```ts
const dog = new Dog();

dog.speak();
```

uses:

```text
Dog.speak()
```

rather than:

```text
Animal.speak()
```

This is called **method overriding**.

---

# 11. Why Override a Method?

Because the child may require specialized behavior.

Example:

```text
Animal
└── speak()

Dog
└── speak() → Woof

Cat
└── speak() → Meow
```

The common abstraction is:

```text
speak()
```

but each subtype provides its own behavior.

This leads directly to **polymorphism**, which we'll study separately.

---

# 12. Parent Reference, Child Object

Now something important happens.

Consider:

```ts
class Animal {
  speak(): void {
    console.log('Animal sound');
  }
}

class Dog extends Animal {
  speak(): void {
    console.log('Woof');
  }
}
```

We can write:

```ts
const animal: Animal = new Dog();
```

Read this carefully:

```text
variable type
     ↓
Animal

actual object
     ↓
Dog
```

This is allowed because a `Dog` **is an Animal**.

Then:

```ts
animal.speak();
```

calls:

```text
Dog.speak()
```

not `Animal.speak()`.

That behavior is a central part of polymorphism.

Again, don't study polymorphism yet. Just recognize what inheritance enables.

---

# 13. Protected Members Become Relevant

Remember our previous lesson on:

```text
protected
```

Now you can see why it exists.

```ts
class Animal {
  protected age: number;

  constructor(age: number) {
    this.age = age;
  }
}

class Dog extends Animal {
  showAge(): void {
    console.log(this.age);
  }
}
```

`Dog` can access:

```ts
this.age
```

because `age` is protected.

But outside:

```ts
const dog = new Dog(5);

dog.age;
```

is not allowed.

So:

```text
private
↓
class only

protected
↓
class + subclasses
```

This is the main reason `protected` exists.

---

# 14. Private Members and Inheritance

Now compare:

```ts
class Animal {
  private age: number;

  constructor(age: number) {
    this.age = age;
  }
}

class Dog extends Animal {
  showAge(): void {
    console.log(this.age);
  }
}
```

This does **not** work.

Why?

Because `age` belongs to the private implementation of `Animal`.

The child class does not have direct access.

```text
Animal
└── private age
      ✗
      │
      Dog
```

If the parent intentionally wants subclasses to access a member, it can use:

```ts
protected age
```

But `protected` should not be used casually.

---

# 15. Inheritance Creates a Strong Relationship

This is one of the most important architectural points.

When:

```ts
class Dog extends Animal
```

you aren't merely reusing some code.

You're saying:

> **Dog is a specialized form of Animal.**

Therefore Dog becomes coupled to assumptions in Animal.

Conceptually:

```text
Animal
  │
  │ strong dependency
  ▼
Dog
```

Changes to the parent can potentially affect the child.

This is why inheritance can become dangerous when used merely for code reuse.

---

# 16. Don't Use Inheritance Just to Reuse Code

Suppose you have:

```text
UserService
PaymentService
EmailService
```

and all three have:

```text
logger
```

A beginner might create:

```ts
class BaseService {
  protected logger: Logger;
}
```

then:

```ts
class UserService extends BaseService {}
class PaymentService extends BaseService {}
class EmailService extends BaseService {}
```

This may compile.

But ask:

> Is `UserService` a `BaseService`?

Usually there isn't a meaningful domain relationship.

The services simply **need a logger**.

That's composition.

Better:

```ts
class UserService {
  constructor(
    private readonly logger: Logger,
  ) {}
}
```

and similarly for the others.

```text
UserService ───┐
               │
PaymentService ├── has → Logger
               │
EmailService ──┘
```

This is generally more flexible.

---

# 17. Inheritance vs Composition

Now compare them directly.

### Inheritance

```text
Dog
 │
 └── is-a → Animal
```

### Composition

```text
Car
 │
 └── has-a → Engine
```

Use inheritance when the relationship is genuinely:

```text
is-a
```

Use composition when the relationship is:

```text
has-a
uses-a
depends-on
```

This distinction will become increasingly important as we design your backend.

---

# 18. Real Example Where Inheritance Makes Sense

Suppose we have application errors.

A generic error:

```ts
class AppError extends Error {
  constructor(
    message: string,
  ) {
    super(message);
  }
}
```

Then specialized errors:

```ts
class NotFoundError extends AppError {
  constructor(message: string) {
    super(message);
  }
}
```

and:

```ts
class ValidationError extends AppError {
  constructor(message: string) {
    super(message);
  }
}
```

This relationship makes semantic sense:

```text
Error
  │
  ▼
AppError
  │
  ├── NotFoundError
  └── ValidationError
```

A `NotFoundError` **is an** `AppError`.

That's a reasonable inheritance hierarchy.

---

# 19. Another Good Example: Domain States

Sometimes inheritance can model a real type hierarchy.

For example:

```text
Payment
   │
   ├── CardPayment
   ├── BankTransferPayment
   └── WalletPayment
```

If these truly share a common abstraction and have meaningful specialized behavior, inheritance may be appropriate.

But don't create such a hierarchy simply because:

```text
"These classes have some duplicate code."
```

Code duplication alone isn't enough justification.

---

# 20. The Cost of Deep Inheritance

Imagine:

```text
BaseEntity
   ↓
BaseAuditableEntity
   ↓
BaseUserEntity
   ↓
BaseAdminUserEntity
   ↓
SuperAdminUser
```

Now understanding:

```text
SuperAdminUser
```

requires understanding every parent.

```text
SuperAdminUser
      │
      ▼
BaseAdminUserEntity
      │
      ▼
BaseUserEntity
      │
      ▼
BaseAuditableEntity
      │
      ▼
BaseEntity
```

This can become difficult to maintain.

Deep inheritance creates **implicit behavior and coupling**.

Composition often produces flatter dependency graphs:

```text
SuperAdmin
 ├── UserIdentity
 ├── Permissions
 ├── AuditLogger
 └── Repository
```

Each relationship is explicit.

---

# 21. Inheritance and Constructors

Let's make the constructor relationship completely clear.

```ts
class Person {
  constructor(
    public name: string,
  ) {}
}

class Employee extends Person {
  constructor(
    name: string,
    public employeeId: string,
  ) {
    super(name);
  }
}
```

Creating:

```ts
const employee = new Employee(
  'Anoop',
  'EMP001',
);
```

Conceptually:

```text
new Employee()
      │
      ▼
Employee constructor
      │
      ├── super('Anoop')
      │       │
      │       ▼
      │    Person constructor
      │       │
      │       └── name initialized
      │
      └── employeeId initialized
```

Final object conceptually has:

```text
Employee
├── name
└── employeeId
```

---

# 22. Inheritance and `super.method()`

Suppose:

```ts
class Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

class AdvancedLogger extends Logger {
  log(message: string): void {
    super.log(message);
    console.log('Additional processing');
  }
}
```

Now:

```ts
const logger = new AdvancedLogger();

logger.log('Hello');
```

The child calls the parent's implementation:

```text
AdvancedLogger.log()
       │
       ├── super.log()
       │       ↓
       │    Logger.log()
       │
       └── additional behavior
```

This is useful when the child wants to **extend** rather than completely replace the parent's behavior.

---

# 23. `extends` vs `implements`

You have now seen both.

### `extends`

Used for **class inheritance**:

```ts
class Dog extends Animal {}
```

Meaning:

```text
Dog is an Animal
```

### `implements`

Used for satisfying an **interface contract**:

```ts
class MongoRepository
  implements UrlRepository {}
```

Meaning:

```text
MongoRepository satisfies
the UrlRepository contract
```

These are fundamentally different relationships.

```text
extends
↓
inheritance

implements
↓
contract satisfaction
```

A class can do both:

```ts
class MongoUserRepository
  extends BaseRepository
  implements UserRepository {
}
```

But don't use this combination just because TypeScript permits it. Each relationship should have a meaningful reason.

---

# 24. Inheritance in Your Architecture

You will occasionally see inheritance in infrastructure code.

For example:

```text
AppError
   │
   ├── ValidationError
   ├── NotFoundError
   └── ConflictError
```

That's reasonable because these are specialized error types.

But for your main dependency architecture:

```text
UseCase
Repository
Controller
Generator
Client
```

**composition + interfaces** will generally be much more important than inheritance.

For example:

```text
CreateShortenedUrl
├── UrlRepository
├── IdGenerator
└── ShortCodeGenerator
```

This should not become:

```text
CreateShortenedUrl
       ↓ extends
BaseUseCase
       ↓ extends
BaseService
```

unless those inheritance relationships have genuine semantic meaning.

---

# 25. The Mental Model

When you see:

```ts
class B extends A
```

think:

```text
B is a specialized A
```

Then ask:

> **Can I honestly say "B is an A"?**

If yes, inheritance might make sense.

If instead the statement is:

```text
B uses A
B has A
B depends on A
B delegates to A
```

then you're probably looking at **composition**.

---

# 26. What We Learned

The inheritance chain is:

```text
extends
   ↓
child derives from parent
   ↓
inherits members
   ↓
can add behavior
   ↓
can override behavior
   ↓
can call parent behavior with super
```

And the relationship is:

```text
Inheritance
    ↓
IS-A

Composition
    ↓
HAS-A / USES-A
```

The most important architectural lesson is:

> **Inheritance is a powerful mechanism, but it creates a strong coupling between parent and child. Use it for genuine type specialization, not merely as a code-reuse shortcut.**

---

# Practice Exercise

Build this hierarchy:

```text
Employee
   │
   ├── Developer
   └── Manager
```

### `Employee`

Should have:

```text
name
employeeId
```

and:

```text
describeRole()
```

### `Developer`

Should add:

```text
programmingLanguage
```

and override:

```text
describeRole()
```

### `Manager`

Should add:

```text
teamSize
```

and override:

```text
describeRole()
```

Use:

```text
extends
super()
```

where appropriate.

Then create:

```text
Developer
Manager
```

objects and call:

```text
describeRole()
```

The goal is not just to make it compile. Be able to explain:

```text
Employee
   ↑
   │
Developer

Developer is an Employee
```

and why this relationship is different from:

```text
Developer
   │
   └── has → Logger
```

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
✓ super.method()
✓ Method overriding
✓ Inheritance vs composition
✓ Is-a vs has-a
```

## Next: Polymorphism

This is the next natural concept because inheritance has now given us the mechanism:

```text
Parent type
    ↓
Child implementations
```

Next we'll learn how **one interface/type can represent many different concrete objects**, why:

```ts
const animal: Animal = new Dog();
```

can call `Dog`'s implementation, and how this same principle becomes the core of your:

```text
UrlRepository
   ├── MongoUrlRepository
   └── InMemoryUrlRepository

UserClient
   ├── LocalUserClient
   └── HttpUserClient
```

architecture.