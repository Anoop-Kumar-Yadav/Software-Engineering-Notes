# Lesson 1 — Modules, Part 2: What Nest Actually Does With `@Module()`

Now we go beneath the syntax.

You've seen:

```ts
@Module({
  imports: [DatabaseModule],
  controllers: [UrlController],
  providers: [UrlService],
  exports: [UrlService],
})
export class UrlModule {}
```

The key question now is:

> **What does Nest do with this object?**

---

# 1. `@Module()` is a decorator, not the module system itself

First separate these two concepts.

When you write:

```ts
@Module({
  providers: [UrlService],
})
export class UrlModule {}
```

there are two things involved:

```text
@Module(...)
   │
   ▼
Decorator
   │
   │ records module metadata
   ▼
UrlModule
   │
   ▼
Nest later reads that metadata
```

So `@Module()` itself isn't creating your DI container in the way you might initially imagine.

It primarily **describes the module**.

Conceptually:

```ts
@Module({
  providers: [UrlService],
})
```

is saying:

```text
UrlModule has:
    providers → UrlService
```

Nest later consumes that declaration during application initialization.

---

# 2. Think of `@Module()` as configuration

Consider:

```ts
@Module({
  controllers: [UrlController],
  providers: [UrlService],
})
export class UrlModule {}
```

Conceptually, Nest needs to obtain something equivalent to:

```ts
{
  controllers: [UrlController],
  providers: [UrlService],
}
```

and associate it with:

```ts
UrlModule
```

So mentally think:

```text
UrlModule
   │
   └── metadata
        ├── controllers
        └── providers
```

Nest's internal machinery then uses this metadata.

---

# 3. `NestFactory.create(AppModule)` starts the process

Your application starts with:

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
}
```

The critical line is:

```ts
NestFactory.create(AppModule)
```

You're effectively saying:

> "Nest, build an application whose root module is `AppModule`."

So Nest starts here:

```text
AppModule
    │
    ▼
discover module metadata
```

---

# 4. Nest recursively discovers modules

Suppose:

```ts
@Module({
  imports: [
    UrlModule,
    UserModule,
  ],
})
export class AppModule {}
```

Nest starts with:

```text
AppModule
```

It sees:

```ts
imports: [
  UrlModule,
  UserModule,
]
```

So it discovers:

```text
                 AppModule
                /         \
               ▼           ▼
          UrlModule    UserModule
```

Then suppose `UrlModule` has:

```ts
@Module({
  imports: [
    DatabaseModule,
  ],
})
export class UrlModule {}
```

Nest discovers:

```text
                 AppModule
                /         \
               ▼           ▼
          UrlModule    UserModule
               │
               ▼
        DatabaseModule
```

This is why we call it the **module graph**.

---

# 5. Nest doesn't stop at imports

For every module, Nest also examines:

```ts
@Module({
  imports: [...],
  controllers: [...],
  providers: [...],
  exports: [...],
})
```

So conceptually, Nest performs something like:

```text
For each discovered module:

    1. Find its imports
    2. Find its controllers
    3. Find its providers
    4. Find its exports
```

Then it creates the corresponding internal structures.

---

# 6. A useful mental model of Nest's container

Imagine Nest maintaining something like:

```text
Container
│
├── AppModule
│
├── UrlModule
│
├── UserModule
│
└── DatabaseModule
```

Each module has its own internal collection of providers/controllers.

Conceptually:

```text
Container
│
├── UrlModule
│    ├── providers
│    │    └── UrlService
│    │
│    └── controllers
│         └── UrlController
│
└── DatabaseModule
     └── providers
          └── DatabaseService
```

This isn't meant to represent Nest's exact private data structures; it's the right **conceptual model** for understanding the framework.

---

# 7. Module context matters

This explains an error you've probably seen:

```text
Nest can't resolve dependencies of the UrlService
(?).
Please make sure that the argument DatabaseService
is available in the UrlModule context.
```

Why does Nest mention:

```text
UrlModule context
```

?

Because `UrlService` belongs to:

```text
UrlModule
```

and Nest is resolving its dependencies **from that module's dependency context**.

Suppose:

```ts
@Injectable()
export class UrlService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}
}
```

Nest effectively needs to answer:

```text
UrlService
    │
    └── needs DatabaseService
                     │
                     ▼
             Where can I resolve it?
                     │
                     ▼
              UrlModule context
```

---

# 8. Provider registration

Consider:

```ts
@Module({
  providers: [
    UrlService,
  ],
})
export class UrlModule {}
```

Conceptually Nest records:

```text
UrlModule
   │
   └── UrlService
```

Then when it needs:

```ts
UrlService
```

Nest knows:

```text
UrlModule → UrlService
```

But there's another important layer.

A provider isn't necessarily instantiated immediately just because you've written:

```ts
providers: [UrlService]
```

The provider registration describes **how that token can be resolved**.

This is why Nest's provider system supports:

```ts
providers: [
  UrlService,
]
```

as well as:

```ts
providers: [
  {
    provide: 'URL_SERVICE',
    useClass: UrlService,
  },
]
```

or:

```ts
providers: [
  {
    provide: 'CONFIG',
    useValue: config,
  },
]
```

The module is therefore also a place where **DI provider definitions are registered**.

---

# 9. Token → Provider → Instance

This connects directly to the DI concepts we studied earlier.

Suppose:

```ts
@Module({
  providers: [
    UrlService,
  ],
})
export class UrlModule {}
```

Conceptually:

```text
Token
  │
  ▼
UrlService
  │
  ▼
Provider definition
  │
  ▼
Instance
```

When another class says:

```ts
constructor(
  private readonly urlService: UrlService,
) {}
```

Nest needs to resolve the token:

```text
UrlService
```

and produce the corresponding instance.

---

# 10. Now add `exports`

Suppose:

```ts
@Module({
  providers: [
    UrlService,
  ],

  exports: [
    UrlService,
  ],
})
export class UrlModule {}
```

Conceptually:

```text
UrlModule
│
├── Internal provider registry
│      └── UrlService
│
└── Exported providers
       └── UrlService
```

Now another module can consume that exported provider if it imports `UrlModule`.

---

# 11. `exports` creates a visibility boundary

This is the important architectural concept.

Suppose:

```text
UrlModule
│
├── UrlService
├── UrlRepository
├── UrlValidator
└── UrlMapper
```

and:

```ts
exports: [
  UrlService,
]
```

Then:

```text
                   UrlModule
        ┌─────────────────────────────┐
        │                             │
        │ UrlRepository               │
        │ UrlValidator                │
        │ UrlMapper                   │
        │                             │
        │ UrlService ─────────────┐   │
        └─────────────────────────┼───┘
                                  │
                              exported
                                  │
                                  ▼
                           importing module
```

This is very similar to an API boundary.

---

# 12. What `imports` really gives you

Now:

```ts
@Module({
  imports: [
    UrlModule,
})
export class UserModule {}
```

doesn't mean:

```text
UserModule gets everything inside UrlModule
```

Instead, conceptually:

```text
UserModule
     │
     │ imports
     ▼
UrlModule
     │
     │ exposes
     ▼
exported providers
```

So:

```text
imports → establishes access to another module's exports
```

That is the most useful mental model.

---

# 13. Let's build the complete example

### `database.module.ts`

```ts
@Module({
  // Register DatabaseService in DatabaseModule.
  providers: [
    DatabaseService,
  ],

  // Make DatabaseService available
  // to modules that import DatabaseModule.
  exports: [
    DatabaseService,
  ],
})
export class DatabaseModule {}
```

### `url.module.ts`

```ts
@Module({

  // UrlModule can consume providers
  // exported by DatabaseModule.
  imports: [
    DatabaseModule,
  ],

  // Register the HTTP controller.
  controllers: [
    UrlController,
  ],

  // Register the URL business service.
  providers: [
    UrlService,
  ],
})
export class UrlModule {}
```

### `url.service.ts`

```ts
@Injectable()
export class UrlService {

  constructor(
    // Nest resolves DatabaseService through
    // the UrlModule -> DatabaseModule relationship.
    private readonly databaseService: DatabaseService,
  ) {}

}
```

The resulting graph:

```text
                 AppModule
                     │
                     ▼
                 UrlModule
                /         \
               /           \
              ▼             ▼
     UrlController       UrlService
                              │
                              │ needs
                              ▼
                      DatabaseService
                              ▲
                              │ exported
                              │
                      DatabaseModule
```

---

# 14. One subtle point: module classes aren't service containers

You might be tempted to think:

```ts
export class UrlModule {}
```

is itself a container.

Not exactly.

The class:

```ts
UrlModule
```

is essentially the **identity/representation of the module**.

Nest's internal container manages the actual runtime structures associated with it.

Conceptually:

```text
UrlModule class
      │
      ▼
@Module metadata
      │
      ▼
Nest Container
      │
      ▼
Module runtime representation
      │
      ├── providers
      ├── controllers
      ├── imports
      └── exports
```

This distinction becomes useful when you eventually read Nest's source code.

---

# 15. Why this architecture scales

Imagine your URL shortener eventually has:

```text
AppModule
│
├── AuthModule
├── UserModule
├── UrlModule
├── AnalyticsModule
├── DatabaseModule
├── LoggerModule
└── ConfigModule
```

Each module defines its boundary.

For example:

```text
AuthModule
   │
   ├── AuthController
   ├── AuthService
   └── TokenService

UserModule
   │
   ├── UserController
   └── UserService

UrlModule
   │
   ├── UrlController
   ├── CreateUrlUseCase
   └── UrlRepository
```

Then dependencies are explicit:

```text
UrlModule
    │
    ├── imports DatabaseModule
    │
    └── imports AuthModule
```

rather than having every provider globally depend on every other provider.

---

# 16. Module = composition boundary

At this point, refine your definition.

### Beginner definition

> A module groups controllers and providers.

Correct, but incomplete.

### Better definition

> A module defines a boundary around a set of Nest components and controls how those components participate in the application's dependency graph.

### Deep definition

> A Nest module is a node in the application module graph. Its metadata declares imported modules, registered providers, registered controllers, and exported providers/modules. Nest uses this information during application initialization to construct its runtime container and establish dependency-resolution boundaries.

**That is the definition you should carry forward.**

---

# 17. One final diagram

When you write:

```ts
@Module({
  imports: [DatabaseModule],
  controllers: [UrlController],
  providers: [UrlService],
  exports: [UrlService],
})
export class UrlModule {}
```

mentally translate it to:

```text
                       UrlModule
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    imports           controllers         providers
        │                  │                  │
        ▼                  ▼                  ▼
DatabaseModule       UrlController       UrlService
        │
        │
        ▼
 exported providers
```

And:

```text
UrlModule
    │
    │ exports UrlService
    ▼
other modules
    │
    │ imports UrlModule
    ▼
can resolve UrlService
```

---

## Lesson 1 — Current checkpoint

You now have three levels of understanding:

### Level 1 — Syntax

```ts
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
```

### Level 2 — Architecture

```text
imports     → module dependencies
providers   → DI registrations
controllers → HTTP entry points
exports     → public provider/module API
```

### Level 3 — Runtime model

```text
NestFactory.create(AppModule)
             │
             ▼
      discover modules
             │
             ▼
       build module graph
             │
             ▼
    register providers/controllers
             │
             ▼
    establish provider visibility
             │
             ▼
      resolve dependencies
             │
             ▼
       initialize application
```

**Next:** we'll go into the most important practical module concepts: **module encapsulation, provider visibility, re-exporting, global modules, and dynamic modules**. We'll build each one with code and deliberately break the configuration so you can see exactly what Nest is doing.