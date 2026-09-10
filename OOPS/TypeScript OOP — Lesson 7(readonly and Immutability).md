# TypeScript OOP — Lesson 7: `readonly` and Immutability

We now move to one focused concept: **`readonly` and the idea of immutability**.

This topic is particularly important in TypeScript backend development because you'll frequently see code like:

```ts
constructor(
  private readonly repository: UrlRepository,
) {}
```

and:

```ts
constructor(
  public readonly id: string,
) {}
```

It is easy to see `readonly` everywhere and assume it simply means "constant." That's not quite correct. We need to understand **what it guarantees, what it doesn't guarantee, and why experienced TypeScript developers use it so heavily**.

---

# 1. What Does `readonly` Mean?

`readonly` tells TypeScript:

> **This property cannot be reassigned after it has been initialized.**

Example:

```ts
class User {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }
}
```

Create an object:

```ts
const user = new User('user-001');
```

This is valid:

```ts
console.log(user.id);
```

But this is not:

```ts
user.id = 'user-002';
```

TypeScript reports an error because `id` is readonly.

The basic model is:

```text
readonly property
       │
       ├── can read ✓
       └── reassign ✗
```

---

# 2. Why Would We Want This?

Consider an entity identifier.

```text
User
└── id
```

Once the user has been created, changing its identity would be problematic.

You don't want:

```ts
user.id = 'another-user';
```

So:

```ts
class User {
  constructor(
    public readonly id: string,
    public name: string,
  ) {}
}
```

Now:

```text
id
↓
initialized during construction
↓
cannot be reassigned
```

while:

```text
name
↓
can change
```

This allows the type system to express an important design decision.

---

# 3. `readonly` Is Not the Same as `const`

This distinction is fundamental.

`const` applies to a **variable binding**:

```ts
const user = new User('user-1');
```

It means:

```ts
user = anotherUser;
```

isn't allowed.

But the object itself can still be modified:

```ts
user.name = 'Rahul';
```

assuming `name` isn't readonly.

On the other hand:

```ts
class User {
  constructor(
    public readonly id: string,
  ) {}
}
```

protects the **property**.

So:

```text
const
↓
variable cannot point to another value

readonly
↓
property cannot be reassigned
```

These are different concepts.

---

# 4. `const` Does Not Make an Object Immutable

This is a common misconception.

```ts
const user = {
  name: 'Anoop',
};
```

You cannot do:

```ts
user = {
  name: 'Rahul',
};
```

But you can do:

```ts
user.name = 'Rahul';
```

Why?

Because:

```text
const user
     │
     ▼
reference ───────► object
```

`const` protects the **reference binding**, not the object's internal properties.

This distinction becomes extremely important when working with JavaScript objects.

---

# 5. `readonly` Works on Properties

Example:

```ts
class Product {
  readonly id: string;
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

Allowed:

```ts
product.name = 'Mechanical Keyboard';
product.price = 1200;
```

Not allowed:

```ts
product.id = 'p-002';
```

So `readonly` lets us make **specific properties immutable with respect to reassignment**.

---

# 6. `readonly` and Constructors

A readonly property must still be initialized.

For example:

```ts
class User {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }
}
```

This is valid.

The constructor is allowed to establish the initial value.

Conceptually:

```text
Object creation
      ↓
constructor
      ↓
initialize readonly property
      ↓
property becomes non-reassignable
```

That's why this pattern is common:

```ts
class User {
  constructor(
    public readonly id: string,
  ) {}
}
```

---

# 7. `readonly` Dependencies

Now we reach a very important backend pattern.

Consider:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
  ) {}

  async execute() {
    return this.repository.create(/* ... */);
  }
}
```

Why:

```ts
private readonly repository
```

instead of:

```ts
private repository
```

Because the use case should not suddenly switch repositories after construction.

You want:

```text
CreateShortenedUrl
       │
       └── repository
             │
             └── fixed dependency
```

The dependency is established during construction and remains the same for the lifetime of that object.

This makes the object easier to reason about.

---

# 8. `readonly` Does Not Mean Deep Immutability

This is the most important technical caveat.

Consider:

```ts
class User {
  constructor(
    public readonly roles: string[],
  ) {}
}
```

You cannot do:

```ts
user.roles = [];
```

But you can potentially do:

```ts
user.roles.push('admin');
```

Why?

Because `readonly` protects the **property assignment**:

```text
user.roles = anotherArray
```

It does not automatically freeze the array's contents.

Conceptually:

```text
readonly roles
      │
      ▼
reference cannot change
      │
      ▼
same array
      │
      ├── push() ✓
      ├── pop() ✓
      └── mutation ✓
```

Therefore:

> **`readonly` is generally shallow, not deep.**

---

# 9. References Explain This

To understand this properly, you need a basic reference model.

Consider:

```ts
const roles = ['user'];
```

Conceptually:

```text
roles
  │
  │ reference
  ▼
┌─────────────┐
│ ['user']    │
└─────────────┘
```

Now:

```ts
class User {
  constructor(
    public readonly roles: string[],
  ) {}
}
```

The property holds a reference to that array.

```text
User
└── roles ───────────────┐
                         │
                         ▼
                    ┌───────────┐
                    │ ['user']  │
                    └───────────┘
```

`readonly` prevents:

```ts
user.roles = anotherArray;
```

But the array itself remains mutable:

```ts
user.roles.push('admin');
```

The reference hasn't changed.

The object that the reference points to has changed.

---

# 10. Readonly Arrays

TypeScript provides a stronger type for arrays:

```ts
readonly string[]
```

For example:

```ts
class User {
  constructor(
    public readonly roles: readonly string[],
  ) {}
}
```

Now:

```ts
user.roles.push('admin');
```

is rejected by TypeScript.

The array cannot be mutated through that reference.

You can still read:

```ts
console.log(user.roles);
console.log(user.roles.length);
```

But mutation methods aren't available.

This gives us:

```text
readonly property
+
readonly array
```

which is stronger than just:

```text
readonly property
```

---

# 11. `Readonly<T>`

TypeScript also provides a utility type:

```ts
Readonly<T>
```

Example:

```ts
interface UserData {
  id: string;
  name: string;
  email: string;
}

type ReadonlyUser = Readonly<UserData>;
```

Now:

```ts
const user: ReadonlyUser = {
  id: 'user-1',
  name: 'Anoop',
  email: 'anoop@example.com',
};
```

This isn't allowed:

```ts
user.name = 'Rahul';
```

because the properties are readonly.

Again, this is primarily a **type-level restriction**.

---

# 12. `readonly` Is Mostly Compile-Time Protection

This is an important TypeScript-specific concept.

Consider:

```ts
class User {
  constructor(
    public readonly id: string,
  ) {}
}
```

TypeScript prevents:

```ts
user.id = 'new-id';
```

during type checking.

But TypeScript's `readonly` is not equivalent to:

```ts
Object.freeze(...)
```

It doesn't automatically make the JavaScript object physically immutable at runtime.

Conceptually:

```text
TypeScript source
       │
       ▼
readonly
       │
       ▼
compile-time restriction
       │
       ▼
JavaScript runtime
```

The JavaScript runtime itself doesn't have a `readonly` property modifier in the same sense.

---

# 13. Runtime Immutability

JavaScript provides mechanisms such as:

```ts
Object.freeze()
```

For example:

```ts
const user = Object.freeze({
  id: 'user-1',
  name: 'Anoop',
});
```

The runtime behavior is different from merely using TypeScript's `readonly`.

But don't jump to the conclusion that you should freeze every object.

Runtime immutability has trade-offs, and TypeScript's type-level readonly is often sufficient for many application designs.

The important distinction is:

```text
readonly
→ compile-time guarantee

Object.freeze()
→ runtime freezing behavior
```

---

# 14. Immutable vs Mutable Objects

A **mutable object** can change after creation.

```text
User
├── name = Anoop
       ↓
     Rahul
```

An **immutable object** is designed so its state does not change after creation.

Instead of:

```ts
user.name = 'Rahul';
```

you might create a new object:

```ts
const updatedUser = {
  ...user,
  name: 'Rahul',
};
```

Conceptually:

```text
Original User
     │
     │ unchanged
     ▼
New User
     │
     └── modified state
```

This can make state transitions easier to reason about, especially in certain architectures.

But immutability isn't automatically better for every object.

---

# 15. Mutable Domain Object

Suppose an order changes state.

```ts
class Order {
  private status: string = 'PENDING';

  ship(): void {
    this.status = 'SHIPPED';
  }
}
```

The object is intentionally mutable.

```text
Order
PENDING
   │
   │ ship()
   ▼
SHIPPED
```

That can be perfectly valid OOP.

So:

> **`readonly` does not mean every object should be immutable.**

Instead, make individual pieces immutable when changing them would violate your design.

---

# 16. Our URL Shortener Example

Consider:

```ts
class ShortenedUrl {
  constructor(
    public readonly id: string,
    public readonly shortCode: string,
    public readonly originalUrl: string,
    public readonly createdAt: Date,
  ) {}
}
```

We might reasonably want:

```text
id
shortCode
createdAt
```

to remain fixed.

But perhaps some state can change:

```text
expiresAt
status
```

depending on the domain design.

So you could conceptually have:

```text
ShortenedUrl
│
├── immutable identity
│   ├── id
│   ├── shortCode
│   └── createdAt
│
└── controlled mutable state
    └── expiresAt
```

This gives you a much more precise model than simply making everything readonly.

---

# 17. `readonly` and Encapsulation Work Together

Remember our previous lesson:

```text
Encapsulation
```

controls **how state is accessed and modified**.

`readonly` gives additional restrictions on **reassignment**.

For example:

```ts
class User {
  constructor(
    public readonly id: string,
    private name: string,
  ) {}

  rename(newName: string): void {
    this.name = newName;
  }

  getName(): string {
    return this.name;
  }
}
```

Here:

```text
id
↓
readonly
↓
cannot be reassigned
```

while:

```text
name
↓
private
↓
controlled through rename()
```

So they solve different problems.

---

# 18. `private readonly` — Very Important Combination

You'll see this constantly in professional TypeScript backend code:

```ts
class UserRepository {
  constructor(
    private readonly database: Database,
  ) {}
}
```

Let's break it down.

### `private`

Outside code cannot access:

```ts
repository.database
```

### `readonly`

The repository cannot replace:

```ts
this.database
```

after initialization.

Therefore:

```text
private readonly database
        │       │
        │       └── cannot reassign
        │
        └── cannot access externally
```

This is an excellent default for injected dependencies.

---

# 19. Why This Is Important for Our Architecture

Remember our composition root:

```text
wire.ts
   │
   ├── creates MongoRepository
   │
   ├── creates generators
   │
   └── creates CreateShortenedUrl
```

Then:

```ts
const useCase = new CreateShortenedUrl(
  repository,
  idGenerator,
  shortCodeGenerator,
);
```

Inside:

```ts
class CreateShortenedUrl {
  constructor(
    private readonly repository: UrlRepository,
    private readonly idGenerator: IdGenerator,
    private readonly shortCodeGenerator: ShortCodeGenerator,
  ) {}
}
```

The use case now has a stable dependency configuration.

```text
CreateShortenedUrl
├── private readonly repository
├── private readonly idGenerator
└── private readonly shortCodeGenerator
```

That is a direct application of today's concept.

---

# 20. A Critical TypeScript Detail

Consider:

```ts
class User {
  constructor(
    public readonly id: string,
  ) {}
}
```

This prevents:

```ts
user.id = 'new-id';
```

But it doesn't mean the entire `User` object is frozen.

For example:

```ts
class User {
  constructor(
    public readonly profile: {
      name: string;
    },
  ) {}
}
```

You cannot:

```ts
user.profile = anotherProfile;
```

but you can potentially:

```ts
user.profile.name = 'Rahul';
```

Again:

```text
readonly property
       ↓
protects property reference/value assignment

not automatically
       ↓
everything reachable through that property
```

This is the essence of **shallow readonly**.

---

# 21. The Mental Model to Keep

Don't memorize `readonly` as:

> "This thing can never change."

Instead remember:

> **"This property cannot be reassigned through this reference after initialization."**

That wording is much more accurate.

For:

```ts
public readonly id: string
```

think:

```text
id ─────────► "user-1"
│
└── cannot point somewhere else
```

For:

```ts
public readonly roles: string[]
```

think:

```text
roles ──────► Array
                │
                ├── contents may still mutate
                └── reference cannot be reassigned
```

For:

```ts
public readonly roles: readonly string[]
```

think:

```text
roles ──────► Array
                │
                └── mutation through this reference is restricted
```

That distinction is the important part.

---

# 22. What You Should Remember

The hierarchy is:

```text
const
│
└── protects variable binding


readonly
│
└── protects property reassignment


readonly array / Readonly<T>
│
└── provides stronger type-level
    restrictions on contained structure


Object.freeze()
│
└── runtime freezing behavior
```

And in our backend architecture:

```text
private readonly dependency
        │
        ├── private
        │    → hide implementation detail
        │
        └── readonly
             → don't replace dependency
```

This combination will appear constantly in the architecture we'll eventually build.

---

# Practice Exercise

Create this class:

```text
Product
```

with:

```text
id
name
price
tags
```

Design the properties so that:

1. `id` cannot be reassigned.
    
2. `name` can be changed.
    
3. `price` can be changed.
    
4. `tags` cannot be replaced with another array.
    
5. `tags` also cannot be mutated through the public property.
    

Then add:

```text
rename()
changePrice()
getTags()
```

Think carefully about the difference between:

```text
readonly
```

and:

```text
readonly string[]
```

Don't introduce interfaces, inheritance, getters/setters, or other new OOP concepts yet. **The goal is only to make `readonly` and immutability intuitive.**

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
✓ readonly
✓ const vs readonly
✓ Shallow readonly
✓ readonly arrays
✓ Readonly<T>
✓ Compile-time vs runtime immutability
```

**Next single topic: Interfaces.**

This is a major lesson for our architecture because interfaces are what allow us to say:

```text
"I don't care WHICH implementation you give me.
I only care that it satisfies this contract."
```

That idea is the foundation for our **repository ports, service ports, module clients, dependency inversion, and eventually the Local → HTTP adapter swap**.