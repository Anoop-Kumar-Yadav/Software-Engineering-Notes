# URL Service — Phase 3: Port Discovery

We now have the domain and use cases:

```text
Domain
├── ShortenedUrl
├── Url
├── ShortCode
├── ShortenedUrlId
└── ShortenedUrlStatus

Use Cases
├── CreateShortUrl
└── ResolveShortUrl
```

And from the use cases, we discovered these **external capabilities**:

```text
CreateShortUrl
├── generate short code
├── check short-code uniqueness
└── save shortened URL

ResolveShortUrl
└── find shortened URL
```

Now we turn those capabilities into **ports**.

---

# 1. What Exactly Is a Port?

A port is simply an **interface representing a capability required by the core**.

The important direction is:

```text
Use Case
    ↓
    Port
```

The use case says:

> "I need something that can do X."

It does **not** say:

> "I need MongoDB."

For example:

```text
CreateShortUrl
      ↓
"I need to save a ShortenedUrl."
      ↓
ShortenedUrlWriter
```

---

# 2. First Port — ID / Short-Code Generation

Our use case needs:

> Something that can generate a short code.

So:

```text
ShortCodeGenerator
```

Potential interface:

```ts
interface ShortCodeGenerator {
  generate(): ShortCode;
}
```

Notice the return type.

We previously decided that `ShortCode` is a **domain value object**.

Therefore, rather than:

```ts
generate(): string;
```

we can make the boundary stronger:

```ts
generate(): ShortCode;
```

This prevents the application from casually passing arbitrary strings around.

---

# 3. Second Port — Checking Uniqueness

We need:

> Something that can determine whether a short code is already being used.

Potentially:

```ts
interface ShortCodeChecker {
  exists(shortCode: ShortCode): Promise<boolean>;
}
```

This is a good capability-oriented interface.

The use case doesn't care whether the check happens through:

```text
MongoDB
PostgreSQL
Redis
HTTP
```

It only cares:

```text
exists(shortCode)
```

---

# 4. Third Port — Persisting the URL

After constructing:

```text
ShortenedUrl
```

the application needs to save it.

Capability:

```text
ShortenedUrlWriter
```

Interface:

```ts
interface ShortenedUrlWriter {
  save(url: ShortenedUrl): Promise<void>;
}
```

Again:

```text
ShortenedUrlWriter
```

doesn't imply MongoDB.

It describes **what the application needs**.

---

# 5. Fourth Port — Reading the URL

`ResolveShortUrl` needs:

> Find a shortened URL using its short code.

Therefore:

```ts
interface ShortenedUrlReader {
  findByShortCode(
    shortCode: ShortCode,
  ): Promise<ShortenedUrl | null>;
}
```

Now our four ports are:

```text
ShortCodeGenerator
ShortCodeChecker
ShortenedUrlWriter
ShortenedUrlReader
```

---

# 6. Are Four Ports Really Necessary?

This is where architectural judgment begins.

A beginner may think:

> "Why not just create one `ShortenedUrlRepository`?"

For example:

```ts
interface ShortenedUrlRepository {
  save(url: ShortenedUrl): Promise<void>;

  findByShortCode(
    code: ShortCode,
  ): Promise<ShortenedUrl | null>;

  exists(code: ShortCode): Promise<boolean>;
}
```

This is not automatically wrong.

But look at the clients:

```text
CreateShortUrl
      ↓
needs:
  exists()
  save()

ResolveShortUrl
      ↓
needs:
  findByShortCode()
```

Neither use case needs every capability.

This gives us an **ISP consideration**.

---

# 7. ISP: Design Interfaces Around Clients

Our current design:

```text
CreateShortUrl
├── ShortCodeGenerator
├── ShortCodeChecker
└── ShortenedUrlWriter

ResolveShortUrl
└── ShortenedUrlReader
```

is highly focused.

The dependency graph becomes:

```text
CreateShortUrl
      │
      ├── ShortCodeGenerator
      ├── ShortCodeChecker
      └── ShortenedUrlWriter


ResolveShortUrl
      │
      └── ShortenedUrlReader
```

This is excellent for **Interface Segregation**.

---

# 8. But Don't Split Interfaces Blindly

There is another important lesson.

ISP does **not** mean:

> "Every method must have its own interface."

That would produce nonsense like:

```text
ShortCodeGenerator
ShortCodeExistenceChecker
ShortenedUrlSaver
ShortenedUrlFinder
```

simply because we can.

We split interfaces when:

> **Different clients have meaningfully different dependency requirements.**

In our case:

```text
CreateShortUrl
```

needs writing capabilities.

While:

```text
ResolveShortUrl
```

only needs reading.

Therefore the split is justified.

---

# 9. Can One Adapter Implement Multiple Ports?

Absolutely.

This is a critical concept.

We might eventually have:

```text
MongoShortenedUrlRepository
```

implement:

```text
ShortCodeChecker
ShortenedUrlWriter
ShortenedUrlReader
```

Conceptually:

```text
                 MongoShortenedUrlRepository
                         ▲
             ┌───────────┼───────────┐
             │           │           │
             │           │           │
      ShortCodeChecker  Writer     Reader
```

This is perfectly valid.

The **client gets a narrow interface**, while the concrete adapter can provide multiple capabilities.

---

# 10. This Is the Key ISP Pattern

Think of it as:

```text
                 Concrete Adapter
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
          Port A      Port B     Port C
            ▲          ▲          ▲
            │          │          │
         Use Case    Use Case   Use Case
```

For example:

```text
MongoShortenedUrlRepository
       │
       ├── ShortCodeChecker
       ├── ShortenedUrlWriter
       └── ShortenedUrlReader
```

while:

```text
CreateShortUrl
       ↓
ShortenedUrlWriter
```

It doesn't know the concrete repository provides five other operations.

That's **interface segregation + polymorphism** working together.

---

# 11. What About `ShortCodeGenerator`?

This one is different.

Generation is not persistence.

So we should keep:

```text
ShortCodeGenerator
```

separate.

Possible implementations later:

```text
NanoIdShortCodeGenerator
Base62ShortCodeGenerator
RandomShortCodeGenerator
```

All satisfy:

```text
ShortCodeGenerator
```

This gives us another polymorphism boundary.

---

# 12. Now Think About Collision Handling

Suppose:

```text
generator.generate()
        ↓
aB72xQ
```

Then:

```text
checker.exists(aB72xQ)
        ↓
true
```

What should happen?

The use case could generate another code:

```text
generate()
   ↓
x9K2Lm
   ↓
exists?
   ↓
false
```

Then:

```text
create ShortenedUrl
        ↓
save
```

This tells us something important about the **use-case responsibility**.

The use case coordinates the process:

```text
generate
   ↓
check
   ↓
retry if necessary
   ↓
create entity
   ↓
save
```

The generator itself doesn't need to know whether a code is already stored.

---

# 13. Dependency Graph After Port Discovery

We can now draw the architecture more accurately:

```text
                         CORE
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
     CreateShortUrl             ResolveShortUrl
             │                         │
       ┌─────┼─────┐                   │
       │     │     │                   │
       ▼     ▼     ▼                   ▼
    Generator Checker Writer        Reader
       │     │     │                   │
       └─────┴─────┴──────────┬────────┘
                              │
                            PORTS
```

The core knows only these abstractions.

---

# 14. Now Ask: What Technology Will Provide Them?

Only now do we introduce technology.

Suppose we choose:

```text
MongoDB
```

Then we could have:

```text
MongoShortenedUrlRepository
```

implement:

```text
ShortCodeChecker
ShortenedUrlWriter
ShortenedUrlReader
```

For generation:

```text
NanoidShortCodeGenerator
```

implements:

```text
ShortCodeGenerator
```

So:

```text
                PORTS
                  ▲
                  │
          ┌───────┴────────┐
          │                │
          │                │
   Mongo Repository      NanoID
          │                │
          ▼                ▼
      Persistence      Generation
```

---

# 15. The Adapter Layer

Our current adapters might therefore be:

```text
adapters/
│
├── persistence/
│   └── mongo-shortened-url-repository.ts
│
└── generators/
    └── nanoid-short-code-generator.ts
```

But remember:

**The adapter doesn't define the business requirement.**

The port does.

The adapter merely fulfills it.

---

# 16. The Most Important Dependency Rule

Look at this:

```text
CreateShortUrl
       ↓
ShortCodeGenerator
       ↑
NanoidShortCodeGenerator
```

Notice the arrow direction.

The use case depends on:

```text
ShortCodeGenerator
```

The adapter depends on:

```text
ShortCodeGenerator
```

Therefore the dependency structure is:

```text
       Use Case
          │
          ▼
         Port
          ▲
          │
        Adapter
```

This is the heart of **Dependency Inversion**.

---

# 17. What `wire.ts` Will Eventually Do

We haven't implemented wiring yet, but we can already predict what it needs to construct.

Suppose:

```text
MongoShortenedUrlRepository
NanoidShortCodeGenerator
```

are our concrete adapters.

Then `wire.ts` connects:

```text
NanoidShortCodeGenerator
          ↓
ShortCodeGenerator
          ↓
CreateShortUrl

MongoShortenedUrlRepository
          ↓
ShortCodeChecker
          ↓
CreateShortUrl

MongoShortenedUrlRepository
          ↓
ShortenedUrlWriter
          ↓
CreateShortUrl

MongoShortenedUrlRepository
          ↓
ShortenedUrlReader
          ↓
ResolveShortUrl
```

This is the **composition root**.

---

# 18. Our Complete Logical Design So Far

```text
                        DOMAIN
                           │
                ┌──────────┼──────────┐
                │          │          │
             Url       ShortCode    ShortenedUrl
                │          │          │
                └──────────┴──────────┘
                           │
                           ▼
                       USE CASES
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
          CreateShortUrl       ResolveShortUrl
                 │                   │
          ┌──────┼──────┐            │
          ▼      ▼      ▼            ▼
       Generator Checker Writer    Reader
          │      │      │            │
          └──────┴──────┴────────────┘
                         │
                        PORTS
                         ▲
                         │
              ┌──────────┴──────────┐
              │                     │
       Mongo Repository       NanoID Generator
              │                     │
              └──────────┬──────────┘
                         │
                      WIRING
```

---

# 19. One Architectural Decision Still Pending

There is one thing I want us to settle **before implementation**:

### Should `ShortCodeChecker` exist separately?

We currently have:

```text
ShortCodeChecker
ShortenedUrlWriter
ShortenedUrlReader
```

But we could potentially model persistence as:

```text
ShortenedUrlReader
    └── findByShortCode()
```

and perform uniqueness using:

```text
reader.findByShortCode(code)
```

Then we don't need:

```text
ShortCodeChecker
```

because existence is simply a specialized read operation.

That would give:

```text
CreateShortUrl
├── ShortCodeGenerator
├── ShortenedUrlReader
└── ShortenedUrlWriter

ResolveShortUrl
└── ShortenedUrlReader
```

This is arguably **cleaner** because we avoid duplicating a capability.

---

# 20. I Recommend This Version

For our URL service, let's use:

```text
ShortCodeGenerator
ShortenedUrlReader
ShortenedUrlWriter
```

instead of four ports.

The reader provides:

```ts
findByShortCode(
  shortCode: ShortCode,
): Promise<ShortenedUrl | null>;
```

Therefore uniqueness becomes:

```text
const existing =
  await reader.findByShortCode(shortCode);

if (existing) {
  // generate another code
}
```

This is a nice example of **not over-engineering interfaces**.

---

# 21. Final Port Design

Our URL service currently needs:

```text
ports/
│
├── short-code-generator.ts
├── shortened-url-reader.ts
└── shortened-url-writer.ts
```

Conceptually:

```text
ShortCodeGenerator
└── generate()

ShortenedUrlReader
└── findByShortCode()

ShortenedUrlWriter
└── save()
```

And potentially one concrete adapter can implement both:

```text
ShortenedUrlReader
        ▲
        │
MongoShortenedUrlRepository
        │
        ▼
ShortenedUrlWriter
```

This is a very natural application of **ISP**.

---

# Checkpoint

We've now completed the reasoning chain:

```text
RAW IDEA
   ↓
DOMAIN
   ↓
ShortenedUrl
Url
ShortCode
ShortenedUrlId
Status
   ↓
USE CASES
   ↓
CreateShortUrl
ResolveShortUrl
   ↓
DEPENDENCIES
   ↓
Generate code
Read URL
Write URL
   ↓
PORTS
   ↓
ShortCodeGenerator
ShortenedUrlReader
ShortenedUrlWriter
   ↓
ADAPTERS
   ↓
NanoidShortCodeGenerator
MongoShortenedUrlRepository
   ↓
WIRE
   ↓
Connect concrete implementations
```

This is the exact **derivation process** you wanted to practice.

## Next: Implement the Ports

Now we can stop designing and start creating the actual TypeScript types:

```text
src/core/ports/
├── short-code-generator.ts
├── shortened-url-reader.ts
└── shortened-url-writer.ts
```

Then we'll build the **use-case interface + implementation**, inject these ports, and only after that create the adapters and `wire.ts`.