# TypeScript OOP — Lesson 13: Association, Aggregation, and Composition

We now focus on one topic: **object relationships**.

You already learned composition in the previous lesson. Here we will make the relationship model more precise by distinguishing:

```text
Association
Aggregation
Composition
```

These terms are often taught together because they answer one question:

> **How is one object related to another object, and who owns what?**

This is useful when modeling real applications because classes rarely exist in isolation.

---

# 1. Start With the Broadest Relationship: Association

**Association** simply means:

> **One object knows about or uses another object.**

There doesn't necessarily have to be ownership.

For example:

```text
Teacher ───────── Student
```

A teacher interacts with students.

A student interacts with a teacher.

But the teacher doesn't own the student's lifetime.

In code:

```ts
class Student {
  constructor(
    public readonly name: string,
  ) {}
}

class Teacher {
  teach(student: Student): void {
    console.log(
      `Teaching ${student.name}`,
    );
  }
}
```

Here:

```text
Teacher
   │
   │ uses
   ▼
Student
```

That's association.

---

# 2. Association Is Very Broad

Association can represent:

```text
uses
knows
communicates with
depends on
interacts with
references
```

For example:

```text
Customer → SupportAgent
Order → PaymentGateway
Controller → UseCase
UseCase → Repository
Billing → UserClient
```

All of these can be viewed as associations between objects.

So:

```text
Association
     ↓
general relationship
```

It doesn't tell us much about ownership.

---

# 3. Association Does Not Imply Ownership

Consider:

```ts
class Order {
  constructor(
    public readonly customer: Customer,
  ) {}
}
```

An order references a customer.

But when the order is deleted:

```text
Order deleted
```

the customer should obviously not be deleted.

So:

```text
Order ───────→ Customer
```

is an association.

The two objects have independent lifetimes.

```text
Order lifetime
     │
     └── independent

Customer lifetime
     │
     └── independent
```

This distinction becomes important when we move toward aggregation and composition.

---

# 4. Aggregation

Aggregation is a stronger relationship.

It means:

> **One object contains or groups other objects, but those objects can exist independently.**

Classic example:

```text
Department
    │
    ├── Employee
    ├── Employee
    └── Employee
```

A department has employees.

But if the department is deleted:

```text
Department deleted
```

the employees don't necessarily disappear.

They could move to another department.

Therefore:

```text
Department
    │
    ├── Employee A
    ├── Employee B
    └── Employee C
```

is commonly described as **aggregation**.

---

# 5. Aggregation in Code

```ts
class Employee {
  constructor(
    public readonly name: string,
  ) {}
}

class Department {
  constructor(
    public readonly employees: Employee[],
  ) {}
}
```

Create employees independently:

```ts
const alice = new Employee('Alice');
const bob = new Employee('Bob');
```

Then:

```ts
const engineering =
  new Department([
    alice,
    bob,
  ]);
```

Notice the lifecycle:

```text
alice
   │
   └── exists independently

bob
   │
   └── exists independently

engineering
   │
   └── groups alice + bob
```

The department doesn't necessarily own their entire lifetime.

---

# 6. Composition Is Stronger

Composition means:

> **One object owns another object's lifecycle as part of itself.**

Classic example:

```text
Order
  │
  ├── OrderItem
  ├── OrderItem
  └── OrderItem
```

An `OrderItem` usually has meaning as part of an order.

If the order disappears, its order items generally disappear with it.

```text
Order
  │
  ├── Item A
  ├── Item B
  └── Item C

Order deleted
      ↓
Items no longer exist
```

This is a stronger ownership relationship.

---

# 7. Composition Example

```ts
class OrderItem {
  constructor(
    public readonly productId: string,
    public readonly quantity: number,
  ) {}
}

class Order {
  private readonly items: OrderItem[] = [];

  addItem(
    productId: string,
    quantity: number,
  ): void {
    this.items.push(
      new OrderItem(
        productId,
        quantity,
      ),
    );
  }
}
```

Notice something important.

`Order` creates the `OrderItem`.

```text
Order
 │
 └── creates → OrderItem
```

The item belongs to the order's internal structure.

This is a strong indication of composition.

---

# 8. The Lifecycle Difference

This is the most useful way to remember these concepts.

### Association

```text
A ─────── B

A and B
have independent lifetimes
```

### Aggregation

```text
A ◇────── B

A groups B
but B can exist independently
```

### Composition

```text
A ◆────── B

A owns B
B's lifecycle depends on A
```

You may see UML notation:

```text
◇
```

for aggregation and:

```text
◆
```

for composition.

You don't need to memorize the symbols immediately. **Ownership and lifetime are more important.**

---

# 9. Real-World Comparison

Consider a university.

```text
University
   │
   └── Department
         │
         └── Employee
```

Now ask what happens when the relationships change.

### Association

```text
Student ↔ Professor
```

They interact.

Neither owns the other.

### Aggregation

```text
University ◇── Student
```

The university groups students, but students can conceptually exist independently of a particular university.

### Composition

```text
Order ◆── OrderItem
```

The item exists as part of the order.

This gives us a useful hierarchy:

```text
Association
    ↓
general relationship

Aggregation
    ↓
grouping + independent lifecycle

Composition
    ↓
ownership + dependent lifecycle
```

---

# 10. Important: Composition in OOP vs Our Previous "Composition"

There is a subtle terminology issue.

Earlier we used **composition** to mean:

```text
Object A
   │
   └── uses → Object B
```

For example:

```text
PaymentService
   │
   └── PaymentGateway
```

That is commonly called **object composition**.

Today we're discussing the more specific UML/OOP relationship:

```text
Composition
→ strong ownership/lifecycle relationship
```

So don't get confused.

The broader design principle is:

> **Compose objects from other objects.**

Within UML relationship terminology, **composition** specifically indicates strong ownership.

---

# 11. Dependency Injection Is Usually Not "Composition" in the Ownership Sense

Consider:

```ts
class UserService {
  constructor(
    private readonly repository: UserRepository,
  ) {}
}
```

This is object composition in the broad design sense:

```text
UserService
   │
   └── uses → UserRepository
```

But `UserService` does not necessarily own the repository's lifecycle in the strong UML sense.

The repository may be:

```text
created by composition root
shared by multiple services
managed by infrastructure
```

Therefore, don't automatically interpret every constructor dependency as UML composition.

This distinction is useful for architectural precision.

---

# 12. Dependency Relationships in Your Backend

Consider:

```text
Controller
    │
    ▼
UseCase
    │
    ▼
Repository
```

These are primarily **dependency relationships**.

The controller uses the use case.

The use case uses the repository.

The use case doesn't conceptually own the database connection.

So:

```text
Controller ──depends on──> UseCase

UseCase ──depends on──> Repository
```

This is more accurately understood as **association/dependency**, rather than lifecycle-owning composition.

---

# 13. Ownership Is the Key Question

Whenever you're designing classes, ask:

> **Who owns this object's lifecycle?**

Suppose:

```text
Order
 └── OrderItem
```

Ask:

> Can this `OrderItem` meaningfully exist without the `Order`?

If no:

```text
Composition
```

Suppose:

```text
Department
 └── Employee
```

Ask:

> Can the employee exist after leaving the department?

Yes.

Therefore:

```text
Aggregation
```

Suppose:

```text
Order
 ─── Customer
```

Ask:

> Can the customer exist after the order is deleted?

Obviously yes.

Therefore:

```text
Association
```

This mental process is much more useful than memorizing definitions.

---

# 14. URL Shortener Example

Let's model your URL service.

Suppose:

```text
ShortenedUrl
   │
   ├── id
   ├── shortCode
   ├── originalUrl
   └── metadata
```

If `metadata` is only meaningful as part of the shortened URL:

```text
ShortenedUrl
    │
    └── UrlMetadata
```

that could represent composition.

But suppose:

```text
ShortenedUrl
    │
    └── User
```

The URL references a user, but the user exists independently.

That's association.

```text
ShortenedUrl ─────→ User
```

The URL does not own the user's lifecycle.

---

# 15. User and Billing Example

Consider:

```text
BillingAccount
      │
      └── User
```

Whether this is aggregation or association depends on the actual domain.

If the user is an independent domain entity:

```text
User
 │
 ├── exists independently
 │
 └── may have billing account
```

then:

```text
BillingAccount ─────→ User
```

is generally an association.

The billing module should not be able to say:

```text
"Delete billing account → delete user"
```

unless the domain explicitly requires that ownership.

This is why relationship modeling isn't just about syntax.

It's about **business semantics**.

---

# 16. Composition and Encapsulation

Strong composition often goes together with encapsulation.

Consider:

```ts
class Order {
  private readonly items: OrderItem[] = [];

  addItem(
    productId: string,
    quantity: number,
  ): void {
    this.items.push(
      new OrderItem(
        productId,
        quantity,
      ),
    );
  }
}
```

The outside world can't directly manipulate the internal collection.

Instead:

```text
Order
 │
 ├── owns items
 │
 ├── creates items
 │
 └── controls item modification
```

This gives us:

```text
Composition
    +
Encapsulation
```

The object controls its internal structure.

---

# 17. Why This Matters for Domain Modeling

Suppose you expose:

```ts
class Order {
  public items: OrderItem[] = [];
}
```

Then external code can do:

```ts
order.items.push(/* ... */);
order.items.splice(/* ... */);
order.items.length = 0;
```

The order has lost control of its own invariants.

Instead:

```ts
class Order {
  private readonly items: OrderItem[] = [];

  addItem(
    productId: string,
    quantity: number,
  ): void {
    // validate rules
  }

  removeItem(
    productId: string,
  ): void {
    // validate rules
  }
}
```

Now:

```text
Order
 │
 ├── owns items
 ├── controls access
 └── protects invariants
```

This is exactly where **encapsulation + composition** become powerful.

---

# 18. Composition and Aggregation Are About Lifecycle, Not Just Arrays

Don't make this mistake:

> "If a class contains an array of another class, it's aggregation."

Not necessarily.

For example:

```ts
class Playlist {
  constructor(
    public readonly songs: Song[],
  ) {}
}
```

A playlist contains songs.

But the songs don't belong exclusively to the playlist.

They exist independently.

Therefore the conceptual relationship is closer to:

```text
Playlist
   ◇
   │
   ├── Song
   ├── Song
   └── Song
```

Aggregation.

Compare:

```text
Order
   ◆
   │
   ├── OrderItem
   └── OrderItem
```

where the items belong to the order's lifecycle.

Composition is about **ownership**, not simply containment.

---

# 19. Don't Overthink UML in Backend Code

These distinctions are useful for thinking, but you don't need to force every TypeScript relationship into a UML category.

In real backend code, you'll commonly encounter:

```text
Dependency
Association
Composition
```

and rarely need to explicitly label every relationship as "aggregation."

The important questions are:

```text
Who uses whom?
Who owns whom?
Who creates whom?
Who controls whom?
Can they exist independently?
```

Those questions lead to better design.

---

# 20. A Practical Decision Process

Whenever you're modeling two classes:

### Step 1 — Do they interact?

If no:

```text
No relationship
```

If yes:

```text
Continue
```

### Step 2 — Does A simply use B?

```text
A → B
```

That's generally a dependency/association.

### Step 3 — Does A group B while B remains independent?

```text
A ◇── B
```

Think aggregation.

### Step 4 — Does A own B's lifecycle?

```text
A ◆── B
```

Think composition.

This is the practical sequence to keep in your head.

---

# 21. Connect It to the Architecture

Your URL service may eventually look conceptually like:

```text
HTTP Request
     │
     ▼
Controller
     │
     │ depends on
     ▼
Use Case
     │
     ├── depends on → UrlRepository
     ├── depends on → IdGenerator
     └── depends on → ShortCodeGenerator
```

Those are primarily **dependencies**.

Then inside your domain:

```text
ShortenedUrl
     │
     └── owns → UrlMetadata
```

Potentially a **composition** relationship.

And:

```text
ShortenedUrl
     │
     └── references → User
```

Potentially an **association**.

The distinction depends on the domain's lifecycle rules.

---

# 22. The Important Vocabulary

You should now be comfortable with:

|Relationship|Meaning|Lifecycle|
|---|---|---|
|**Association**|Objects know/use/interact with each other|Independent|
|**Aggregation**|One object groups other objects|Parts can exist independently|
|**Composition**|One object strongly owns another|Part's lifecycle depends on owner|
|**Dependency**|One object temporarily/structurally relies on another|Usually independent|

The key distinction:

```text
Association
    ↓
"knows/uses"

Aggregation
    ↓
"has a group of"

Composition
    ↓
"owns a part of"
```

---

# 23. Mental Model

If you remember only one thing from today's lesson, remember this:

```text
A → B
```

Ask:

> **What exactly is the relationship?**

```text
A uses B
    ↓
Dependency / Association

A groups B
    ↓
Aggregation

A owns B
    ↓
Composition
```

And then ask:

> **Can B exist independently of A?**

That question often gives you the answer.

---

# Practice Exercise

Model this system:

```text
E-Commerce
├── Store
├── Product
├── Order
├── OrderItem
├── Customer
└── Payment
```

Determine the likely relationship between each pair:

```text
Store → Product
Customer → Order
Order → OrderItem
Order → Customer
Order → Payment
Product → OrderItem
```

For each, decide:

```text
Association
Aggregation
Composition
```

Then answer **why**, specifically using:

```text
ownership
lifecycle
independence
```

Don't write code yet. The goal is to train the **object-modeling thought process** before implementation.

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
✓ static
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
✓ Method overriding
✓ override
✓ Is-a vs has-a
✓ Polymorphism
✓ Interface-based polymorphism
✓ Inheritance-based polymorphism
✓ Association
✓ Aggregation
✓ Composition as ownership
✓ Object lifecycle
✓ Dependency relationships
```

## Next: Dependency Injection

Now we have enough OOP foundation to study one of the **most important concepts for your architecture: Dependency Injection (DI)**.

We'll start from the problem of a class creating its own dependencies:

```text
CreateShortenedUrl
        │
        └── new MongoUrlRepository()
```

then transform it into:

```text
wire.ts
   │
   ├── creates MongoUrlRepository
   │
   └── injects it
          ↓
CreateShortenedUrl
```

We'll cover **constructor injection, why DI exists, dependency inversion vs dependency injection, composition root, object graphs, and manual DI** before touching any DI framework/container.