# Binding Exception Filters

**Binding** means deciding **where a custom exception filter should be applied**.

NestJS provides three main scopes:

```text
Method-scoped
     ↓
Controller-scoped
     ↓
Global-scoped
```

The same filter class can be bound at any of these levels.

---

## 1. `@UseFilters()`

`@UseFilters()` is the primary decorator for binding an exception filter to controllers or individual route handlers.

```typescript
import { UseFilters } from '@nestjs/common';
```

It can receive:

- a filter **instance**
    
- a filter **class**
    
- multiple filters
    

---

## 2. Method-Scoped Filter

If you put `@UseFilters()` directly on a route handler:

```typescript
@Post()
@UseFilters(HttpExceptionFilter)
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
```

the filter applies **only to that route handler**.

```text
CatsController
│
├── GET /cats
│
├── GET /cats/:id
│
└── POST /cats
       │
       └── HttpExceptionFilter ✓
```

So if `GET /cats` throws an exception, this filter is not applied.

### Scope

```text
@UseFilters() on method
        ↓
Method-scoped
        ↓
Only that route handler
```

---

# 3. Filter Instance vs Filter Class

You can write:

```typescript
@UseFilters(new HttpExceptionFilter())
```

or:

```typescript
@UseFilters(HttpExceptionFilter)
```

Both associate the filter with the route, but there is an important difference.

### Instance

```typescript
@UseFilters(new HttpExceptionFilter())
```

You create the filter yourself.

```text
Your code
   ↓
new HttpExceptionFilter()
   ↓
Filter instance
```

Therefore, Nest is not responsible for constructing that instance through its DI system.

---

### Class

```typescript
@UseFilters(HttpExceptionFilter)
```

You provide the class and let Nest instantiate/manage it.

```text
HttpExceptionFilter class
        ↓
Nest
        ↓
creates/manages instance
        ↓
uses filter
```

This also allows **dependency injection** into the filter.

For example:

```typescript
@Catch(HttpException)
export class HttpExceptionFilter
  implements ExceptionFilter<HttpException>
{
  constructor(
    private readonly logger: LoggerService,
  ) {}

  catch(
    exception: HttpException,
    host: ArgumentsHost,
  ) {
    // ...
  }
}
```

If you manually write:

```typescript
new HttpExceptionFilter()
```

you would have to provide the dependencies yourself.

### Recommended

Prefer:

```typescript
@UseFilters(HttpExceptionFilter)
```

over:

```typescript
@UseFilters(new HttpExceptionFilter())
```

when possible.

Nest can reuse managed instances, reducing unnecessary instance creation and memory usage.

---

# 4. Controller-Scoped Filter

You can apply a filter to the entire controller:

```typescript
@Controller()
@UseFilters(HttpExceptionFilter)
export class CatsController {}
```

Now the filter applies to **every route handler in `CatsController`**.

```text
CatsController
       │
       ├── GET /cats       → Filter ✓
       ├── POST /cats      → Filter ✓
       ├── PATCH /cats/:id → Filter ✓
       └── DELETE /cats/:id → Filter ✓
```

So:

```text
@UseFilters() on controller
        ↓
Controller-scoped
        ↓
All handlers in that controller
```

---

# 5. Global-Scoped Filter

A global filter applies across the application.

Register it in `main.ts`:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
```

Now:

```text
Application
│
├── CatsController
│    ├── GET
│    └── POST
│
├── UsersController
│    ├── GET
│    └── POST
│
└── OrdersController
     ├── GET
     └── POST

        ↓

Global Exception Filter
        ↓
All controllers / route handlers
```

### Scope

```text
app.useGlobalFilters(...)
        ↓
Global-scoped
        ↓
Entire application
```

---

# 6. Important DI Limitation of `useGlobalFilters()`

This is a critical distinction.

When you write:

```typescript
app.useGlobalFilters(
  new HttpExceptionFilter(),
);
```

the filter is registered **outside a module's DI context**.

Therefore, Nest cannot inject module providers into that filter.

For example:

```typescript
export class HttpExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
  ) {}
}
```

You cannot expect Nest's normal module DI to provide `LoggerService` when the filter was manually instantiated with:

```typescript
new HttpExceptionFilter()
```

because **you created the instance yourself**.

---

# 7. Global Filter + Dependency Injection

To make a global filter participate in Nest's DI system, register it as a provider using:

```typescript
APP_FILTER
```

from:

```typescript
@nestjs/core
```

Example:

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

Now Nest manages the filter.

```text
AppModule
   │
   ↓
APP_FILTER
   │
   ↓
HttpExceptionFilter
   │
   ↓
Nest DI container
   │
   ├── LoggerService
   ├── ConfigService
   └── Other dependencies
```

The important point:

> Although `APP_FILTER` is registered inside a module, the resulting filter is **global**, not limited to that module.

---

# 8. `useGlobalFilters()` vs `APP_FILTER`

||`useGlobalFilters()`|`APP_FILTER`|
|---|---|---|
|Scope|Global|Global|
|Registration|`main.ts`|Module provider|
|Nest DI|Not available for manually created instance|Available|
|Typical usage|Simple filter with no DI|Production filter requiring services|

### Without DI

```typescript
app.useGlobalFilters(
  new HttpExceptionFilter(),
);
```

### With DI

```typescript
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

---

# 9. Where Should `APP_FILTER` Be Registered?

Nest's documentation recommends registering the provider in the module where the filter is **defined**.

For example:

```text
src/
├── common/
│   └── filters/
│       └── http-exception.filter.ts
│
└── common/
    └── common.module.ts
```

Then:

```typescript
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class CommonModule {}
```

Even though the provider is declared inside `CommonModule`, the filter remains:

```text
GLOBAL
```

It is **not CommonModule-scoped**.

---

# 10. Multiple Global Filters

You can register multiple filters:

```typescript
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
```

Each `APP_FILTER` provider contributes a global filter.

This allows different filters to specialize in different exception types.

For example:

```text
Global Filters
│
├── HttpExceptionFilter
│      ↓
│   HttpException
│
├── ValidationExceptionFilter
│      ↓
│   Validation errors
│
└── AllExceptionsFilter
       ↓
    unexpected exceptions
```

The exact behavior depends on the exception types targeted by each filter's `@Catch()` metadata.

---

# 11. Middleware Connection

This connects directly with what we covered in **Middleware error handling**.

Middleware executes **before Nest selects the controller route**.

Therefore:

```text
Request
   ↓
Middleware
   ↓
Route selection
   ↓
Controller
```

If middleware throws:

```typescript
throw new UnauthorizedException();
```

the exception enters Nest's exceptions layer.

But a method-scoped filter such as:

```typescript
@Post()
@UseFilters(HttpExceptionFilter)
```

cannot handle that middleware exception because Nest has not reached that route handler yet.

Therefore middleware exceptions can only be handled by **global filters**:

```typescript
app.useGlobalFilters(...)
```

or:

```typescript
APP_FILTER
```

Flow:

```text
HTTP Request
     ↓
Middleware
     │
     └── throw exception
              ↓
       Exceptions Layer
              ↓
       Global Filter ✓
```

Not:

```text
Middleware
    ↓
Controller-scoped filter ✗
```

---

# 12. Scope Summary

Keep this mental model:

```text
                    Exception Filter
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
       Method          Controller         Global
          │                │                │
          ↓                ↓                ↓
    One handler      One controller    Whole application
```

### Method

```typescript
@UseFilters(HttpExceptionFilter)
@Get()
findAll() {}
```

→ **one route handler**

### Controller

```typescript
@Controller()
@UseFilters(HttpExceptionFilter)
export class CatsController {}
```

→ **all routes in that controller**

### Global

```typescript
app.useGlobalFilters(
  new HttpExceptionFilter(),
);
```

or:

```typescript
{
  provide: APP_FILTER,
  useClass: HttpExceptionFilter,
}
```

→ **application-wide**

---

## Final Revision Points

- `@UseFilters()` binds filters to **methods or controllers**.
    
- It accepts filter **instances or classes**.
    
- Prefer **classes** so Nest can manage/reuse instances and provide DI.
    
- Method binding → only that handler.
    
- Controller binding → every handler in that controller.
    
- `app.useGlobalFilters()` → application-wide filter.
    
- A manually instantiated global filter via `useGlobalFilters(new ...)` does **not** get Nest module DI.
    
- `APP_FILTER` creates a **global filter through Nest's provider/DI system**.
    
- `APP_FILTER` remains global regardless of which module declares it.
    
- Multiple `APP_FILTER` providers can be registered.
    
- **Middleware exceptions require global filters**, because middleware executes before route selection.
    
- `@Catch()` determines **which exception types** a filter handles; binding determines **where that filter is active**.