# Middleware Error Handling — Deep Dive

The important thing here is to understand **how an exception moves from middleware into Nest's exceptions layer**, and why middleware has a special limitation regarding exception filters.

The core flow is:

```text
HTTP Request
     │
     ▼
 Middleware
     │
     ├── success ──► next() ──► Nest route pipeline
     │
     └── error ────► Exception Layer
                         │
                         ▼
                    HTTP Response
```

---

## 1. Middleware can throw an exception

Consider:

```typescript
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (!req.headers.authorization) {
      throw new UnauthorizedException();
    }

    next();
  }
}
```

The important line is:

```typescript
throw new UnauthorizedException();
```

`UnauthorizedException` is a Nest built-in subclass of `HttpException`.

Conceptually:

```text
Request
   │
   ▼
AuthMiddleware
   │
   │ authorization missing
   ▼
throw UnauthorizedException
   │
   ▼
Nest Exceptions Layer
   │
   ▼
HTTP 401 Response
```

You **do not need to manually write**:

```typescript
res.status(401).json(...)
```

when you want Nest's exception handling mechanism to process the error.

---

# 2. Why `HttpException` is recommended

Nest's exceptions layer already understands:

```typescript
HttpException
```

and its built-in subclasses:

```typescript
UnauthorizedException
ForbiddenException
BadRequestException
NotFoundException
ConflictException
...
```

So middleware can express the failure semantically:

```typescript
throw new UnauthorizedException();
```

rather than manually constructing an HTTP response.

For example:

```text
Authentication missing
        │
        ▼
UnauthorizedException
        │
        ▼
Exceptions Layer
        │
        ▼
401 Unauthorized
```

This keeps error handling consistent with exceptions thrown elsewhere in Nest.

---

# 3. Middleware doesn't have to handle the response itself

Compare these two approaches.

### Manual response

```typescript
if (!req.headers.authorization) {
  res.status(401).json({
    message: 'Unauthorized',
  });

  return;
}
```

Here middleware terminates the request itself.

```text
Middleware
   │
   ▼
res.status(...)
   │
   ▼
Request ends
```

### Exception-based

```typescript
if (!req.headers.authorization) {
  throw new UnauthorizedException();
}
```

Here middleware delegates error handling to Nest:

```text
Middleware
   │
   ▼
throw UnauthorizedException
   │
   ▼
Nest Exceptions Layer
   │
   ▼
HTTP response
```

For middleware registered through Nest's middleware system, the second approach is generally preferable when you want Nest's exception machinery to handle the failure.

---

# 4. What happens when `next()` is called?

If authentication succeeds:

```typescript
if (!req.headers.authorization) {
  throw new UnauthorizedException();
}

next();
```

The flow is:

```text
Request
  │
  ▼
AuthMiddleware
  │
  │ authorization exists
  ▼
next()
  │
  ▼
Next middleware / Nest pipeline
  │
  ▼
Route handler
```

So middleware has two fundamental paths:

```text
                  Middleware
                      │
              ┌───────┴────────┐
              │                │
           success            failure
              │                │
              ▼                ▼
           next()           throw
              │                │
              ▼                ▼
       continue pipeline   Exceptions Layer
```

---

# 5. Asynchronous middleware

Now consider authentication that requires a database/cache/API lookup.

For example:

```typescript
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly authService: AuthService,
  ) {}

  async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const user = await this.authService.verify(
      req.headers.authorization,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    req['user'] = user;

    next();
  }
}
```

There are several things happening here.

```text
Request
   │
   ▼
AuthMiddleware
   │
   ▼
authService.verify(...)
   │
   │ await
   ▼
User
   │
   ├── exists ──────► req.user = user ──► next()
   │
   └── doesn't exist ► throw UnauthorizedException
```

---

# 6. Why `use()` is `async`

Notice:

```typescript
async use(...) {
```

Because:

```typescript
await this.authService.verify(...)
```

returns asynchronously.

An `async` function returns a Promise:

```text
use()
  │
  ▼
Promise
  │
  ├── fulfilled → continue
  │
  └── rejected  → error
```

The important Nest behavior described in the documentation is that a rejected Promise from asynchronous middleware can be forwarded to the exceptions layer.

Therefore, don't write asynchronous middleware as if the async operation were synchronous.

---

# 7. What if the Promise rejects?

Suppose:

```typescript
const user = await this.authService.verify(
  req.headers.authorization,
);
```

and `verify()` throws/rejects:

```text
AuthMiddleware
      │
      ▼
await authService.verify()
      │
      ▼
Promise rejected
      │
      ▼
Exception handling
```

This is why declaring the middleware method appropriately as `async` matters.

The exception must remain part of the asynchronous execution chain.

---

# 8. Middleware can also use `next(error)`

Express-style middleware traditionally has another error propagation mechanism:

```typescript
next(error);
```

Example:

```typescript
use(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.headers.authorization) {
    return next(
      new UnauthorizedException(),
    );
  }

  next();
}
```

Now the flow is:

```text
Middleware
    │
    │ failure
    ▼
next(error)
    │
    ▼
error propagation
    │
    ▼
exception handling
```

This is especially useful when you're **wrapping or adapting existing Express-style middleware** whose API reports errors through the callback.

---

# 9. `throw` vs `next(error)`

Both can represent failure:

### Throw

```typescript
throw new UnauthorizedException();
```

Best conceptual model:

```text
middleware logic
      │
      ▼
exception occurs
      │
      ▼
Nest exception layer
```

### `next(error)`

```typescript
return next(
  new UnauthorizedException(),
);
```

Best conceptual model:

```text
Express-style middleware
       │
       ▼
next(error)
       │
       ▼
error propagation
```

So `next(error)` is particularly useful when integrating existing callback-based middleware.

---

# 10. The critical exception-filter limitation

This is the most important part of the documentation section.

Suppose you have:

```typescript
@UseFilters(MyExceptionFilter)
@Controller('cats')
export class CatsController {}
```

You might think:

> "If my middleware throws an exception for `/cats`, `MyExceptionFilter` should handle it."

**It will not.**

Why?

Because middleware executes **before the route handler is selected**.

The conceptual sequence is:

```text
Request
   │
   ▼
Middleware
   │
   │ exception happens HERE
   X
   │
   ▼
Route selection has not happened yet
```

At this point Nest doesn't yet have the controller/method execution context that would determine:

```text
CatsController
    ↓
specific route
    ↓
specific @UseFilters()
```

Therefore:

> **Controller-scoped and method-scoped exception filters cannot catch middleware exceptions.**

---

# 11. Global filters are different

A **global exception filter** is not tied to a particular controller or route.

For example:

```typescript
app.useGlobalFilters(
  new HttpExceptionFilter(),
);
```

or through the `APP_FILTER` token.

Conceptually:

```text
                    Request
                       │
                       ▼
                  Middleware
                       │
                    throw
                       │
                       ▼
              Global Exception Filter
                       │
                       ▼
                  HTTP Response
```

Because the filter is global, it doesn't require a specific controller/method to have already been selected.

---

# 12. Why `@UseFilters()` on middleware doesn't work

You might try:

```typescript
@UseFilters(AuthExceptionFilter)
@Injectable()
export class AuthMiddleware
  implements NestMiddleware {
  ...
}
```

But the documentation explicitly says this has **no effect**.

The reason is architectural:

```text
@UseFilters()
   │
   ▼
Nest execution context
   │
   ▼
Controller / handler
```

Middleware executes outside that controller/method-scoped filter mechanism.

So:

```text
Middleware
    │
    └── @UseFilters() ❌
```

doesn't give middleware its own method/controller filter chain.

---

# 13. Full exception flow

This is the model to retain:

```text
                         HTTP Request
                              │
                              ▼
                       Middleware
                              │
                   ┌──────────┴──────────┐
                   │                     │
                success                error
                   │                     │
                   ▼                     ▼
                next()             throw / next(err)
                   │                     │
                   ▼                     ▼
             Route selected       Global Exception
                   │                  Filter
                   ▼                     │
             Controller                  ▼
                   │                 HTTP Response
                   ▼
               Service
```

The important boundary is:

```text
Middleware
    │
    │ before route selection
    ▼
Route selection
    │
    ▼
Controller
```

Because middleware is before route selection, only **global exception filters** can handle middleware exceptions.

---

# 14. `MiddlewareConsumer` vs `app.use()`

The documentation contains another subtle but important distinction.

You can register middleware through Nest:

```typescript
consumer
  .apply(AuthMiddleware)
  .forRoutes('cats');
```

This goes through Nest's middleware configuration system.

Conceptually:

```text
MiddlewareConsumer
       │
       ▼
Nest MiddlewareModule
       │
       ▼
HTTP platform
```

But you can also directly use the underlying platform:

```typescript
app.use(someMiddleware);
```

This is different.

---

# 15. What happens with `app.use()`?

When you write:

```typescript
app.use(someMiddleware);
```

the middleware is handled by the **underlying HTTP platform**:

```text
Nest Application
      │
      ▼
HTTP Adapter
      │
   ┌──┴───┐
   ▼      ▼
Express Fastify
```

So:

```text
app.use()
   │
   ▼
Underlying HTTP platform
```

rather than:

```text
MiddlewareConsumer
   │
   ▼
Nest MiddlewareModule
```

This distinction matters when reasoning about Nest's exception layer.

---

# 16. Why the distinction matters

For middleware configured through:

```typescript
consumer.apply(...)
```

Nest's middleware system is involved.

So the recommended approach is:

```typescript
throw new UnauthorizedException();
```

or:

```typescript
next(new UnauthorizedException());
```

and allow the Nest exceptions layer to process the error.

But when directly using:

```typescript
app.use(...)
```

you're operating at the underlying platform level.

Conceptually:

```text
                   app.use()
                      │
                      ▼
               Express/Fastify
                      │
                      ▼
                platform-level
                middleware
```

This is why the documentation recommends preferring Nest's `MiddlewareConsumer` for middleware where you want Nest's exception layer to process errors.

---

# 17. Production authentication example

A clean Nest middleware could look like:

```typescript
@Injectable()
export class AuthMiddleware
  implements NestMiddleware {

  constructor(
    private readonly authService: AuthService,
  ) {}

  async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        'Authorization header is required',
      );
    }

    const user =
      await this.authService.verify(
        authorization,
      );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid authentication credentials',
      );
    }

    req['user'] = user;

    next();
  }
}
```

The flow:

```text
                  HTTP Request
                       │
                       ▼
                 AuthMiddleware
                       │
              Authorization?
                  /          \
                NO            YES
                │              │
                ▼              ▼
             throw       authService.verify()
                │              │
                │         ┌────┴────┐
                │       invalid   valid
                │         │         │
                │         ▼         ▼
                │       throw    req.user = user
                │                   │
                │                   ▼
                │                 next()
                │                   │
                └─────────┬─────────┘
                          ▼
                  Nest request pipeline
```

---

# 18. One subtle architectural point

In the example:

```typescript
req['user'] = user;
```

middleware is **enriching the request**.

That means downstream components can access the authenticated user.

Conceptually:

```text
Incoming Request
      │
      │ no user information
      ▼
AuthMiddleware
      │
      │ verifies credentials
      ▼
Request + authenticated user
      │
      ▼
Controller
```

This is a common middleware pattern, although for authentication/authorization decisions specifically, Nest Guards often provide a better Nest-native abstraction. We'll distinguish that carefully when we reach Guards.

---

# 19. The mental model you should retain

```text
┌────────────────────────────────────────────────────────────┐
│                 MIDDLEWARE ERROR HANDLING                  │
│                                                            │
│ Middleware                                                 │
│      │                                                     │
│      ├── success → next()                                  │
│      │              ↓                                     │
│      │         continue request pipeline                   │
│      │                                                     │
│      └── error                                             │
│            │                                               │
│            ├── throw HttpException                         │
│            │                                               │
│            └── next(error)                                 │
│                    │                                       │
│                    ▼                                       │
│              Global Exception Filter                       │
│                    │                                       │
│                    ▼                                       │
│                HTTP Response                              │
└────────────────────────────────────────────────────────────┘
```

And the **critical limitation**:

```text
Middleware
   │
   │ exception
   ▼
Global Filter        ✅
Controller Filter    ❌
Method Filter        ❌
@UseFilters()        ❌
```

because:

```text
Middleware
    ↓
Route selection
    ↓
Controller
    ↓
Handler
```

Middleware executes **before route selection**, so controller/method-scoped exception filters don't yet have an applicable execution context.

Finally:

```text
consumer.apply(...)
       ↓
Nest MiddlewareModule
       ↓
Nest exception layer can process errors


app.use(...)
       ↓
Underlying Express/Fastify platform
       ↓
Not Nest MiddlewareModule
```

That distinction is particularly important when you're building production NestJS infrastructure and deciding whether a piece of middleware should be registered through `MiddlewareConsumer` or directly against the underlying HTTP adapter.