# URL Service — Phase 2: Use-Case Exploration

We have finished the **domain exploration**. We currently have:

```text
Entity
└── ShortenedUrl

Value Objects
├── ShortenedUrlId
├── Url
└── ShortCode

Domain Type
└── ShortenedUrlStatus
```

Now we move one level outward.

The question is no longer:

> "What things exist?"

It is:

> **"What can the URL service actually do?"**

This is where we discover our **use cases**.

---

# 1. Start From System Capabilities

Our basic URL-shortener idea is:

```text
User/System
    │
    ├── provide a long URL
    │
    ├── get a short URL
    │
    └── later resolve short URL
```

So our first obvious capabilities are:

```text
Create Short URL
Resolve Short URL
```

But let's explore them instead of immediately creating classes.

---

# 2. Use Case #1 — Create Short URL

The user gives us:

```text
https://example.com/articles/typescript
```

The system should:

```text
Long URL
    ↓
validate
    ↓
generate ShortCode
    ↓
create ShortenedUrl
    ↓
persist it
    ↓
return shortened URL information
```

Therefore:

```text
CreateShortUrl
```

is clearly a use case.

---

# 3. What Is `CreateShortUrl` Responsible For?

Its responsibility is:

> **Coordinate the application operation of creating a shortened URL.**

Conceptually:

```text
CreateShortUrl
│
├── receive input
├── create/obtain required domain values
├── generate short code
├── create ShortenedUrl
├── ensure it can be stored
└── return result
```

Notice something important.

The use case is **not** responsible for everything.

For example:

```text
Generate random characters
```

is probably not its own business responsibility.

And:

```text
Validate whether a URL string is structurally valid
```

can belong to the `Url` value object.

So:

```text
CreateShortUrl
       │
       ├── Url
       ├── ShortCode
       └── ShortenedUrl
```

The use case **coordinates** these objects.

---

# 4. Use Case #2 — Resolve Short URL

Now consider:

```text
aB72xQ
```

The system needs to find:

```text
ShortenedUrl
      ↓
https://example.com/articles/typescript
```

Therefore:

```text
ResolveShortUrl
```

is another use case.

Its responsibility:

> **Resolve a short code into its original URL.**

Conceptually:

```text
ResolveShortUrl
       │
       ├── receive ShortCode
       ├── find ShortenedUrl
       ├── verify it can be resolved
       └── return Url
```

---

# 5. Should We Create More Use Cases?

Now think about the potential capabilities of a real URL service.

Possible operations:

```text
CreateShortUrl
ResolveShortUrl

GetShortUrl
DeleteShortUrl
DisableShortUrl
UpdateShortUrl
ListUserUrls
GetUrlAnalytics
```

But don't create all of them simply because they sound useful.

Our current requirements only establish:

```text
Create
Resolve
```

Therefore our initial application surface is:

```text
Use Cases
├── CreateShortUrl
└── ResolveShortUrl
```

Later requirements can introduce more use cases.

This is an important discipline:

> **Don't architect imaginary requirements.**

---

# 6. Now Examine `CreateShortUrl`

We have:

```text
CreateShortUrl
```

Let's look inside it.

What does it need?

```text
Input
   ↓
original URL
```

Then:

```text
Need ShortCode
   ↓
something must generate one
```

Then:

```text
Need persistence
   ↓
something must save ShortenedUrl
```

Potentially:

```text
Need uniqueness check
   ↓
something must determine whether code exists
```

So we have discovered **dependencies**.

---

# 7. Dependency #1 — Short-Code Generation

The use case needs:

> **A capability that can generate a short code.**

It does not need:

```text
NanoID
UUID
Base62
Math.random()
```

Those are implementation choices.

The requirement is simply:

```text
Generate a ShortCode
```

Therefore the capability is:

```text
ShortCodeGenerator
```

Conceptually:

```text
CreateShortUrl
      │
      ▼
ShortCodeGenerator
```

We have **not created the interface yet**.

First we're identifying the dependency.

---

# 8. Dependency #2 — Persistence

After creating:

```text
ShortenedUrl
```

we need to store it.

The use case needs:

> **A capability that can persist a ShortenedUrl.**

Again, don't say:

```text
MongoDB
```

The use case doesn't care about MongoDB.

The capability is:

```text
StoreShortenedUrl
```

or perhaps:

```text
ShortenedUrlWriter
```

This naming decision will become part of our port-design phase.

---

# 9. Dependency #3 — Uniqueness

Suppose we generate:

```text
aB72xQ
```

but that code already exists.

We need to know:

```text
Does this ShortCode already exist?
```

That is another capability.

Conceptually:

```text
ShortCode
     ↓
Does it already exist?
```

Possible capability:

```text
ShortCodeChecker
```

or:

```text
ShortenedUrlReader
```

Again, **don't decide the interface yet**.

First identify the requirement.

---

# 10. Dependency Classification

Now we can classify what `CreateShortUrl` needs.

| Requirement           | Internal / External |
| --------------------- | ------------------- |
| Validate URL          | Internal domain     |
| Create `Url`          | Internal domain     |
| Create `ShortenedUrl` | Internal domain     |
| Generate short code   | External capability |
| Check code uniqueness | External capability |
| Persist shortened URL | External capability |

So:

```text
CreateShortUrl
│
├── Domain
│   ├── Url
│   ├── ShortCode
│   └── ShortenedUrl
│
└── External capabilities
    ├── ShortCodeGenerator
    ├── Code existence check
    └── Persistence
```

This is the exact point where **ports will emerge**.

---

# 11. Examine `ResolveShortUrl`

Now do the same analysis.

Input:

```text
aB72xQ
```

What does the use case need?

First:

```text
Convert string → ShortCode
```

That's domain construction/validation.

Then:

```text
Find ShortenedUrl
```

That's an external capability.

Then:

```text
Is it ACTIVE?
```

That's domain behavior.

Then:

```text
Has it expired?
```

Potentially domain behavior.

Then:

```text
Return original Url
```

That's domain/application logic.

Therefore:

```text
ResolveShortUrl
│
├── ShortCode
├── ShortenedUrl lookup
└── ShortenedUrl domain behavior
```

---

# 12. The Important Boundary

Consider:

```text
Is the short URL expired?
```

Should we create:

```text
ExpirationService
```

Not necessarily.

If expiration is intrinsic to `ShortenedUrl`, the entity can answer:

```text
shortenedUrl.isExpired()
```

or:

```text
shortenedUrl.canResolve()
```

Therefore:

```text
ResolveShortUrl
       ↓
ShortenedUrl
       ↓
domain rule
```

This is **internal domain behavior**.

But:

```text
Find ShortenedUrl by ShortCode
```

requires access to stored state:

```text
ResolveShortUrl
       ↓
external persistence capability
```

That's where our port will come from.

---

# 13. Current Use-Case Model

We can now describe the application layer:

```text
                 USE CASES
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
 CreateShortUrl       ResolveShortUrl
          │                   │
          │                   └── ShortenedUrl lookup
          │
     ┌────┼─────────┐
     ▼    ▼         ▼
 Generate Check    Store
 Code    Unique    URL
```

This is much more useful than simply saying:

```text
"Create a service class."
```

We've actually derived what the service needs.

---

# 14. Now Define Use-Case Contracts

Now we're ready to introduce another concept:

> **What should the public contract of each use case look like?**

A use case generally has:

```text
Input
   ↓
execute()
   ↓
Output
```

For example:

```text
CreateShortUrl
    Input
      ↓
CreateShortUrlInput
      ↓
execute()
      ↓
CreateShortUrlOutput
```

Conceptually:

```text
interface CreateShortUrlUseCase {
  execute(
    input: CreateShortUrlInput,
  ): Promise<CreateShortUrlOutput>;
}
```

Similarly:

```text
interface ResolveShortUrlUseCase {
  execute(
    input: ResolveShortUrlInput,
  ): Promise<ResolveShortUrlOutput>;
}
```

The exact DTO shapes will be our next implementation detail.

---

# 15. Why Have a Use-Case Interface?

You may ask:

> "Why not just create `CreateShortUrl` class?"

You can.

The interface becomes useful when you want the application boundary to explicitly define:

```text
what the caller can invoke
```

while the implementation defines:

```text
how the operation is performed
```

Conceptually:

```text
CreateShortUrlUseCase
          ▲
          │
          │ implements
          │
CreateShortUrl
```

Likewise:

```text
ResolveShortUrlUseCase
          ▲
          │
ResolveShortUrl
```

This also gives you a clean seam for testing or alternative implementations.

---

# 16. Use-Case Layer So Far

Our design is now:

```text
core/
│
├── entities/
│   └── ShortenedUrl
│
├── value-objects/
│   ├── ShortenedUrlId
│   ├── Url
│   └── ShortCode
│
└── use-cases/
    ├── CreateShortUrl
    │   ├── interface
    │   └── implementation
    │
    └── ResolveShortUrl
        ├── interface
        └── implementation
```

**Don't create this folder structure yet if we're still designing.** This is simply the logical model we've arrived at.

---

# 17. Our Dependency Graph

Now we can draw the important part:

```text
CreateShortUrl
      │
      ├──────────────► ShortCodeGenerator
      │
      ├──────────────► ShortCodeChecker
      │
      └──────────────► ShortenedUrlWriter


ResolveShortUrl
      │
      └──────────────► ShortenedUrlReader
```

And domain dependencies:

```text
CreateShortUrl
      │
      ├──► Url
      ├──► ShortCode
      └──► ShortenedUrl

ResolveShortUrl
      │
      ├──► ShortCode
      └──► ShortenedUrl
```

Now we're at the exact point where **ports can be derived**.

---

# 18. One Important Observation

Look at the difference:

```text
Domain dependency:

CreateShortUrl
      ↓
ShortenedUrl
```

versus:

```text
External dependency:

CreateShortUrl
      ↓
ShortCodeGenerator
```

The first is part of our own core.

The second represents a capability that may have multiple implementations.

For example:

```text
ShortCodeGenerator
        ▲
        │
 ┌──────┼────────┐
 │      │        │
NanoID  UUID   Base62
```

That's why it becomes a **port**.

---

# 19. Current Checkpoint

We have now completed:

```text
PHASE 1 — DOMAIN EXPLORATION
✓ Entity
✓ Value Objects
✓ Domain Types
✓ Domain invariants
✓ Domain behavior

PHASE 2 — USE-CASE EXPLORATION
✓ Identify application actions
✓ Define use-case responsibilities
✓ Identify internal domain dependencies
✓ Identify external capabilities
✓ Define preliminary use-case contracts
```

Our current model:

```text
                  DOMAIN
                    │
              ShortenedUrl
                    │
          ┌─────────┼─────────┐
          │         │         │
         Url    ShortCode    Status


                USE CASES
                    │
          ┌─────────┴─────────┐
          │                   │
 CreateShortUrl       ResolveShortUrl
          │                   │
          ▼                   ▼
 External capabilities   External capability
          │                   │
   ┌──────┼──────┐            │
   ▼      ▼      ▼            ▼
Generate Check  Store       Read
```

---

# Next Phase — **Port Discovery**

Now we'll take the external capabilities we've discovered:

```text
ShortCodeGenerator
ShortCodeChecker
ShortenedUrlWriter
ShortenedUrlReader
```

and ask the more precise architectural question:

> **"What exact interface should each use case depend on?"**

We'll determine whether these should remain four separate ports, whether some should be combined, and how **ISP and DIP** influence the final design.

Then we'll implement the ports and finally derive the concrete adapters from them.