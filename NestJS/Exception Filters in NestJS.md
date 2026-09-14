# Exception Filters in NestJS

Exception Filters are the **last application-level mechanism in NestJS's request pipeline for handling exceptions**. They let you control **how exceptions are caught, transformed, logged, and converted into HTTP responses**.

The important thing is to understand the relationship between:

```text
throw exception
      ↓
Nest Exceptions Layer
      ↓
Exception Filter
      ↓
HTTP Response
```

---

## 1. NestJS Exceptions Layer

Nest has a built-in **exceptions layer** responsible for processing **unhandled exceptions**.

If your application code throws an exception and it is not handled by your own `try/catch`, the exception propagates upward until Nest's exceptions layer processes it.

```text
Controller / Service
       │
       │ throw error
       ↓
Nest Exceptions Layer
       │
       ↓
Exception Filter
       │
       ↓
HTTP Response
```

You therefore normally **do not need to put `try/catch` around every controller method** just to send an HTTP error response.

For example:

```typescript
@Get()
findAll() {
  throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
}
```

Nest catches the unhandled exception and produces the response.

---

# 2. Built-in Global Exception Filter

Nest provides a built-in **global exception filter** out of the box.

Its basic responsibility is:

> Take an exception and convert it into an appropriate HTTP response.

It specifically understands:

```text
HttpException
      ↓
HTTP status + response body
```

For example:

```typescript
throw new HttpException(
  'Forbidden',
  HttpStatus.FORBIDDEN,
);
```

produces:

```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

You don't have to manually write:

```typescript
res.status(403).json(...)
```

for every exception.

---

# 3. `HttpException`

Nest provides:

```typescript
import {
  HttpException,
  HttpStatus,
} from '@nestjs/common';
```

`HttpException` represents an HTTP-level exception.

Basic form:

```typescript
throw new HttpException(
  response,
  status,
);
```

It has **three constructor arguments**:

```typescript
new HttpException(
  response,
  status,
  options?,
)
```

### Arguments

|Argument|Purpose|
|---|---|
|`response`|Defines the response body|
|`status`|HTTP status code|
|`options`|Optional error metadata such as `cause`|

---

# 4. `HttpStatus`

Instead of writing:

```typescript
throw new HttpException(
  'Forbidden',
  403,
);
```

Nest recommends:

```typescript
throw new HttpException(
  'Forbidden',
  HttpStatus.FORBIDDEN,
);
```

`HttpStatus` is an enum provided by:

```typescript
@nestjs/common
```

Examples:

```typescript
HttpStatus.OK
HttpStatus.CREATED
HttpStatus.BAD_REQUEST
HttpStatus.UNAUTHORIZED
HttpStatus.FORBIDDEN
HttpStatus.NOT_FOUND
HttpStatus.CONFLICT
HttpStatus.INTERNAL_SERVER_ERROR
```

This makes the meaning of the status code explicit.

---

# 5. The `response` Argument

The first argument controls the response body.

It can be either:

```text
string
```

or

```text
object
```

## String response

```typescript
throw new HttpException(
  'Forbidden',
  HttpStatus.FORBIDDEN,
);
```

Nest produces:

```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

Here:

```text
response = "Forbidden"
status   = 403
```

Nest uses the string as the `message`.

---

## Object response

You can completely control the response body:

```typescript
throw new HttpException(
  {
    status: HttpStatus.FORBIDDEN,
    error: 'This is a custom message',
  },
  HttpStatus.FORBIDDEN,
);
```

Response:

```json
{
  "status": 403,
  "error": "This is a custom message"
}
```

Notice that Nest does **not** force the default:

```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

because you supplied your own response object.

So:

```text
string response
      ↓
Nest constructs standard response

object response
      ↓
you control the response structure
```

---

# 6. Default Response Structure

When using the normal `HttpException` behavior, the response contains:

```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

The two important properties are:

### `statusCode`

Usually derived from the second constructor argument:

```typescript
HttpStatus.FORBIDDEN
```

→

```json
"statusCode": 403
```

### `message`

A short description of the HTTP error.

For example:

```typescript
'Forbidden'
```

→

```json
"message": "Forbidden"
```

---

# 7. Why Pass an Object?

Objects are useful when your API requires a more structured error response.

For example:

```typescript
throw new HttpException(
  {
    statusCode: HttpStatus.FORBIDDEN,
    message: 'You cannot access this resource',
    error: 'Forbidden',
  },
  HttpStatus.FORBIDDEN,
);
```

The client receives that structure.

This becomes particularly useful when designing a **consistent API error contract**.

For example, a production API might standardize errors around:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

Exception filters become especially valuable when you want to enforce such consistency across the application.

---

# 8. `cause` — Important for Debugging

`HttpException` has an optional third argument:

```typescript
options
```

which can contain an error `cause`.

Example:

```typescript
try {
  await this.service.findAll();
} catch (error) {
  throw new HttpException(
    {
      status: HttpStatus.FORBIDDEN,
      error: 'This is a custom message',
    },
    HttpStatus.FORBIDDEN,
    {
      cause: error,
    },
  );
}
```

Conceptually:

```text
Original Error
      │
      ↓
    cause
      │
      ↓
HttpException
      │
      ├── response → sent to client
      │
      └── cause → useful internally for debugging/logging
```

The important distinction is:

> `cause` is **not serialized into the HTTP response**.

So the client does not receive the underlying error.

This allows you to preserve internal debugging information without exposing it to clients.

---

# 9. Unrecognized Exceptions

Not every exception is a Nest `HttpException`.

For example:

```typescript
throw new Error('Database connection failed');
```

`Error` does not inherit from:

```typescript
HttpException
```

Therefore Nest treats it as an **unrecognized exception**.

The built-in exception filter produces:

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

So the basic distinction is:

```text
HttpException
      ↓
Known HTTP exception
      ↓
appropriate HTTP response


Error / unknown exception
      ↓
Unrecognized exception
      ↓
500 Internal Server Error
```

This is an important security property: internal exception details should generally **not be exposed directly to the client**.

---

# 10. Built-in HTTP Exceptions

You normally don't need to manually instantiate `HttpException` for common HTTP errors.

Nest provides subclasses such as:

```typescript
BadRequestException
UnauthorizedException
ForbiddenException
NotFoundException
ConflictException
InternalServerErrorException
```

For example:

```typescript
throw new NotFoundException('User not found');
```

instead of:

```typescript
throw new HttpException(
  'User not found',
  HttpStatus.NOT_FOUND,
);
```

Conceptually:

```text
HttpException
      │
      ├── BadRequestException
      ├── UnauthorizedException
      ├── ForbiddenException
      ├── NotFoundException
      ├── ConflictException
      └── ...
```

Because these classes inherit from `HttpException`, Nest's built-in exceptions layer understands them automatically.

---

# 11. `http-errors` Partial Support

Nest's built-in global exception filter also partially supports the `http-errors` library.

The important condition is that an exception contains:

```typescript
statusCode
message
```

For example:

```typescript
const error = new Error('Something went wrong');

(error as any).statusCode = 400;

throw error;
```

The built-in filter can use those properties rather than treating the exception purely as an unknown error.

The key idea:

```text
Exception
   │
   ├── statusCode
   └── message
        ↓
Nest can populate HTTP response
```

This is **partial support**, not equivalent to the exception being a Nest `HttpException`.

---

# 12. Why Exception Filters Exist

The built-in global filter is sufficient for basic applications.

But production applications often need additional behavior:

```text
Exception
   ↓
Log exception
   ↓
Add request ID
   ↓
Normalize error format
   ↓
Hide internal details
   ↓
Return standardized response
```

That is where **custom exception filters** come in.

A filter can control what happens when a particular exception reaches the exceptions layer.

For example, instead of allowing different parts of your application to return:

```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

and:

```json
{
  "error": "USER_NOT_FOUND",
  "msg": "User does not exist"
}
```

you can use a filter to establish one consistent contract:

```json
{
  "success": false,
  "statusCode": 404,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

---

# 13. The Core Mental Model

Keep this flow in mind:

```text
                    HTTP REQUEST
                         │
                         ↓
                    Middleware
                         │
                         ↓
                       Guards
                         │
                         ↓
                    Interceptors
                         │
                         ↓
                       Pipes
                         │
                         ↓
                  Controller Handler
                         │
                         ↓
                   Service / DB
                         │
              ┌──────────┴──────────┐
              │                     │
           success                 error
              │                     │
              ↓                     ↓
          Response          Exception propagates
                                    │
                                    ↓
                           Exceptions Layer
                                    │
                                    ↓
                           Exception Filter
                                    │
                                    ↓
                              HTTP Response
```

The critical idea is:

> **Exception filters don't normally prevent an exception from being thrown. They determine how an exception that reaches the exceptions layer is handled and converted into a response.**

This distinction becomes very important when we move into **custom exception filters, `@Catch()`, `ArgumentsHost`, filter scope, and global filters**.