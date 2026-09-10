Exactly. This is the important thing to learn: **a repeatable feature-development process**, not just individual files.

For this `url-service`, whenever we add a new feature, follow this sequence.

# Feature Addition Workflow

Suppose the new feature is:

> **Disable a Short URL**

---

## 1. Start from the requirement

Don't start by creating folders.

First write the behavior:

```text
User wants to disable an existing short URL.
After disabling:
→ it must no longer resolve
→ its status becomes DISABLED
→ disabling an already disabled URL is invalid
```

Then ask:

> **Who owns each rule?**

---

# 2. Check the Domain first

Before creating anything, inspect the existing entity/value objects.

For Disable URL:

```text
domain/
├── entities/
│   └── shortenedUrl.entity.ts
└── types/
    └── shortenedUrlStatus.type.ts
```

We already have:

```ts
shortenedUrl.disable();
```

and:

```ts
ShortenedUrlStatus.DISABLED
```

Therefore:

**No new domain file is required.**

If the business rule did not exist, we would modify/create the domain code **first**.

### Rule

> **If the feature introduces a new business concept or business rule, modify the Domain first.**

---

# 3. Define the Use Case

Once the domain can represent the behavior, create the application use case.

Create:

```text
application/
└── use-cases/
    └── disableShortUrl/
        ├── disableShortUrl.types.ts
        ├── disableShortUrl.use-case.ts
        └── disableShortUrl.use-case.impl.ts
```

The use case asks:

```text
What does the application need to accomplish this operation?
```

For Disable:

```text
1. Find ShortenedUrl
2. Disable it
3. Save it
4. Return result
```

---

# 4. Identify Dependencies

While writing the use case, ask:

> "What does this use case need from outside itself?"

For Disable:

```text
Need to find URL
        ↓
ShortenedUrlReader

Need to save URL
        ↓
ShortenedUrlWriter
```

These ports already exist.

Therefore:

**No new port required.**

If a new capability were required, we'd create the port here:

```text
application/ports/
└── someNewCapability.port.ts
```

### Rule

> **Create a port only when the use case requires an external capability that doesn't already have a suitable port.**

---

# 5. Check Adapters

Now ask:

> "Do we already have an adapter implementing these ports?"

We have:

```text
InMemoryShortenedUrlRepository
        │
        ├── ShortenedUrlReader
        └── ShortenedUrlWriter
```

Therefore:

**No new adapter is required.**

If we later use MongoDB:

```text
MongoShortenedUrlRepository
        │
        ├── ShortenedUrlReader
        └── ShortenedUrlWriter
```

The use case doesn't change.

---

# 6. Create the HTTP Controller

Now expose the feature through HTTP.

Create:

```text
adapters/
└── http/
    └── controllers/
        └── disableShortUrl.controller.ts
```

Controller responsibility:

```text
HTTP request
    ↓
extract input
    ↓
call use case
    ↓
HTTP response
```

It should **not** contain business logic.

---

# 7. Add the HTTP Route

Modify:

```text
adapters/
└── http/
    └── routes/
        └── url.routes.ts
```

Add:

```text
POST /urls/:shortCode/disable
```

Route responsibility:

```text
HTTP endpoint
    ↓
Controller
```

Nothing more.

---

# 8. Update `wire.ts`

Now connect the new objects.

This is the **composition root**.

Add:

```text
Use Case
    ↑
Controller
    ↑
Concrete dependencies
```

Conceptually:

```ts
const disableShortUrl =
  new DisableShortUrlUseCaseImpl(
    shortenedUrlRepository,
    shortenedUrlRepository,
  );

const disableShortUrlController =
  new DisableShortUrlController(
    disableShortUrl,
  );
```

Then expose them from `wireUrlService()`.

### Rule

> **Every new concrete object that participates in the runtime dependency graph eventually gets constructed in `wire.ts`.**

---

# 9. Update `main.ts`

Only after everything is wired do we update the entry point.

`main.ts` should mainly do:

```text
create Express app
       ↓
middleware
       ↓
wire application
       ↓
register routes
       ↓
start server
```

For the new feature, we pass the controller to the routes.

We don't construct the controller directly in `main.ts`.

---

# 10. Add Tests

Finally test the behavior at the appropriate boundaries.

For Disable URL:

### Domain

If we changed domain behavior:

```text
tests/domain/entities/
└── shortenedUrl.entity.test.ts
```

### Use case

```text
tests/application/use-cases/
└── disableShortUrl.use-case.test.ts
```

### HTTP

Eventually:

```text
tests/integration/
└── disableShortUrl.test.ts
```

---

# The Complete Order

This is the sequence I want you to memorize:

```text
                 NEW FEATURE
                     │
                     ▼
             1. Requirement
                     │
                     ▼
             2. Domain analysis
                     │
              ┌──────┴──────┐
              │             │
        New rule?       Already exists?
              │             │
              ▼             ▼
       Modify Domain      Continue
              │
              └──────┬──────┘
                     ▼
             3. Create Use Case
                     │
                     ▼
             4. Identify Dependencies
                     │
              ┌──────┴──────┐
              │             │
        New capability? Existing port?
              │             │
              ▼             ▼
         Create Port       Reuse
              │
              └──────┬──────┘
                     ▼
             5. Check Adapters
                     │
              ┌──────┴──────┐
              │             │
        New adapter?    Existing adapter?
              │             │
              ▼             ▼
           Create          Reuse
              │
              └──────┬──────┘
                     ▼
             6. HTTP Controller
                     │
                     ▼
             7. HTTP Route
                     │
                     ▼
             8. wire.ts
                     │
                     ▼
             9. main.ts
                     │
                     ▼
             10. Tests
```

## Even shorter version

When you are implementing a feature, ask these questions **in order**:

|Order|Question|Typical location|
|---|---|---|
|1|What behavior are we adding?|Requirement|
|2|What business rule does it introduce?|`domain/`|
|3|What operation orchestrates it?|`application/use-cases/`|
|4|What external capabilities does it need?|`application/ports/`|
|5|Do adapters for those ports already exist?|`adapters/`|
|6|How does HTTP invoke it?|`adapters/http/controllers/`|
|7|What endpoint exposes it?|`adapters/http/routes/`|
|8|How are dependencies constructed?|`wire.ts`|
|9|How is the application started?|`main.ts`|
|10|How do we prove it works?|`tests/`|

### The key principle

**Don't think:**

> "For every feature I need to create these 8 files."

Think:

> **Requirement → Domain → Use Case → Dependencies → Ports → Adapters → HTTP → Wiring → Tests**

Some features will require **2 new files**.  
Some will require **10**.  
Some will require **zero new domain files**.

That is the architectural thinking we are trying to build.