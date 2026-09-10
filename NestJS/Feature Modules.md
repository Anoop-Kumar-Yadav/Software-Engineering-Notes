# Feature Modules

Now we move from the **general concept of Modules** to a very important architectural use of them: **Feature Modules**.

The idea is simple:

> **A feature module groups all the components that belong to one application capability/domain into a single module boundary.**

In our example, `CatsController` and `CatsService` both belong to the **Cats** feature, so they should live together inside `CatsModule`.

---

## 1. Why create a Feature Module?

Previously, we had:

```text
src/
├── cats.controller.ts
├── cats.service.ts
├── app.module.ts
└── main.ts
```

As the application grows, imagine:

```text
src/
├── auth.controller.ts
├── auth.service.ts
├── users.controller.ts
├── users.service.ts
├── cats.controller.ts
├── cats.service.ts
├── orders.controller.ts
├── orders.service.ts
├── payments.controller.ts
├── payments.service.ts
...
```

Everything starts accumulating inside `src`.

Instead, organize by **feature**:

```text
src/
├── cats/
├── auth/
├── users/
├── orders/
└── payments/
```

Now each feature owns its related code.

This is the core idea behind a **feature module**.

---

# 2. What does "feature" mean?

A feature is a cohesive application capability.

For example, in a URL shortener:

```text
Auth
URL Management
Analytics
Users
Notifications
```

Each can become a feature module:

```text
AuthModule
UrlModule
AnalyticsModule
UsersModule
NotificationModule
```

For the current example:

```text
Cats feature
    │
    ├── CatsController
    └── CatsService
```

So:

```text
CatsModule
    │
    ├── Controller
    └── Service
```

---

# 3. Creating `CatsModule`

The module is:

```typescript
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

Notice that this is exactly the relationship we learned previously.

```text
CatsModule
│
├── controllers
│     └── CatsController
│
└── providers
      └── CatsService
```

Therefore the module becomes the **container/boundary for the Cats feature**.

---

# 4. Why are Controller and Service together?

Because they have strong **feature cohesion**.

The controller:

```text
CatsController
```

handles HTTP requests related to cats.

The service:

```text
CatsService
```

contains application logic related to cats.

They have the same domain responsibility:

```text
                 CATS FEATURE
                      │
             ┌────────┴────────┐
             ▼                 ▼
      CatsController      CatsService
             │                 │
         HTTP layer       Application logic
```

Keeping them together makes the ownership clear.

---

# 5. Feature directory

Nest recommends moving everything belonging to this feature into the feature directory.

So:

```text
src/
│
├── cats/
│   ├── dto/
│   │   └── create-cat.dto.ts
│   │
│   ├── interfaces/
│   │   └── cat.interface.ts
│   │
│   ├── cats.controller.ts
│   ├── cats.module.ts
│   └── cats.service.ts
│
├── app.module.ts
└── main.ts
```

Now you can look at:

```text
cats/
```

and immediately understand:

> "Everything related to the Cats feature is here."

That's a major advantage as the project becomes larger.

---

# 6. But creating `CatsModule` is not enough

This is a very important point.

We have:

```typescript
export class CatsModule {}
```

But Nest doesn't automatically discover every module in `src`.

The module needs to become part of the application's module graph.

That's done by importing it into the root module.

---

# 7. Importing `CatsModule` into `AppModule`

`app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [CatsModule],
})
export class AppModule {}
```

Now the application graph becomes:

```text
AppModule
    │
    └── imports
           │
           ▼
       CatsModule
        /      \
       ▼        ▼
CatsController CatsService
```

This is what connects the feature module to the application.

---

# 8. `AppModule` as the root

Remember our previous discussion:

```typescript
NestFactory.create(AppModule)
```

in `main.ts`.

Therefore:

```text
main.ts
   │
   ▼
AppModule
   │
   ▼
CatsModule
   │
   ├── CatsController
   └── CatsService
```

Nest starts at `AppModule` and discovers the imported `CatsModule`.

This is why the documentation describes the root module as the starting point for building the application graph.

---

# 9. Important: TypeScript import vs Nest `imports`

Here we have:

```typescript
import { CatsModule } from './cats/cats.module.js';
```

and:

```typescript
@Module({
  imports: [CatsModule],
})
```

They have different purposes.

### TypeScript import

```typescript
import { CatsModule } from './cats/cats.module.js';
```

means:

> Make the `CatsModule` class available in this source file.

### Nest module `imports`

```typescript
imports: [CatsModule]
```

means:

> Make this Nest module part of this module's Nest application/dependency graph.

So the complete process is:

```text
TypeScript import
       │
       ▼
CatsModule class available
       │
       ▼
@Module({ imports: [CatsModule] })
       │
       ▼
Nest knows about the module relationship
```

---

# 10. What happens to the controller?

Once:

```typescript
@Module({
  imports: [CatsModule],
})
export class AppModule {}
```

is configured, Nest discovers:

```text
AppModule
    │
    ▼
CatsModule
    │
    ├── CatsController
    └── CatsService
```

Nest can instantiate the controller and register its routes.

So:

```typescript
@Controller('cats')
export class CatsController {}
```

eventually contributes routes such as:

```text
POST   /cats
GET    /cats
GET    /cats/:id
PUT    /cats/:id
DELETE /cats/:id
```

The controller is discovered because it belongs to a module that belongs to the application graph.

---

# 11. Feature Module ≠ just a folder

This distinction matters.

You might think:

> "Feature module means putting related files into a folder."

The folder is useful, but the **module itself is more than organization**.

The module establishes:

```text
Feature boundary
       +
Provider ownership
       +
Dependency visibility
       +
Module relationships
```

So:

```text
cats/
```

is filesystem organization.

While:

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

is **Nest architectural organization**.

Both work together.

---

# 12. Feature modules and encapsulation

This connects directly to the previous topic.

Suppose later:

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

Then:

```text
CatsModule
│
├── CatsController
├── CatsService       ← public
├── CatsRepository    ← internal
└── CatsValidator     ← internal
```

Another feature doesn't need to know how Cats works internally.

It interacts through the module's public API:

```text
OtherModule
     │
     ▼
 CatsModule
     │
     ▼
 CatsService
```

This is exactly why feature modules become valuable in large applications.

---

# 13. Feature modules and team scalability

The documentation also mentions that this becomes particularly important as the application or team grows.

Consider a large project:

```text
src/
├── auth/
├── users/
├── urls/
├── analytics/
├── notifications/
├── billing/
└── admin/
```

A developer working on URL shortening can primarily work inside:

```text
urls/
```

while another developer works inside:

```text
analytics/
```

The boundaries reduce unnecessary coupling.

The architecture communicates ownership:

```text
URL functionality
      ↓
UrlModule

Analytics functionality
      ↓
AnalyticsModule

Authentication functionality
      ↓
AuthModule
```

---

# 14. For your URL-shortener architecture

This becomes particularly useful for your `url-service`.

A reasonable Nest feature structure could eventually look like:

```text
src/
│
├── url/
│   ├── url.controller.ts
│   ├── url.service.ts
│   ├── url.module.ts
│   └── ...
│
├── redirect/
│   ├── redirect.controller.ts
│   ├── redirect.service.ts
│   ├── redirect.module.ts
│   └── ...
│
├── analytics/
│   ├── analytics.controller.ts
│   ├── analytics.service.ts
│   ├── analytics.module.ts
│   └── ...
│
├── app.module.ts
└── main.ts
```

Then:

```text
                    AppModule
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      UrlModule   RedirectModule AnalyticsModule
          │            │            │
          ▼            ▼            ▼
     URL logic     Redirect logic Analytics logic
```

The exact boundaries depend on the application, but the principle is:

> **Organize modules around cohesive capabilities, not merely around technical class types.**

---

# 15. The complete flow

This is the flow you should retain:

```text
main.ts
   │
   │ NestFactory.create(AppModule)
   ▼
AppModule
   │
   │ imports
   ▼
CatsModule
   │
   ├── controllers
   │       │
   │       ▼
   │   CatsController
   │       │
   │       ▼
   │    HTTP routes
   │
   └── providers
           │
           ▼
       CatsService
```

And internally:

```text
HTTP Request
     │
     ▼
CatsController
     │
     │ dependency injection
     ▼
CatsService
     │
     ▼
Application logic
```

---

## Core mental model

Don't think of a feature module as merely:

> "A folder containing related files."

Think of it as:

> **A Nest architectural boundary that groups the components responsible for a specific application capability and defines how that capability participates in the overall dependency graph.**

For this example:

```text
                 AppModule
                     │
                  imports
                     ▼
                 CatsModule
                /          \
               ▼            ▼
      CatsController     CatsService
          │                   │
      HTTP layer        Application logic
```

And as we continue with modules, the next important concept is **module encapsulation in practice: `exports` + `imports` and how a provider from one feature module becomes available to another feature module**.