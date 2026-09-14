## Custom Exceptions

Custom exceptions are useful when the built-in NestJS exceptions do not sufficiently represent your application's error semantics.

However, you **do not need to create a custom exception for every error**. Prefer Nest's built-in exceptions when they already express the condition you need.

### 1. Recommended Approach

When creating custom exceptions, Nest recommends building an **exception hierarchy** where your custom exceptions extend:

```typescript
HttpException
```

This is important because Nest's built-in exception handling already understands `HttpException`.

```text
HttpException
      │
      ├── Nest built-in exceptions
      │
      └── Your custom exceptions
```

Therefore, your custom exception automatically participates in Nest's normal exception handling.

---

### 2. Creating a Custom Exception

Example:

```typescript
import {
  HttpException,
  HttpStatus,
} from '@nestjs/common';

export class ForbiddenException extends HttpException {
  constructor() {
    super(
      'Forbidden',
      HttpStatus.FORBIDDEN,
    );
  }
}
```

Here:

```text
ForbiddenException
       │
       │ extends
       ↓
HttpException
       │
       ├── response = "Forbidden"
       └── status = 403
```

So Nest recognizes it as an HTTP exception.

---

### 3. Using the Custom Exception

The controller can now simply throw:

```typescript
@Get()
async findAll() {
  throw new ForbiddenException();
}
```

The flow becomes:

```text
findAll()
   │
   ↓
throw new ForbiddenException()
   │
   ↓
ForbiddenException
   │
   └── extends HttpException
          │
          ↓
   Nest Exceptions Layer
          │
          ↓
   Built-in Global Exception Filter
          │
          ↓
      HTTP 403
```

Response:

```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

---

### 4. Why Extend `HttpException`?

The main reason is **compatibility with Nest's exception handling**.

If you create:

```typescript
export class ForbiddenException extends Error {}
```

Nest does **not** recognize it as a Nest HTTP exception.

It will generally be treated as an **unrecognized exception**, resulting in:

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

Whereas:

```typescript
export class ForbiddenException extends HttpException {}
```

makes it part of the `HttpException` hierarchy:

```text
Custom Exception
      ↓
HttpException
      ↓
Nest recognizes HTTP exception
      ↓
Correct HTTP response
```

---

### 5. Custom Exception vs Built-in Exception

If Nest already provides the required exception:

```typescript
throw new ForbiddenException();
```

there is usually **no reason to create your own equivalent**.

Custom exceptions become more useful when the application has **domain-specific error semantics**.

For example:

```typescript
UserAlreadyExistsException
InvalidShortCodeException
UrlExpiredException
ShortCodeAlreadyTakenException
```

These can still inherit from `HttpException`.

```text
HttpException
    │
    ├── NotFoundException
    ├── ConflictException
    │
    ├── UserAlreadyExistsException
    ├── UrlExpiredException
    └── InvalidShortCodeException
```

This gives your application a meaningful exception hierarchy while remaining compatible with Nest's exception layer.

### Key takeaway

> **Custom exception = application-specific exception that normally extends `HttpException`, allowing Nest's built-in exception handling to process it automatically.**

Also distinguish this from **custom exception filters**: a custom exception defines **what error occurred**, while an exception filter defines **how that error is handled/responded to**.