# Providers

Now we move from **Controllers → Providers**.

The important architectural shift is:

> **A controller handles the HTTP boundary; a provider contains reusable application logic that the controller delegates to.**

In the previous `CatsController`, the controller itself was responsible for handling the request. Now we introduce `CatsService` so that the controller doesn't need to manage cat data directly.

---

## 1. What exactly is a Provider?

A **provider** is a class or value that Nest can manage and make available as a dependency to other classes.

Nest's documentation describes services, repositories, factories, and helpers as common examples of providers.

The important property is not the name **service**.

The important property is:

```text
Can Nest inject this dependency into another class?
                    ↓
                   Yes
                    ↓
               Provider
```

So:

```text
Service       ──┐
Repository    ──┤
Factory       ──┼──> Providers
Helper        ──┤
Custom class  ──┘
```

A service is therefore **one type of provider**, not a synonym for provider.

---

# 2. Why do we need Providers?

Consider our previous controller.

We had something conceptually like:

```typescript
@Controller('cats')
export class CatsController {

  private readonly cats: Cat[] = [];

  @Post()
  create(@Body() cat: Cat) {
    this.cats.push(cat);
  }

  @Get()
  findAll() {
    return this.cats;
  }
}
```

This works, but now the controller is doing two different jobs:

```text
CatsController
│
├── HTTP handling
│   ├── POST /cats
│   └── GET /cats
│
└── Application/data logic
    ├── store cat
    └── retrieve cats
```

As the application grows, this becomes problematic.

A better separation is:

```text
CatsController
│
└── HTTP handling
       │
       ▼
CatsService
│
└── Application logic
       │
       ▼
Database / Repository
```

Therefore:

> **Controllers should handle HTTP requests and delegate more complex tasks to providers.**

This separation is one of the fundamental architectural patterns in Nest.

---

# 3. Creating `CatsService`

The documentation example creates:

```typescript
import { Injectable } from '@nestjs/common';
import type { Cat } from './interfaces/cat.interface.js';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: Cat) {
    this.cats.push(cat);
  }

  findAll(): Cat[] {
    return this.cats;
  }
}
```

Let's break this down carefully.

---

## 4. `CatsService` is just a class

At its core:

```typescript
export class CatsService {
}
```

is simply a JavaScript/TypeScript class.

There is nothing inherently special about the word `Service`.

This:

```typescript
class CatsService {}
```

is fundamentally just a class.

What makes it usable as a Nest-managed provider is the Nest metadata attached through:

```typescript
@Injectable()
```

---

# 5. `@Injectable()`

```typescript
@Injectable()
export class CatsService {
```

This is the important Nest-specific part.

`@Injectable()` marks the class as something that can participate in Nest's **Dependency Injection (DI)** system.

Conceptually:

```text
@Injectable()
      │
      ▼
Nest knows this class can participate
in dependency injection
      │
      ▼
Nest IoC container manages it
```

The documentation describes this as attaching metadata to the class so that `CatsService` can be managed by Nest's **IoC container**.

---

# 6. What is IoC?

**IoC = Inversion of Control.**

Normally, a class could create its own dependency:

```typescript
class CatsController {
  private catsService = new CatsService();
}
```

Here the controller itself controls the creation:

```text
CatsController
      │
      └── creates → CatsService
```

This creates tight coupling.

With Nest DI:

```typescript
class CatsController {
  constructor(private catsService: CatsService) {}
}
```

the controller says:

> "I need a `CatsService`."

It does **not** explicitly create it.

Nest takes responsibility for providing it:

```text
CatsController
      │
      │ "I need CatsService"
      ▼
Nest IoC Container
      │
      │ provides
      ▼
CatsService
```

That transfer of responsibility is the important idea behind **Inversion of Control**.

---

# 7. Dependency Injection

IoC is the broader architectural principle.

**Dependency Injection is one mechanism used to achieve IoC.**

For example:

```typescript
export class CatsController {
  constructor(private catsService: CatsService) {}
}
```

`CatsController` has a dependency:

```text
CatsController
       │
       └── depends on → CatsService
```

Nest injects that dependency through the constructor.

So:

```text
Dependency:
CatsService

Injection point:
CatsController constructor

Injector:
Nest IoC container
```

This is **constructor injection**.

---

# 8. Understanding the Constructor

The example uses:

```typescript
constructor(private catsService: CatsService) {}
```

This line contains several TypeScript concepts at once.

The long form would be:

```typescript
export class CatsController {

  private catsService: CatsService;

  constructor(catsService: CatsService) {
    this.catsService = catsService;
  }
}
```

The shorthand:

```typescript
constructor(private catsService: CatsService) {}
```

does both things simultaneously:

```text
1. Declares a property
2. Assigns the constructor argument to that property
```

So afterwards:

```typescript
this.catsService
```

is available throughout the class.

For example:

```typescript
this.catsService.findAll();
```

---

# 9. What Nest is actually doing

Suppose we have:

```typescript
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}
}
```

and:

```typescript
@Injectable()
export class CatsService {
}
```

At application startup, Nest examines the classes and their dependency metadata.

Conceptually:

```text
CatsController
      │
      │ requires
      ▼
CatsService
```

Nest's DI container resolves:

```text
"CatsController needs CatsService"
                 │
                 ▼
       Find CatsService provider
                 │
                 ▼
       Create/retrieve instance
                 │
                 ▼
       Pass it to constructor
                 │
                 ▼
       CatsController instance
```

The controller therefore doesn't need to write:

```typescript
new CatsService()
```

Nest handles the wiring.

---

# 10. This is the "wiring" Nest talks about

The documentation says Nest largely handles the responsibility of **"wiring up"** objects.

Consider a slightly larger application:

```text
CatsController
      │
      ▼
CatsService
      │
      ▼
CatsRepository
      │
      ▼
Database
```

Without DI, you might manually construct everything:

```typescript
const repository = new CatsRepository();
const service = new CatsService(repository);
const controller = new CatsController(service);
```

Nest allows you to declare those relationships and lets its container manage the construction.

Conceptually:

```text
             Nest IoC Container
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
CatsController   CatsService   CatsRepository
                     │
                     └──────────────►
```

This becomes increasingly valuable as dependency graphs become larger.

---

# 11. The `CatsService` logic

The service contains:

```typescript
private readonly cats: Cat[] = [];
```

This is the service's internal state.

Then:

```typescript
create(cat: Cat) {
  this.cats.push(cat);
}
```

adds a cat.

And:

```typescript
findAll(): Cat[] {
  return this.cats;
}
```

retrieves the cats.

So the service provides an API to the controller:

```text
CatsController
     │
     ├── catsService.create(cat)
     │
     └── catsService.findAll()
```

The controller doesn't need to know **how** the data is stored.

It only knows that the service provides these operations.

---

# 12. Updated Controller

The controller becomes:

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto.js';
import { CatsService } from './cats.service.js';
import type { Cat } from './interfaces/cat.interface.js';

@Controller('cats')
export class CatsController {

  constructor(private catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
```

Now look at the responsibilities.

### `POST /cats`

```text
HTTP Request
     │
     ▼
CatsController
     │
     │ @Body()
     ▼
createCatDto
     │
     ▼
CatsService.create()
     │
     ▼
Store cat
```

### `GET /cats`

```text
HTTP Request
     │
     ▼
CatsController
     │
     ▼
CatsService.findAll()
     │
     ▼
Cat[]
     │
     ▼
HTTP Response
```

The controller is now primarily an **HTTP adapter** around the application functionality.

---

# 13. Why this separation matters

Imagine later that cats are no longer stored in:

```typescript
private readonly cats: Cat[] = [];
```

Instead, we use PostgreSQL.

The controller shouldn't need to change from:

```typescript
@Get()
findAll() {
  return this.catsService.findAll();
}
```

The service/repository implementation can change internally:

```text
Before

CatsService
    ↓
Array


Later

CatsService
    ↓
CatsRepository
    ↓
PostgreSQL
```

The controller can continue talking to the service through the same interface.

This reduces coupling between:

```text
HTTP layer
```

and:

```text
Data/application layer
```

---

# 14. Provider ≠ only Service

This is extremely important.

You will frequently see:

```typescript
@Injectable()
export class CatsService {}
```

and beginners start thinking:

> Provider means Service.

That's incorrect.

A **provider** is the broader Nest DI concept.

Possible providers include:

```text
Service
Repository
Factory
Helper
Adapter
Client
Configuration provider
Custom value
Custom factory
```

For example:

```typescript
@Injectable()
export class CatsService {}
```

can be registered as a provider.

A repository can also be a provider:

```typescript
@Injectable()
export class CatsRepository {}
```

A custom factory can also produce a provider.

So:

```text
Provider
│
├── Service
├── Repository
├── Factory
├── Helper
└── Other injectable dependency
```

---

# 15. Where does the Module come into this?

This connects directly to the **Modules** topic we already studied.

A provider needs to be registered with a module.

For example:

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

Now the relationship becomes:

```text
CatsModule
│
├── Controllers
│     └── CatsController
│
└── Providers
      └── CatsService
```

And:

```text
CatsController
      │
      │ requires
      ▼
CatsService
      │
      │ registered in
      ▼
CatsModule
```

The module defines the **DI scope/context in which the provider is available**.

This is why providers and modules are tightly connected.

---

# 16. Complete Nest relationship

At this point, the architecture should look like:

```text
                     Nest Application
                           │
                           ▼
                       CatsModule
                       /        \
                      /          \
                     ▼            ▼
             CatsController    CatsService
                    │                │
                    │                │
              HTTP boundary     Application logic
                    │                │
                    └───────┬────────┘
                            │
                         DI relationship
```

More realistically:

```text
Client
  │
  │ HTTP
  ▼
CatsController
  │
  │ injected dependency
  ▼
CatsService
  │
  ▼
Repository / Database
```

And Nest's IoC container is responsible for constructing and connecting the objects.

---

# 17. One critical distinction

Keep these concepts separate:

### Provider

**What Nest manages/injects.**

```text
CatsService
```

### Dependency

**What another class requires.**

```text
CatsController → CatsService
```

### Dependency Injection

**The mechanism by which the dependency is supplied.**

```text
Nest → CatsController constructor → CatsService
```

### IoC Container

**The Nest runtime component responsible for resolving and wiring dependencies.**

```text
             IoC Container
                   │
          resolves dependencies
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
CatsController          CatsService
```

### `@Injectable()`

Marks a class so Nest can manage it within its DI system.

---

## Core mental model

For NestJS Providers, keep this chain in mind:

```text
Provider
   │
   │ registered in
   ▼
Module
   │
   │ managed by
   ▼
Nest IoC Container
   │
   │ injects into
   ▼
Dependent Class
```

For our example:

```text
CatsService
    │
    │ provider
    ▼
CatsModule
    │
    ▼
Nest IoC Container
    │
    │ injects
    ▼
CatsController
    │
    ▼
HTTP Request
```

The **next important concept** is therefore not another decorator. It is understanding **how Nest actually resolves and instantiates providers through Dependency Injection**, including provider registration, tokens, constructor resolution, and the provider lifecycle.