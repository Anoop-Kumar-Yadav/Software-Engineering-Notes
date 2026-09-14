# Exception Filters

The built-in exception filter handles common cases automatically, but **custom exception filters give you explicit control over how exceptions are processed and what response is returned**.

Typical reasons to create one:

- Add custom error logging.
    
- Add request information such as URL.
    
- Return a standardized JSON error schema.
    
- Dynamically change the response based on the exception/request.
    
- Take direct control over the underlying HTTP response.
    

---

## 1. Basic Structure

A custom exception filter implements:

```typescript
ExceptionFilter<T>
```

and provides:

```typescript
catch(exception: T, host: ArgumentsHost)
```

Example:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter
  implements ExceptionFilter<HttpException>
{
  catch(
    exception: HttpException,
    host: ArgumentsHost,
  ) {
    // custom handling
  }
}
```

Think of the structure as:

```text
@Catch(HttpException)
        ↓
Which exceptions should this filter catch?
        ↓
ExceptionFilter<HttpException>
        ↓
What type of exception?
        ↓
catch(exception, host)
        ↓
How should it be handled?
```

---

# 2. `@Catch()`

`@Catch()` tells Nest **which exception types this filter is interested in**.

For example:

```typescript
@Catch(HttpException)
```

means:

> This filter handles exceptions that are instances of `HttpException`.

So:

```text
HttpException
   ↓
HttpExceptionFilter
```

But an unrelated exception such as:

```typescript
throw new Error('Database failed');
```

is not targeted by:

```typescript
@Catch(HttpException)
```

---

## Multiple Exception Types

`@Catch()` can accept multiple exception classes:

```typescript
@Catch(HttpException, TypeError)
```

Now the filter can handle both:

```text
HttpException ──┐
                ├──→ Filter
TypeError ──────┘
```

This makes `@Catch()` essentially the **exception matching metadata** for the filter.

---

# 3. `ExceptionFilter<T>`

Nest provides the:

```typescript
ExceptionFilter<T>
```

interface.

`T` represents the **exception type handled by the filter**.

Example:

```typescript
implements ExceptionFilter<HttpException>
```

means:

```text
This filter handles HttpException
```

Therefore:

```typescript
catch(
  exception: HttpException,
  host: ArgumentsHost,
)
```

matches the generic type.

The important relationship is:

```text
ExceptionFilter<T>
       ↓
       T = exception type
       ↓
catch(exception: T, host: ArgumentsHost)
```

---

# 4. `catch()` Method

The `catch()` method is where your custom exception-handling logic lives.

```typescript
catch(
  exception: HttpException,
  host: ArgumentsHost,
) {
  // handle exception
}
```

It receives two important values:

### `exception`

The actual exception that was thrown.

```typescript
exception: HttpException
```

You can extract information from it:

```typescript
exception.getStatus()
exception.getResponse()
```

### `host`

The execution context containing information about the current request.

```typescript
host: ArgumentsHost
```

For HTTP applications, you use it to obtain the underlying:

```text
Request
Response
```

---

# 5. `ArgumentsHost`

`ArgumentsHost` provides access to the arguments/context of the current execution.

For an HTTP request:

```typescript
const ctx = host.switchToHttp();
```

This switches the generic execution context to the **HTTP context**.

Then:

```typescript
const response = ctx.getResponse<Response>();
const request = ctx.getRequest<Request>();
```

Now you have the underlying Express objects.

Conceptually:

```text
ArgumentsHost
     │
     ↓
switchToHttp()
     │
     ├── getRequest()
     │       ↓
     │    Request
     │
     └── getResponse()
             ↓
          Response
```

This is why `ArgumentsHost` is important: Nest supports multiple application contexts, so the filter doesn't directly assume that the arguments are always HTTP request/response objects.

---

# 6. Getting the HTTP Status

The exception itself contains the HTTP status.

```typescript
const status = exception.getStatus();
```

For:

```typescript
throw new ForbiddenException();
```

you get:

```text
status = 403
```

You should generally obtain the status from the exception rather than hard-code it.

---

# 7. Taking Control of the Response

Once you obtain the Express `Response`:

```typescript
const response = ctx.getResponse<Response>();
```

you can directly construct the response:

```typescript
response
  .status(status)
  .json({
    statusCode: status,
    timestamp: new Date().toISOString(),
    path: request.url,
  });
```

This means the filter is now deciding exactly what the client receives.

For example:

```json
{
  "statusCode": 403,
  "timestamp": "2026-09-12T03:30:00.000Z",
  "path": "/cats"
}
```

So the responsibility is:

```text
Exception
    ↓
Filter
    ↓
extract information
    ↓
construct response
    ↓
send response
```

---

# 8. Complete Example

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter
  implements ExceptionFilter<HttpException>
{
  catch(
    exception: HttpException,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}
```

### Execution flow

Suppose the controller does:

```typescript
@Get()
findAll() {
  throw new ForbiddenException();
}
```

Flow:

```text
GET /cats
    ↓
Controller
    ↓
throw ForbiddenException
    ↓
Exception propagates
    ↓
Nest Exceptions Layer
    ↓
@Catch(HttpException)
    ↓
HttpExceptionFilter
    ↓
catch(exception, host)
    ↓
host.switchToHttp()
    ↓
getRequest() + getResponse()
    ↓
exception.getStatus()
    ↓
response.status(...).json(...)
    ↓
Client
```

---

# 9. Express vs Fastify

The filter concept is Nest-level, but the actual request/response objects come from the underlying HTTP platform.

### Express

```typescript
import { Request, Response } from 'express';
```

and:

```typescript
response
  .status(status)
  .json({...});
```

### Fastify

With `@nestjs/platform-fastify`, the response API differs.

Instead of:

```typescript
response.json(...)
```

you use:

```typescript
response.send(...)
```

So remember:

```text
Nest Exception Filter
        ↓
ArgumentsHost
        ↓
HTTP adapter
        ↓
Express / Fastify request-response API
```

This is also why filters that directly manipulate native `Request`/`Response` objects can become **platform-specific**.

---

## 10. Built-in Filter vs Custom Filter

The difference is important:

```text
Built-in Global Exception Filter
        ↓
Nest decides standard response


Custom Exception Filter
        ↓
YOU decide response structure
```

For example, built-in handling:

```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

Custom filter:

```json
{
  "statusCode": 403,
  "timestamp": "...",
  "path": "/cats"
}
```

The custom filter can therefore add things such as:

- timestamp
    
- request path
    
- request ID
    
- application error code
    
- logging
    
- custom response structure
    

---

## Core Points to Remember

1. **Exception filter = custom control over exception handling.**
    
2. `@Catch(HttpException)` specifies which exception types the filter targets.
    
3. `ExceptionFilter<T>` defines the filter contract.
    
4. `T` represents the exception type.
    
5. `catch(exception, host)` contains the handling logic.
    
6. `exception` gives access to the thrown exception.
    
7. `ArgumentsHost` provides access to the current execution context.
    
8. `host.switchToHttp()` switches to HTTP context.
    
9. `getRequest()` gets the underlying request.
    
10. `getResponse()` gets the underlying response.
    
11. `exception.getStatus()` gets the HTTP status.
    
12. Calling `response.status().json()` directly means **the filter controls the final response**.
    
13. `@Catch()` can target one or multiple exception types.
    
14. Direct use of Express/Fastify response APIs makes the filter platform-specific.