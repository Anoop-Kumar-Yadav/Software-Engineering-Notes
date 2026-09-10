# URL Service — Domain Entity Exploration

We will start **before creating folders or code**. The first job is to understand the business domain and discover what objects actually exist.

Our service is a **URL shortener**, so the question is not yet "what classes should I create?" It is:

> **What things exist in the URL-shortening domain, and which of those things have their own identity, state, and lifecycle?**

---

## 1. Start With the Core Product Idea

Our URL service needs to support the basic behavior:

```text
Long URL
   ↓
Create shortened URL
   ↓
Short code
```

Then:

```text
Short code
   ↓
Find shortened URL
   ↓
Original URL
```

Potential future capabilities may include:

```text
expiration
custom aliases
click tracking
ownership
deactivation
analytics
```

But **we won't model future features unless they help us understand the current domain**.

---

# 2. Explore the Nouns

From the idea, what things can we identify?

```text
URL
Short URL
Short Code
User
Click
Analytics
Expiration
```

But this is only a **candidate list**.

A noun does **not automatically become an entity**.

For each candidate, ask:

### Question A

> Does this thing need its own identity?

### Question B

> Does it have a lifecycle?

### Question C

> Does it have state that changes over time?

### Question D

> Does the business care about this thing independently?

These questions help distinguish entities from values and other concepts.

---

# 3. Candidate: Shortened URL

Consider:

```text
https://example.com/article
```

becoming:

```text
aB72xQ
```

The system needs to remember the relationship:

```text
shortCode → originalUrl
```

But is this merely a pair of strings?

Not necessarily.

A shortened URL may eventually have:

```text
id
original URL
short code
created time
expiration time
status
owner
click count
```

It also has a lifecycle:

```text
Created
   ↓
Active
   ↓
Expired / Disabled
```

And the system can perform operations against it:

```text
create
resolve
disable
expire
```

Therefore:

> **`ShortenedUrl` is the primary domain entity.**

---

# 4. Candidate: URL

Now consider:

```text
https://example.com/articles/typescript
```

Does this need its own identity?

Probably not.

The domain doesn't generally care about:

```text
URL #18472
```

as an independently identifiable object.

Instead, URL represents a **value**.

For example:

```text
https://example.com
```

and:

```text
https://example.com
```

represent the same value.

That strongly suggests:

> **`Url` should be a Value Object.**

It can own rules such as:

```text
must be syntactically valid
must use an allowed scheme
must not be empty
```

---

# 5. Candidate: Short Code

Consider:

```text
aB72xQ
```

Does it have an independent lifecycle?

Usually no.

The code is a value associated with a `ShortenedUrl`.

Therefore:

> **`ShortCode` is also a good candidate for a Value Object.**

Instead of:

```ts
shortCode: string
```

we can eventually have:

```text
ShortCode
```

which can protect rules such as:

```text
not empty
allowed characters
maximum length
```

This gives us:

```text
ShortenedUrl
├── Url
└── ShortCode
```

rather than:

```text
ShortenedUrl
├── string
└── string
```

---

# 6. Candidate: User

Now suppose the product eventually allows users to own shortened URLs.

Then:

```text
User
```

has:

```text
userId
```

and exists independently from a particular shortened URL.

It has its own lifecycle:

```text
registered
   ↓
active
   ↓
deactivated
```

Therefore, **if user ownership is part of this service's domain**, `User` could be an entity.

But here's an important architectural question:

> **Does the URL service actually own the User domain?**

If authentication/user management belongs to another service, then we should **not create a full `User` entity inside URL service merely because a URL has an owner**.

We may instead have:

```text
ownerId: UserId
```

where `UserId` is simply an identifier/value used by this service.

This distinction becomes extremely important in your future microservice architecture.

---

# 7. Candidate: Click

Suppose someone visits:

```text
https://short.ly/aB72xQ
```

We could record:

```text
timestamp
IP
user agent
referrer
country
device
```

Is `Click` an entity?

Possibly.

But for our **initial URL service**, click analytics is not part of the core requirement.

Therefore:

> **Don't introduce `Click` yet.**

This is an important design principle:

**Domain modeling is not about modeling everything that could possibly exist.**

It is about modeling what the current business actually requires.

---

# 8. Candidate: Expiration

Suppose:

```text
createdAt
expiresAt
```

Does `Expiration` necessarily deserve an entity?

No.

It may simply be part of the `ShortenedUrl` state:

```text
ShortenedUrl
├── createdAt
├── expiresAt
└── ...
```

Later, if expiration becomes a sophisticated domain concept, we could introduce something more explicit.

For now:

```text
Expiration ≠ Entity
```

---

# 9. Candidate: Status

A shortened URL may have:

```text
ACTIVE
EXPIRED
DISABLED
```

This is not an entity.

It is a **domain type**.

Conceptually:

```text
ShortenedUrlStatus
├── ACTIVE
├── EXPIRED
└── DISABLED
```

The entity owns the status:

```text
ShortenedUrl
└── status: ShortenedUrlStatus
```

---

# 10. Our Initial Domain Model

After filtering the candidates, we arrive at:

```text
DOMAIN
│
├── Entity
│   └── ShortenedUrl
│
├── Value Objects
│   ├── Url
│   └── ShortCode
│
└── Domain Types
    └── ShortenedUrlStatus
```

Potentially:

```text
UserId
```

if ownership is part of the current requirements.

---

# 11. Visualize the Entity

Our primary entity currently looks conceptually like:

```text
┌──────────────────────────────┐
│        ShortenedUrl          │
├──────────────────────────────┤
│ id                           │
│ originalUrl : Url            │
│ shortCode   : ShortCode      │
│ status      : Status         │
│ createdAt                    │
│ expiresAt?                   │
│ ownerId?                     │
├──────────────────────────────┤
│ resolve()                    │
│ disable()                    │
│ expire()                     │
└──────────────────────────────┘
```

Don't implement those methods yet.

We are still **exploring responsibilities**.

---

# 12. The Most Important Question: What Does `ShortenedUrl` Own?

Now we ask:

> **What decisions should `ShortenedUrl` itself be responsible for?**

For example:

### Should this be allowed?

```text
shortenedUrl.status = "EXPIRED";
```

Probably not.

The entity should control state transitions.

Instead, conceptually:

```text
shortenedUrl.expire()
```

Then it can enforce:

```text
ACTIVE → EXPIRED
```

and reject:

```text
EXPIRED → ACTIVE
```

Similarly:

```text
shortenedUrl.disable()
```

could enforce the appropriate lifecycle rule.

This is **encapsulation applied to domain modeling**.

---

# 13. Domain Invariants

Now we extract what must always be true.

For `Url`:

```text
URL cannot be empty
URL must be valid
```

For `ShortCode`:

```text
short code cannot be empty
short code must follow allowed format
```

For `ShortenedUrl`:

```text
must have a valid URL
must have a valid short code
must have a valid status
createdAt cannot be invalid
```

Potential lifecycle rules:

```text
ACTIVE → EXPIRED
ACTIVE → DISABLED
```

but:

```text
EXPIRED → ACTIVE    ✗
DISABLED → ACTIVE   ✗
```

These are **domain invariants**, not repository concerns.

---

# 14. Important Boundary: Uniqueness

Now consider:

> "A short code must be unique."

Where should this rule live?

This is a very important question.

The `ShortCode` value object can validate:

```text
"aB72xQ"
```

is structurally valid.

But can it know whether:

```text
"aB72xQ"
```

already exists in the database?

**No.**

That requires access to the collection of existing URLs.

Therefore:

```text
ShortCode
   ↓
"Is this structurally valid?"
```

belongs to the value object.

While:

```text
Does this short code already exist?
```

belongs to the **application/domain operation involving persistence**.

This distinction will later lead us naturally to a **port**.

---

# 15. Another Important Boundary: URL Generation

Should `ShortenedUrl` generate its own short code?

Probably not.

Don't make the entity responsible for:

```text
random generation
NanoID
UUID
Base62
cryptographic randomness
```

The entity receives a valid `ShortCode`.

Conceptually:

```text
Use Case
   │
   ├── generates ShortCode
   │
   ▼
ShortenedUrl
```

rather than:

```text
ShortenedUrl
   ↓
NanoID
```

Why?

Because code generation is an external capability/algorithm that we may want to replace.

This will become a **port** later.

---

# 16. Current Domain Model

So far, our thinking has produced:

```text
                         DOMAIN
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
          Entity       Value Objects    Domain Type
             │              │              │
             │         ┌────┴────┐         │
             │         ▼         ▼         ▼
             │        Url    ShortCode   Status
             │
             ▼
       ShortenedUrl
```

This is the first architectural artifact we've derived.

Notice that we haven't created:

```text
repository
service
controller
MongoDB
Express
wire.ts
```

yet.

That's intentional.

---

# 17. Domain Type Design

Before moving to use cases, we should eventually formalize something like:

```text
Url
ShortCode
ShortenedUrl
ShortenedUrlStatus
```

But there is one more thing to decide:

> **What should the actual `ShortenedUrl` identity be?**

Possibilities:

```text
id
```

or perhaps:

```text
shortCode
```

This is a real domain-design question.

If the short code itself uniquely identifies the shortened URL and never changes, it may serve as a natural identity.

Alternatively, you may want an internal ID and treat `ShortCode` as a separate business value.

**For our architecture exercise, I'd use an internal `ShortenedUrlId` plus `ShortCode`.**

That keeps identity separate from the public lookup key.

So our refined model becomes:

```text
ShortenedUrl
├── ShortenedUrlId
├── Url
├── ShortCode
├── Status
├── createdAt
└── expiresAt?
```

---

# 18. Domain Exploration Checkpoint

We have now completed **Phase 1**:

```text
✓ Started from product idea
✓ Extracted candidate concepts
✓ Removed concepts that don't need independent modeling
✓ Identified entity
✓ Identified value objects
✓ Identified domain type
✓ Identified entity responsibilities
✓ Identified domain invariants
✓ Distinguished domain rules from persistence concerns
✓ Distinguished domain behavior from external capabilities
```

Our current result:

```text
Entity
└── ShortenedUrl

Value Objects
├── ShortenedUrlId
├── Url
└── ShortCode

Domain Types
└── ShortenedUrlStatus
```

---

# Next Phase — Discover the Use Cases

Now we ask a completely different question:

> **"Given these domain objects, what can a user or another part of the system actually ask the URL service to do?"**

From that, we'll derive the **use-case interfaces and implementations**.

The sequence from here will be:

```text
Domain Types
      ↓
What can the system do?
      ↓
Use Cases
      ↓
What does each use case need?
      ↓
Dependencies
      ↓
Ports
      ↓
Adapters
      ↓
wire.ts
```

And importantly, **we will derive each layer from the previous one**, rather than starting with a pre-made Clean Architecture folder structure.