# Lesson 1 — Modules, Part 3: Encapsulation, Re-exporting & Global Modules

Now we'll focus on **visibility**.

This is where Nest modules become much more than organizational folders.

We'll use one running example:

```text
URL Shortener
```

with:

```text
AppModule
├── UrlModule
├── UserModule
└── DatabaseModule
```

---

# 1. Module encapsulation

Consider:

```ts
@Module({
  providers: [
    UrlService,
    UrlRepository,
    UrlValidator,
  ],

  exports: [
    UrlService,
  ],
})
export class UrlModule {}
```

There are three providers:

```text
UrlModule
│
├── UrlService
├── UrlRepository
└── UrlValidator
```

But only:

```text
UrlService
```

is exported.

Think of the module as:

```text
┌─────────────────────────────────┐
│           UrlModule             │
│                                 │
│  UrlService      ← PUBLIC       │
│                                 │
│  UrlRepository   ← INTERNAL     │
│  UrlValidator    ← INTERNAL     │
│                                 │
└─────────────────────────────────┘
             │
             │
             ▼
       Other modules
       can consume
       UrlService
```

This is **module encapsulation**.

The other providers are implementation details.

---

# 2. Why is this useful?

Imagine another module:

```ts
@Injectable()
export class AnalyticsService {

  constructor(
    private readonly urlRepository: UrlRepository,
  ) {}

}
```

You might ask:

> "Why shouldn't AnalyticsModule directly use `UrlRepository`?"

Because now Analytics has knowledge of URL persistence internals.

You get:

```text
Analytics
    │
    ▼
UrlRepository
    │
    ▼
Database
```

Instead, expose a higher-level abstraction:

```text
Analytics
    │
    ▼
UrlService
    │
    ▼
UrlRepository
```

Now the internal implementation can change without affecting Analytics.

For example:

```text
Today:

UrlService
   ↓
PrismaUrlRepository
   ↓
PostgreSQL


Tomorrow:

UrlService
   ↓
MongoUrlRepository
   ↓
MongoDB
```

The consumer doesn't necessarily need to know.

---

# 3. `exports` can contain providers

You've already seen:

```ts
exports: [
  UrlService,
]
```

This means:

```text
UrlModule
   │
   └── exposes UrlService
```

---

# 4. `exports` can also contain modules

This is where things become interesting.

Suppose:

```text
DatabaseModule
```

provides:

```text
DatabaseService
```

and exports it:

```ts
@Module({
  providers: [
    DatabaseService,
  ],

  exports: [
    DatabaseService,
  ],
})
export class DatabaseModule {}
```

Now imagine we create:

```text
PersistenceModule
```

which imports `DatabaseModule`.

```ts
@Module({
  imports: [
    DatabaseModule,
  ],
})
export class PersistenceModule {}
```

At this point:

```text
PersistenceModule
      │
      │ imports
      ▼
DatabaseModule
      │
      ▼
DatabaseService
```

But another module importing `PersistenceModule` does **not automatically** gain access to `DatabaseService`.

Why?

Because `PersistenceModule` hasn't exported anything.

---

# 5. Re-exporting a module

We can do:

```ts
@Module({
  imports: [
    DatabaseModule,
  ],

  // Re-export the imported module.
  exports: [
    DatabaseModule,
  ],
})
export class PersistenceModule {}
```

Now:

```text
PersistenceModule
      │
      │ imports
      ▼
DatabaseModule
      │
      │ exports DatabaseService
      ▼
DatabaseService
```

And `PersistenceModule` itself re-exports:

```text
DatabaseModule
```

So another module can do:

```ts
@Module({
  imports: [
    PersistenceModule,
  ],
})
export class UrlModule {}
```

Conceptually:

```text
UrlModule
    │
    │ imports
    ▼
PersistenceModule
    │
    │ re-exports
    ▼
DatabaseModule
    │
    ▼
DatabaseService
```

This is called **module re-exporting**.

---

# 6. Why would we re-export?

This becomes useful when creating a **facade module**.

Imagine your application has:

```text
PersistenceModule
├── DatabaseModule
├── CacheModule
└── TransactionModule
```

You could make feature modules import all three:

```ts
imports: [
  DatabaseModule,
  CacheModule,
  TransactionModule,
]
```

Or expose them through one module:

```text
PersistenceModule
       │
       ├── DatabaseModule
       ├── CacheModule
       └── TransactionModule
```

Then:

```text
UrlModule
    │
    ▼
PersistenceModule
```

The feature module doesn't need to know about the internal composition.

That's another form of encapsulation.

---

# 7. Re-exporting a provider vs re-exporting a module

These are different.

### Export provider

```ts
@Module({
  providers: [
    UrlService,
  ],

  exports: [
    UrlService,
})
export class UrlModule {}
```

You're saying:

> "Expose this provider."

### Export module

```ts
@Module({
  imports: [
    DatabaseModule,
  ],

  exports: [
    DatabaseModule,
  ],
})
export class PersistenceModule {}
```

You're saying:

> "Expose this imported module and its exported API."

---

# 8. Important rule

This:

```ts
exports: [
  DatabaseModule,
]
```

doesn't mean:

> "Expose every provider inside DatabaseModule."

It preserves the module boundary.

What becomes available is what `DatabaseModule` itself makes available through its exports.

So:

```text
DatabaseModule
│
├── DatabaseService ── exported
│
├── InternalPool ───── not exported
│
└── InternalHelper ─── not exported
```

Re-exporting `DatabaseModule` doesn't suddenly expose:

```text
InternalPool
InternalHelper
```

---

# 9. Global modules

Now another important concept.

Normally, if you want to consume a module's exported provider, you explicitly import the module.

For example:

```ts
@Module({
  imports: [
    DatabaseModule,
  ],
})
export class UrlModule {}
```

What if a service is needed almost everywhere?

Typical examples:

```text
Configuration
Logger
```

Nest supports **global modules**.

```ts
@Global()
@Module({
  providers: [
    ConfigService,
  ],

  exports: [
    ConfigService,
  ],
})
export class ConfigModule {}
```

The important decorator is:

```ts
@Global()
```

---

# 10. What does `@Global()` mean?

Conceptually:

```text
Normal module:

UrlModule ──imports──> DatabaseModule


Global module:

                    ConfigModule
                    @Global()
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
         UrlModule  UserModule AuthModule
```

A global module's exported providers are available across the application without each consuming module explicitly importing the global module.

But there's a crucial rule:

> **Global does not mean "every provider in the module becomes globally injectable."**

You still need to export the provider.

For example:

```ts
@Global()
@Module({
  providers: [
    ConfigService,
  ],

  exports: [
    ConfigService,
  ],
})
export class ConfigModule {}
```

The relevant provider is:

```text
ConfigService
```

because it is exported.

---

# 11. Don't make everything global

This is a common architectural mistake.

You might think:

```ts
@Global()
@Module({
  providers: [
    UserService,
    UrlService,
    PaymentService,
    DatabaseService,
  ],
})
```

Then everything becomes convenient.

But you've destroyed much of the explicit module dependency structure.

Instead of:

```text
UrlModule
    │
    └── imports DatabaseModule
```

you effectively get:

```text
Everything
    │
    └── can potentially access everything
```

That makes dependencies less obvious.

Use global modules for genuinely cross-cutting infrastructure, such as:

- configuration
    
- logging
    
- perhaps certain application-wide infrastructure
    

—not ordinary business features.

---

# 12. Global module ≠ global singleton

Another subtle distinction.

People often say:

> "Global module means singleton."

That's not the correct definition.

These are different concepts:

```text
Global
   ↓
Visibility / module availability


Singleton
   ↓
Provider instance lifetime / scope
```

A module can be global without that being the fundamental reason its providers have a particular lifecycle.

Keep these concepts separate.

---

# 13. Feature modules vs infrastructure modules

For your backend architecture, I would generally distinguish:

### Feature modules

```text
UrlModule
UserModule
AuthModule
AnalyticsModule
```

They represent application capabilities.

### Infrastructure modules

```text
DatabaseModule
LoggerModule
CacheModule
MessagingModule
```

They provide technical capabilities.

So:

```text
                    AppModule
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      UrlModule    UserModule   AuthModule
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                Infrastructure
                  Modules
               ┌──────┼──────┐
               ▼      ▼      ▼
           Database  Cache  Logger
```

This is not a requirement imposed by Nest, but it's a useful architectural organization.

---

# 14. Now connect this to Clean Architecture

This becomes particularly relevant to your existing architecture.

Suppose:

```text
UrlModule
│
├── presentation
│   └── UrlController
│
├── application
│   └── CreateUrlUseCase
│
├── domain
│   └── UrlRepository
│
└── infrastructure
    └── PrismaUrlRepository
```

You might have:

```ts
@Module({
  controllers: [
    UrlController,
  ],

  providers: [
    CreateUrlUseCase,

    {
      provide: URL_REPOSITORY,
      useClass: PrismaUrlRepository,
    },
  ],
})
export class UrlModule {}
```

Here Nest is acting as the **composition mechanism**.

Your architecture says:

```text
CreateUrlUseCase
        │
        ▼
 URL_REPOSITORY
```

Nest wires:

```text
URL_REPOSITORY
       │
       ▼
PrismaUrlRepository
```

So the module is where the runtime dependency graph gets assembled.

That's a very important role for Nest modules in Clean Architecture.

---

# 15. The module is a composition root — but not necessarily the only one

A useful way to think about a feature module is:

```text
                 UrlModule
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      Controller   UseCase   Repository
                              │
                              ▼
                           Prisma
```

The module tells Nest:

> "These are the components that make this feature work, and this is how their dependencies should be wired."

This is why you'll often see provider bindings like:

```ts
{
  provide: URL_REPOSITORY,
  useClass: PrismaUrlRepository,
}
```

inside the module.

The module is participating in **runtime composition**.

---

# 16. What we have learned in Lesson 1

At this point, our module model is:

```text
                       MODULE
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    imports          providers       controllers
        │                │
        │                │
        ▼                ▼
 other modules       DI registry
                         │
                         ▼
                      exports
                         │
                         ▼
                 public module API
```

And additionally:

```text
@Global()
   ↓
makes exported providers globally available
```

and:

```text
exports: [SomeModule]
   ↓
re-export another module's public API
```

---

# 17. The architectural rules

For now, retain these:

### Rule 1

```ts
providers: [X]
```

means:

> Register `X` in this module.

### Rule 2

```ts
exports: [X]
```

means:

> Make `X` available to modules consuming this module.

### Rule 3

```ts
imports: [XModule]
```

means:

> Allow this module to consume the exported API of `XModule`.

### Rule 4

```ts
exports: [XModule]
```

means:

> Re-export `XModule`'s public API.

### Rule 5

```ts
@Global()
```

means:

> Make the module's exported providers available application-wide without requiring consumers to explicitly import the module.

---

# 18. One complete example

```ts
// database.module.ts

@Module({
  providers: [
    DatabaseService,
  ],

  // DatabaseService is the public API.
  exports: [
    DatabaseService,
  ],
})
export class DatabaseModule {}
```

```ts
// persistence.module.ts

@Module({

  // PersistenceModule internally uses DatabaseModule.
  imports: [
    DatabaseModule,
  ],

  // Re-export DatabaseModule so consumers of
  // PersistenceModule can access its public API.
  exports: [
    DatabaseModule,
  ],
})
export class PersistenceModule {}
```

```ts
// url.module.ts

@Module({

  // URL feature depends on persistence infrastructure.
  imports: [
    PersistenceModule,
  ],

  controllers: [
    UrlController,
  ],

  providers: [
    UrlService,
  ],
})
export class UrlModule {}
```

The resulting relationship:

```text
                         UrlModule
                             │
                         imports
                             ▼
                    PersistenceModule
                             │
                        re-exports
                             ▼
                     DatabaseModule
                             │
                          exports
                             ▼
                    DatabaseService
```

That is **module composition**.

---

## Next: Dynamic Modules

We've now covered the static module system:

```text
@Module()
├── imports
├── controllers
├── providers
└── exports

@Global()
module visibility

re-exporting
module composition
```

The next major concept is **Dynamic Modules**:

```ts
@Module({
  ...
})
```

versus:

```ts
ConfigModule.forRoot({
  isGlobal: true,
})
```

We'll build `DatabaseModule.forRoot()` ourselves and understand **why Nest has `forRoot()`, `forFeature()`, `register()`, dynamic module metadata, configuration providers, and how this is used by real libraries such as database/config modules**.