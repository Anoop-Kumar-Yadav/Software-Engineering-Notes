# TypeScript OOP — Lesson 4: Access Modifiers (`public`, `private`, `protected`)

So far, our objects can hold state and expose behavior. But they have one major weakness: any code can freely modify their internal data.

Access modifiers solve this by answering a single question:

> Who is allowed to access or modify a class member?

This lesson is one of the most important in OOP because it introduces the foundation of encapsulation.

# 1. The Problem Without Access Control

Let's begin with a simple bank account.

TypeScript

```
class BankAccount {
  accountNumber: string;
  owner: string;
  balance: number;

  constructor(
    accountNumber: string,
    owner: string,
    balance: number,
  ) {
    this.accountNumber = accountNumber;
    this.owner = owner;
    this.balance = balance;
  }
}
```

Create an object:

TypeScript

```
const account = new BankAccount(
  'ACC001',
  'Anoop',
  5000,
);
```

Now anyone can do this:

TypeScript

```
account.balance = -1000000;
account.owner = 'Someone Else';
```

Nothing prevents it.

The object has state, but it has no protection.

Conceptually:

```
Outside Code
     │
     ├── account.balance = -1000000
     ├── account.owner = "Hack"
     └── account.accountNumber = "XYZ"
           │
           ▼
      BankAccount
```

This is dangerous because the object cannot enforce its own rules.

# 2. What Are Access Modifiers?

TypeScript provides three access levels.

|  
Modifier

|

Same Class

|

Outside Class

|

Child Class

|  
| --- | --- | --- | --- |  
|

`public`

|

✅

|

✅

|

✅

|  
|

`private`

|

✅

|

❌

|

❌

|  
|

`protected`

|

✅

|

❌

|

✅

|

Think of them as visibility rules.

```
                Class Member
                     │
      ┌──────────────┼──────────────┐
      │              │              │
   public        private      protected
```

We'll study each individually.

# 3. `public` — Accessible Everywhere

This is the default in TypeScript.

TypeScript

```
class User {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }
}
```

Usage:

TypeScript

```
const user = new User('Anoop');

console.log(user.name);

user.name = 'Rahul';
```

Everything works.

Even if you omit `public`:

TypeScript

```
class User {
  name: string;
}
```

it is treated as public.

So these are equivalent:

TypeScript

```
name: string;
```

and

TypeScript

```
public name: string;
```

### When should you use `public`?

Use it when external code is intended to access or modify that member.

Examples:

```
DTO fields
Response models
Configuration objects
Simple data containers
```

But don't make everything public by default.

# 4. `private` — Only the Class Can Access It

Now let's redesign `BankAccount`.

TypeScript

```
class BankAccount {
  private balance: number;

  constructor(balance: number) {
    this.balance = balance;
  }
}
```

Create an account:

TypeScript

```
const account = new BankAccount(5000);
```

Now this is illegal:

TypeScript

```
console.log(account.balance);
```

TypeScript error:

```
Property 'balance' is private.
```

The only code allowed to touch `balance` is inside the class.

```
BankAccount
├── private balance
│
├── deposit()
├── withdraw()
└── getBalance()
```

Outside code cannot directly access it.

# 5. Why Is `private` Useful?

Imagine ATM software.

Without private:

TypeScript

```
account.balance = 1000000;
```

Any developer could accidentally bypass business rules.

With private:

TypeScript

```
class BankAccount {
  private balance: number;

  constructor(balance: number) {
    this.balance = balance;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }

  getBalance(): number {
    return this.balance;
  }
}
```

Now the only way to change balance is:

TypeScript

```
account.deposit(500);
```

The object controls its own state.

Conceptually:

```
Outside
   │
   │ deposit(500)
   ▼
BankAccount
   │
   └── private balance updated
```

Instead of:

```
Outside
   │
   └── balance = anything
```

This is the beginning of encapsulation.

# 6. Reading Private Data

Private doesn't mean inaccessible forever.

It means:

> Only the class decides how it is exposed.

Example:

TypeScript

```
class BankAccount {
  private balance: number;

  constructor(balance: number) {
    this.balance = balance;
  }

  getBalance(): number {
    return this.balance;
  }
}
```

Usage:

TypeScript

```
const account = new BankAccount(5000);

console.log(account.getBalance());
```

Notice the difference.

Illegal:

TypeScript

```
account.balance;
```

Legal:

TypeScript

```
account.getBalance();
```

The object exposes behavior, not its internal implementation.

# 7. Modifying Private Data

Instead of allowing:

TypeScript

```
account.balance += 1000;
```

we expose controlled behavior:

TypeScript

```
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
}
```

Now every balance change passes through a method.

Later we'll add validation.

# 8. Real Business Rule Example

Suppose withdrawals cannot exceed the available balance.

TypeScript

```
class BankAccount {
  private balance: number;

  constructor(balance: number) {
    this.balance = balance;
  }

  withdraw(amount: number): void {
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

Now this:

TypeScript

```
const account = new BankAccount(5000);

account.withdraw(7000);
```

throws an error.

If balance were public:

TypeScript

```
account.balance -= 7000;
```

the rule could be bypassed.

This is why private protects business invariants.

# 9. `protected` — For Inheritance

We'll study inheritance later, but you should understand what `protected` means now.

Consider:

TypeScript

```
class Employee {
  protected salary: number;

  constructor(salary: number) {
    this.salary = salary;
  }
}
```

Now create a child class:

TypeScript

```
class Manager extends Employee {
  getSalary(): number {
    return this.salary;
  }
}
```

This works because `salary` is protected.

But outside:

TypeScript

```
const manager = new Manager(50000);

manager.salary;
```

is illegal.

Think of it like:

```
Employee
│
├── protected salary
│
└──────────────┐
               │
               ▼
           Manager
           can access
```

Protected means:

> Visible inside the class and its children, but hidden from outside code.

We'll revisit this in the inheritance lesson.

# 10. Visual Comparison

Let's compare all three.

### Public

TypeScript

```
class User {
  public name = 'Anoop';
}

Outside
   │
   ├── read ✓
   └── write ✓
```

### Private

TypeScript

```
class User {
  private password = '123';
}

Outside
   │
   ├── read ✗
   └── write ✗

Inside class
   │
   ├── read ✓
   └── write ✓
```

### Protected

TypeScript

```
class User {
  protected role = 'Admin';
}

Outside
   │
   ├── read ✗
   └── write ✗

Child class
   │
   ├── read ✓
   └── write ✓
```

# 11. Constructor Parameter Modifiers

You've already seen this syntax:

TypeScript

```
class Product {
  constructor(
    public id: string,
    public name: string,
    private price: number,
  ) {}
}
```

This is simply shorthand.

Equivalent to:

TypeScript

```
class Product {
  public id: string;
  public name: string;
  private price: number;

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

The modifier both:

1. Creates the field.
    
2. Assigns the constructor parameter.
    

This is heavily used in professional TypeScript code.

# 12. Why Most Dependencies Are `private readonly`

Remember our use case:

TypeScript

```
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
  ) {}
}
```

Why not public?

Because no external code should do:

TypeScript

```
useCase.repository = anotherRepository;
```

The repository is an internal dependency.

Conceptually:

```
CreateShortenedUrl
│
├── private repository
│
└── execute()
```

Only `execute()` uses it.

Outside code doesn't even know it exists.

This is exactly how controllers, repositories, and services are usually written.

# 13. Real Backend Example

Let's model a simplified user service.

TypeScript

```
class UserService {
  constructor(
    private readonly repository: UserRepository,
  ) {}

  async getUser(id: string) {
    return this.repository.findById(id);
  }
}
```

Notice the responsibilities.

State

```
repository
```

Behavior

```
getUser()
```

Should API routes access the repository directly?

TypeScript

```
userService.repository.findById(...);
```

No.

The repository is an implementation detail.

Routes should call:

TypeScript

```
userService.getUser(id);
```

This is another example of hiding implementation behind behavior.

# 14. Common Beginner Mistake

Avoid this:

TypeScript

```
class Order {
  public total = 0;
  public items = [];
  public status = 'PENDING';
}
```

Now anyone can write:

TypeScript

```
order.status = 'DELIVERED';
order.total = 1;
```

You've lost control.

Better design:

TypeScript

```
class Order {
  private status = 'PENDING';

  markAsDelivered(): void {
    this.status = 'DELIVERED';
  }

  getStatus(): string {
    return this.status;
  }
}
```

Now the object decides how its state changes.

This is much closer to real domain modeling.

# 15. Professional Rule of Thumb

When deciding an access modifier, ask this question:

> Should another object be allowed to touch this directly?

|  
Member

|

Modifier

|  
| --- | --- |  
|

Internal dependency (`repository`)

|

`private readonly`

|  
|

Business state (`balance`)

|

`private`

|  
|

Domain identifier (`id`)

|

`public readonly`

|  
|

DTO properties

|

`public`

|  
|

Extension point for subclasses

|

`protected`

|

Notice how this aligns with backend architecture.

For example, in your `url-service`:

TypeScript

```
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
    private readonly idGenerator: IdGenerator,
    private readonly shortCodeGenerator: ShortCodeGenerator,
  ) {}
}
```

All three dependencies are private because they're implementation details of the use case.

# 16. Summary Diagram

```
                    Access Modifiers

                 ┌─────────────────┐
                 │     Class       │
                 └─────────────────┘
                    │     │     │
          public    │ private protected
                    │     │     │
Outside Code        ✓     ✗      ✗
Same Class          ✓     ✓      ✓
Child Class         ✓     ✗      ✓
```

The key takeaway is:

- `public` → Exposed API of the object.
    
- `private` → Internal implementation details.
    
- `protected` → Shared only with subclasses.
    

This is the mechanism that enables encapsulation, which is our next lesson. There we'll go beyond syntax and learn the OOP principle of hiding state and exposing controlled behavior, using richer domain examples like `BankAccount`, `Order`, and eventually `ShortenedUrl`.