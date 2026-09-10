# Modules

Now we move to one of the **most fundamental concepts in NestJS architecture**: **Modules**.

You already saw modules while learning providers:

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

Now let's understand **why this structure exists, what Nest does with it, and how modules control the visibility of providers**.

---

# 1. What is a Module?

A NestJS module is simply a class decorated with:

```typescript
@Module()
```

For example:

```typescript
@Module({})
export class CatsModule {}
```

The class itself:

```typescript
class CatsModule {}
```

is just a TypeScript class.

The important part is:

```typescript
@Module({})
```

The `@Module()` decorator attaches **metadata** that tells Nest how this part of the application should be organized and connected.

So:

```text
CatsModule
    │
    └── @Module(...)
             │
             ▼
       Nest metadata
             │
             ▼
       Nest understands:
       - controllers
       - providers
       - imports
       - exports
```

---

# 2. Why does Nest need Modules?

As an application grows, you can have hundreds of classes:

```text
Controllers
Services
Repositories
Factories
Guards
Pipes
Clients
Helpers
...
```

Putting all of these into one global collection would make dependency management difficult.

Instead, Nest organizes related components into **modules**.

For example, in a URL shortener:

```text
Application
│
├── AuthModule
│   ├── AuthController
│   ├── AuthService
│   └── AuthRepository
│
├── UrlModule
│   ├── UrlController
│   ├── UrlService
│   └── UrlRepository
│
├── AnalyticsModule
│   ├── AnalyticsController
│   └── AnalyticsService
│
└── NotificationModule
    ├── NotificationService
    └── NotificationRepository
```

Each module represents a **closely related capability**.

This is the key architectural purpose of modules:

> **Modules organize related components and define how those components are connected and exposed to other parts of the application.**

---

# 3. Every Nest application has a Root Module

Every Nest application has at least one module.

This is the **root module**.

Typically:

```typescript
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

And in `main.ts`:

```typescript
const app = await NestFactory.create(AppModule);
```

This means:

```text
main.ts
   │
   ▼
NestFactory.create(AppModule)
   │
   ▼
AppModule
   │
   ▼
Nest begins building application graph
```

The root module is therefore the **starting point** from which Nest discovers the rest of the application.

---

# 4. Application Graph

This is an important NestJS term.

Nest builds an internal **application graph**.

Suppose:

```text
AppModule
   │
   ├── AuthModule
   │
   ├── UrlModule
   │
   └── AnalyticsModule
```

And:

```text
UrlModule
   │
   └── UrlService
```

while:

```text
AnalyticsModule
   │
   └── AnalyticsService
```

Nest needs to understand relationships such as:

```text
Which modules exist?
        ↓
Which providers belong to them?
        ↓
Which modules import other modules?
        ↓
Which providers are exported?
        ↓
Which dependencies can be injected?
```

This collection of relationships forms the application's **dependency/module graph**.

Conceptually:

```text
                 AppModule
                /    |     \
               /     |      \
              ▼      ▼       ▼
          AuthModule UrlModule AnalyticsModule
              │          │           │
              ▼          ▼           ▼
          AuthService UrlService AnalyticsService
```

Nest uses this structure when resolving dependencies.

---

# 5. The Four Important Module Properties

`@Module()` accepts metadata:

```typescript
@Module({
  providers: [],
  controllers: [],
  imports: [],
  exports: [],
})
```

These four properties are the core of Nest modules.

Think of them as:

```text
@Module({
  providers:   "What this module owns"
  controllers: "What HTTP controllers this module contains"
  imports:     "Which other modules it can use"
  exports:     "What this module exposes"
})
```

Let's understand each one.

---

# 6. `providers`

```typescript
@Module({
  providers: [CatsService],
})
export class CatsModule {}
```

This tells Nest:

> `CatsService` is a provider belonging to this module and should be managed by the Nest injector.

So:

```text
CatsModule
    │
    └── providers
           │
           └── CatsService
```

Nest can then resolve:

```typescript
constructor(
  private readonly catsService: CatsService,
) {}
```

for a controller/provider that belongs to the appropriate module context.

---

# 7. `controllers`

```typescript
@Module({
  controllers: [CatsController],
})
export class CatsModule {}
```

This tells Nest:

> `CatsController` is a controller belonging to this module and should be instantiated.

So:

```text
CatsModule
    │
    ├── Controllers
    │      └── CatsController
    │
    └── Providers
           └── CatsService
```

The module therefore groups the HTTP layer and its supporting application logic.

---

# 8. Typical Module

Combining both:

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

This gives us:

```text
CatsModule
│
├── CatsController
│
└── CatsService
```

The controller can then receive the service:

```typescript
@Controller('cats')
export class CatsController {
  constructor(
    private readonly catsService: CatsService,
  ) {}
}
```

because `CatsService` is registered as a provider in the module.

---

# 9. `imports`

Now suppose another module provides something our module needs.

For example:

```text
CatsModule
    │
    └── needs ConfigService
```

And:

```text
ConfigModule
    │
    └── provides ConfigService
```

CatsModule can import ConfigModule:

```typescript
@Module({
  imports: [ConfigModule],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

Conceptually:

```text
CatsModule
     │
     │ imports
     ▼
ConfigModule
```

`imports` establishes a **module dependency**.

But there's an important condition:

> Importing a module does not mean that every provider inside that module automatically becomes available.

The provider must be **exported** by the imported module.

This is where `exports` comes in.

---

# 10. `exports`

Suppose:

```typescript
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

Now `ConfigModule` is saying:

> "Other modules that import me may use `ConfigService`."

So:

```text
ConfigModule
│
├── providers
│      └── ConfigService
│
└── exports
       └── ConfigService
```

Then:

```typescript
@Module({
  imports: [ConfigModule],
})
export class CatsModule {}
```

allows `CatsModule` to use the exported provider.

```text
                 ConfigModule
                 │
                 ├── ConfigService
                 │
                 └── exports ConfigService
                          │
                          ▼
                       CatsModule
                          │
                          ▼
                    CatsService
```

And now:

```typescript
@Injectable()
export class CatsService {
  constructor(
    private readonly config: ConfigService,
  ) {}
}
```

can be resolved.

---

# 11. The Most Important Concept: Encapsulation

Nest modules **encapsulate providers by default**.

This is probably the most important sentence in this section.

Suppose:

```typescript
@Module({
  providers: [CatsService],
})
export class CatsModule {}
```

`CatsService` belongs to `CatsModule`.

Another module cannot simply do:

```typescript
@Module({
  imports: [CatsModule],
})
export class DogsModule {}
```

and assume it can inject `CatsService`.

Why?

Because `CatsService` has not been exported.

```text
CatsModule
│
└── CatsService
       │
       └── private to module
```

You need:

```typescript
@Module({
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

Now:

```text
CatsModule
│
├── CatsService
│
└── exports
       └── CatsService
```

Another module can import it:

```typescript
@Module({
  imports: [CatsModule],
})
export class DogsModule {}
```

and inject it.

---

# 12. `exports` is the Module's Public API

This is an extremely useful way to think about modules.

A module has:

```text
Internal implementation
        │
        ├── private providers
        ├── helpers
        ├── repositories
        └── services
               │
               ▼
          selected exports
               │
               ▼
       Public module API
```

For example:

```typescript
@Module({
  controllers: [CatsController],
  providers: [
    CatsService,
    CatsRepository,
    CatsValidator,
  ],
  exports: [CatsService],
})
export class CatsModule {}
```

From outside:

```text
CatsModule
│
├── CatsController       ❌ not public provider API
├── CatsService          ✅ exported
├── CatsRepository       ❌ not exported
└── CatsValidator        ❌ not exported
```

Another module should generally interact with the module through:

```text
CatsService
```

rather than reaching directly into:

```text
CatsRepository
CatsValidator
```

This creates a clean module boundary.

---

# 13. `imports` and `exports` work together

These two are easy to confuse.

### `exports`

Answers:

> **What does this module make available to other modules?**

### `imports`

Answers:

> **Which other modules does this module want to consume exported providers from?**

So:

```text
Module A
│
├── exports → Provider X
│
└───────────────┐
                │
                ▼
             Module B
                │
             imports A
                │
                ▼
          Can use Provider X
```

A common pattern is:

```typescript
@Module({
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

and:

```typescript
@Module({
  imports: [CatsModule],
  providers: [SomeOtherService],
})
export class OtherModule {}
```

---

# 14. Complete example

Let's put everything together.

### `cats.module.ts`

```typescript
@Module({
  controllers: [CatsController],
  providers: [
    CatsService,
    CatsRepository,
  ],
  exports: [
    CatsService,
  ],
})
export class CatsModule {}
```

This means:

```text
CatsModule
│
├── controllers
│     └── CatsController
│
├── providers
│     ├── CatsService
│     └── CatsRepository
│
└── exports
      └── CatsService
```

`CatsRepository` is internal.

`CatsService` is public.

---

### Another module

```typescript
@Module({
  imports: [CatsModule],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
```

Now:

```text
AnalyticsModule
       │
       │ imports
       ▼
  CatsModule
       │
       │ exports
       ▼
  CatsService
       │
       ▼
AnalyticsService
```

So:

```typescript
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly catsService: CatsService,
  ) {}
}
```

can receive `CatsService`.

But it should not be able to directly inject `CatsRepository` unless that provider is also exported.

---

# 15. Why this design is valuable

This gives us **encapsulation**.

Imagine your `CatsModule` internally changes:

```text
Old:
CatsService
    ↓
CatsRepository
    ↓
MongoDB
```

Later:

```text
New:
CatsService
    ↓
CatRepository interface
    ↓
PostgreSQL
```

Other modules don't need to know.

They simply consume:

```text
CatsService
```

The module hides its internal implementation.

This is very closely related to:

- encapsulation
    
- separation of concerns
    
- dependency inversion
    
- modular architecture
    
- SOLID principles
    

---

# 16. Module boundaries

You can therefore think of a module as a **boundary around a capability**.

For example, in your URL-shortener architecture:

```text
                 Application
                     │
       ┌─────────────┼──────────────┐
       ▼             ▼              ▼
   AuthModule     UrlModule    AnalyticsModule
       │             │              │
       │             │              │
       ▼             ▼              ▼
   AuthService    UrlService    AnalyticsService
       │             │              │
       ▼             ▼              ▼
   AuthRepository UrlRepository AnalyticsRepository
```

Each module owns its internal components.

Only deliberately exported providers cross module boundaries.

---

# 17. Don't think of `imports` as importing classes

This is an important distinction.

This:

```typescript
imports: [CatsModule]
```

is **not equivalent to**:

```typescript
import { CatsService } from './cats.service';
```

The TypeScript `import` statement:

```typescript
import { CatsService } from './cats.service';
```

is about **JavaScript/TypeScript module loading**.

Nest's:

```typescript
@Module({
  imports: [CatsModule],
})
```

is about the **Nest application dependency/module graph**.

They are different concepts.

You may have both:

```typescript
import { CatsModule } from './cats.module.js';

@Module({
  imports: [CatsModule],
})
```

The first makes the class available to TypeScript/JavaScript.

The second tells Nest:

> "This Nest module is a dependency of my module."

---

# 18. Module architecture in one diagram

Everything we've discussed can be summarized as:

```text
                         AppModule
                            │
                 ┌──────────┼──────────┐
                 │          │          │
                 ▼          ▼          ▼
            AuthModule   UrlModule  AnalyticsModule
                 │          │          │
          ┌──────┴───┐   ┌──┴────┐   └──────┐
          ▼          ▼   ▼       ▼          ▼
       Controller Service      Repository  Service
                     │
                     ▼
                Repository
```

Inside each module:

```text
Module
│
├── controllers
│
├── providers
│
├── imports ───────────► other modules
│
└── exports ───────────► public providers
```

And the visibility rule is:

```text
Provider
   │
   ▼
belongs to Module
   │
   ├── not exported
   │      ↓
   │   module-private
   │
   └── exported
          ↓
     available to
     importing modules
```

---

# 19. The four properties — final mental model

When you see:

```typescript
@Module({
  providers: [...],
  controllers: [...],
  imports: [...],
  exports: [...],
})
```

read it as:

```text
providers
   ↓
"What does this module own?"

controllers
   ↓
"What HTTP controllers belong here?"

imports
   ↓
"Which other modules do I depend on?"

exports
   ↓
"What do I expose to other modules?"
```

And the most important relationship:

```text
                 Module A
                    │
             exports Provider X
                    │
                    ▼
                 Module B
                    │
              imports Module A
                    │
                    ▼
             can inject X
```

### The core principle

> **A Nest module is an encapsulated unit of application functionality. It owns controllers/providers, can consume providers exported by imported modules, and can expose selected providers through `exports`.**

This module encapsulation is what allows a large Nest application to become a **dependency graph of well-defined capability boundaries**, rather than one giant collection of globally accessible services.