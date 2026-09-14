# Catch Everything

A catch-everything filter is used when you want **one exception filter to receive every unhandled exception**, regardless of its type.

## 1. `@Catch()` with No Arguments

Normally:

```typescript
@Catch(HttpException)
```

means:

> Catch `HttpException` exceptions.

But:

```typescript
@Catch()
```

means:

> Catch **all unhandled exception types**.

So:

```text
@Catch(HttpException)
       ↓
HttpException only


@Catch()
       ↓
Every unhandled exception
```

For example, it can receive:

```typescript
throw new NotFoundException();
throw new Error();
throw new TypeError();
throw new SomeCustomException();
```

---

# 2. `exception` Should Be `unknown`

Because the filter can receive **any exception type**, use:

```typescript
catch(exception: unknown, host: ArgumentsHost)
```

rather than:

```typescript
catch(exception: HttpException, ...)
```

Why?

Because there is no guarantee that the thrown value is a `HttpException`.

The filter must therefore determine what kind of exception it received.

---

# 3. Determining the HTTP Status

The example checks:

```typescript
const httpStatus =
  exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
```

This creates two paths:

```text
              exception
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
HttpException?          Other error
        │                   │
       YES                  NO
        ↓                   ↓
getStatus()                500
```

Therefore:

### Known HTTP exception

```typescript
throw new NotFoundException();
```

→ status:

```text
404
```

### Unknown exception

```typescript
throw new Error();
```

→ status:

```text
500
```

This gives the catch-everything filter a safe fallback for unexpected errors.

---

# 4. Platform-Agnostic Filter

The example does **not** directly use:

```typescript
Request
Response
```

from Express.

Instead, it uses:

```typescript
HttpAdapterHost
```

from:

```typescript
@nestjs/core
```

```typescript
constructor(
  private readonly httpAdapterHost: HttpAdapterHost,
) {}
```

Then:

```typescript
const { httpAdapter } = this.httpAdapterHost;
```

The HTTP adapter provides a common abstraction over the underlying HTTP platform.

```text
              NestJS Filter
                   │
                   ↓
            HTTP Adapter
             /         \
            ↓           ↓
        Express      Fastify
```

Therefore the same filter can work with both Express and Fastify.

---

# 5. Why Use `HttpAdapterHost`?

Previously, the filter used:

```typescript
import { Request, Response } from 'express';
```

and:

```typescript
response.json(...)
```

That makes the filter **Express-specific**.

The catch-everything example instead uses:

```typescript
httpAdapter.reply(...)
```

and:

```typescript
httpAdapter.getRequestUrl(...)
```

These are Nest's adapter-level abstractions.

So:

```text
Express-specific
    ↓
Response.json()
    ↓
Works specifically with Express


Adapter-based
    ↓
httpAdapter.reply()
    ↓
Express / Fastify
```

This is especially useful for reusable infrastructure-level exception filters.

---

# 6. Getting Request URL

First switch to HTTP context:

```typescript
const ctx = host.switchToHttp();
```

Then:

```typescript
ctx.getRequest()
```

gets the underlying request.

Instead of directly accessing:

```typescript
request.url
```

the adapter provides:

```typescript
httpAdapter.getRequestUrl(
  ctx.getRequest(),
);
```

This keeps the filter platform-agnostic.

---

# 7. Sending the Response

The filter constructs:

```typescript
const responseBody = {
  statusCode: httpStatus,
  timestamp: new Date().toISOString(),
  path: httpAdapter.getRequestUrl(ctx.getRequest()),
};
```

Then sends it through:

```typescript
httpAdapter.reply(
  ctx.getResponse(),
  responseBody,
  httpStatus,
);
```

Conceptually:

```text
Exception
   ↓
Determine status
   ↓
Build response body
   ↓
HTTP Adapter
   ↓
Send response
```

---

# 8. Complete Flow

```text
Request
   ↓
Controller / Service
   ↓
throw exception
   ↓
Nest Exceptions Layer
   ↓
@Catch()
   ↓
CatchEverythingFilter
   │
   ├── HttpException?
   │       │
   │       ├── yes → exception.getStatus()
   │       │
   │       └── no  → 500
   │
   ↓
Build response
   ↓
HttpAdapter
   ↓
Express / Fastify
   ↓
Client
```

---

# Catch-Everything Filter Example

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class CatchEverythingFilter
  implements ExceptionFilter
{
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  catch(
    exception: unknown,
    host: ArgumentsHost,
  ): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(
        ctx.getRequest(),
      ),
    };

    httpAdapter.reply(
      ctx.getResponse(),
      responseBody,
      httpStatus,
    );
  }
}
```

---

# 9. Catch-Everything + Specific Filter

You can have:

```typescript
@Catch(HttpException)
class HttpExceptionFilter {}

@Catch()
class CatchEverythingFilter {}
```

The first is **specific**, while the second catches everything.

When combining them, Nest's documentation specifies that the **catch-everything filter should be declared first**, so that the more specific filter can still handle the exception type it targets.

Conceptually:

```text
CatchEverythingFilter
      ↓
fallback

HttpExceptionFilter
      ↓
specific HttpException handling
```

The important revision point is:

> **`@Catch()` is the fallback/wildcard filter; when combined with specific filters, declaration order matters.**

---

# Inheritance — Extending `BaseExceptionFilter`

Sometimes you don't want to completely replace Nest's built-in exception handling.

Instead, you may want:

> "Use Nest's normal exception handling, but add my own behavior."

For that, Nest provides:

```typescript
BaseExceptionFilter
```

from:

```typescript
@nestjs/core
```

---

## 10. Basic Inheritance

```typescript
import {
  Catch,
  ArgumentsHost,
} from '@nestjs/common';

import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter
  extends BaseExceptionFilter
{
  catch(
    exception: unknown,
    host: ArgumentsHost,
  ) {
    super.catch(exception, host);
  }
}
```

Here:

```text
AllExceptionsFilter
       │
       │ extends
       ↓
BaseExceptionFilter
       │
       ↓
Nest's built-in exception handling
```

The key method is:

```typescript
super.catch(exception, host);
```

This delegates processing back to the base filter.

---

# 11. Why Extend Instead of Reimplement?

There are two approaches.

### Completely custom

```text
Custom Filter
    ↓
You determine status
    ↓
You construct response
    ↓
You send response
```

You are responsible for the complete behavior.

### Extend `BaseExceptionFilter`

```text
Custom Filter
    ↓
your additional logic
    ↓
super.catch(...)
    ↓
Nest BaseExceptionFilter
    ↓
normal Nest exception handling
```

This is useful when you only want to **augment or selectively override** the built-in behavior.

For example:

```typescript
@Catch()
export class AllExceptionsFilter
  extends BaseExceptionFilter
{
  catch(
    exception: unknown,
    host: ArgumentsHost,
  ) {
    // custom logging

    console.error(exception);

    // delegate actual response handling
    super.catch(exception, host);
  }
}
```

---

# 12. Important Instantiation Rule

For **method-scoped or controller-scoped filters** that extend `BaseExceptionFilter`:

> Do **not** instantiate them with `new`.

Let Nest instantiate the filter.

This matters because `BaseExceptionFilter` relies on the HTTP adapter/context managed by Nest.

So prefer:

```typescript
@UseFilters(AllExceptionsFilter)
```

rather than:

```typescript
@UseFilters(new AllExceptionsFilter())
```

when using this inheritance approach.

---

# 13. Global `BaseExceptionFilter`

A global filter extending `BaseExceptionFilter` needs access to the `HttpAdapter`.

One approach is to obtain it during bootstrap:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { httpAdapter } =
    app.get(HttpAdapterHost);

  app.useGlobalFilters(
    new AllExceptionsFilter(httpAdapter),
  );

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
```

The flow is:

```text
Nest Application
      ↓
HttpAdapterHost
      ↓
HttpAdapter
      ↓
AllExceptionsFilter
      ↓
useGlobalFilters()
```

Another approach is to register the filter through:

```typescript
APP_FILTER
```

which allows Nest's DI system to manage the filter.

---

# Most Important Distinctions

|Concept|Meaning|
|---|---|
|`@Catch(HttpException)`|Catch specific exception type|
|`@Catch()`|Catch every exception|
|`ExceptionFilter<T>`|Filter contract|
|`ArgumentsHost`|Access execution context|
|`HttpAdapterHost`|Access Nest's HTTP adapter|
|`HttpAdapter`|Platform-independent HTTP operations|
|`BaseExceptionFilter`|Nest's built-in exception-filter behavior|
|`super.catch()`|Delegate handling to base filter|
|`APP_FILTER`|Register a global filter through Nest DI|

### Mental model

```text
                  Exception Filter
                        │
          ┌─────────────┴─────────────┐
          ↓                           ↓
     Fully Custom                 Inherit
          │                           │
      @Catch(...)               BaseExceptionFilter
          │                           │
      own response              custom logic
          │                           │
          ↓                           ↓
    httpAdapter.reply()          super.catch()
```

**The key idea:** `@Catch()` controls **what the filter catches**, while inheritance from `BaseExceptionFilter` controls **whether you replace Nest's default exception handling or build on top of it**.