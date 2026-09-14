# Middleware — Deep Dive

Middleware is the **first major request-processing layer** we've reached after controllers, providers, modules, pipes, guards, and interceptors.

The most important thing to understand is **where middleware sits in the HTTP pipeline and what responsibility it has**.

---

# 1. What is Middleware?

Nest defines middleware as a function that executes **before the route handler**.

A middleware has access to:

```text
Request
Response
next()
```

Conceptually:

```text
Client
  │
  │ HTTP Request
  ▼
┌──────────────────┐
│    Middleware    │
│                  │
│ req              │
│ res              │
│ next()           │
└────────┬─────────┘
         │
         │ next()
         ▼
   Route Handler
         │
         ▼
      Response
```

The crucial word is:

> **before**

Middleware gets an opportunity to inspect or modify the request before Nest reaches the route handler.

---

# 2. Middleware is fundamentally a request-response pipeline mechanism

Consider:

```text
Client
  │
  ▼
HTTP Request
  │
  ▼
Middleware 1
  │
  ▼
Middleware 2
  │
  ▼
Middleware 3
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
Response
```

Each middleware can decide what happens next.

It can:

1. execute code
    
2. modify `req`
    
3. modify `res`
    
4. terminate the request
    
5. call `next()`
    

That means middleware isn't just "a logging function."

It is a **control point in the request-response pipeline**.

---

# 3. The `next()` function is the key concept

Consider:

```typescript
use(req: Request, res: Response, next: NextFunction) {
  console.log('Request...');

  next();
}
```

The important line is:

```typescript
next();
```

It means:

> **"I have finished my middleware work; continue processing this request."**

Visualize:

```text
Request
   │
   ▼
Middleware
   │
   │ next()
   ▼
Next middleware / Nest route pipeline
```

Without `next()`:

```text
Request
   │
   ▼
Middleware
   │
   X
   │
   └── request stops here
```

If the middleware also doesn't send a response, the request can remain hanging.

---

# 4. Middleware has two possible outcomes

A middleware generally does one of two things.

### Continue

```typescript
next();
```

Flow:

```text
Middleware
    │
    ▼
next()
    │
    ▼
Next middleware
    │
    ▼
Controller
```

### Terminate

For example:

```typescript
res.status(401).json({
  message: 'Unauthorized',
});
```

Flow:

```text
Middleware
    │
    ▼
Authentication check
    │
    ├── valid ───────► next()
    │
    └── invalid ─────► response
                         │
                         ▼
                       STOP
```

So middleware has **control-flow responsibility**.

---

# 5. Middleware can modify the request

For example:

```typescript
use(req: Request, res: Response, next: NextFunction) {
  req.headers['x-request-source'] = 'api';

  next();
}
```

Conceptually:

```text
Incoming Request
       │
       ▼
Middleware
       │
       │ modifies req
       ▼
Modified Request
       │
       ▼
Controller
```

A more realistic example would be attaching request metadata:

```typescript
(req as any).requestId = crypto.randomUUID();

next();
```

Then downstream code can access that information.

---

# 6. Middleware can modify the response

Middleware also has access to:

```typescript
res
```

So it can set response-related behavior.

For example:

```typescript
use(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Powered-By', 'NestJS');

  next();
}
```

Flow:

```text
Request
   │
   ▼
Middleware
   │
   ├── modifies response
   │
   ▼
Controller
   │
   ▼
Response
```

---

# 7. Middleware can completely terminate a request

Suppose:

```typescript
use(req: Request, res: Response, next: NextFunction) {
  if (!req.headers.authorization) {
    res.status(401).json({
      message: 'Missing authorization',
    });

    return;
  }

  next();
}
```

The flow is:

```text
                  Request
                     │
                     ▼
               Middleware
                     │
              Authorization?
                 /       \
               NO         YES
               │           │
               ▼           ▼
          401 Response    next()
                           │
                           ▼
                       Controller
```

This is fundamentally different from:

```typescript
next();
```

because once the middleware sends the response, there is no reason to continue to the controller.

---

# 8. Middleware can be a function

Nest supports two forms.

## Functional middleware

```typescript
export function logger(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(`${req.method} ${req.originalUrl}`);

  next();
}
```

There is no special Nest interface required.

It's essentially standard Express-style middleware.

---

# 9. Middleware can be a class

Nest also allows:

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    console.log('Request...');

    next();
  }
}
```

The important parts are:

```typescript
@Injectable()
```

and:

```typescript
implements NestMiddleware
```

and:

```typescript
use(...)
```

---

# 10. Why use a class instead of a function?

The major advantage is **Dependency Injection**.

Nest middleware classes can inject providers.

For example:

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: LoggerService,
  ) {}

  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    this.logger.log(`${req.method} ${req.url}`);

    next();
  }
}
```

The dependency graph becomes:

```text
Nest DI Container
       │
       ▼
LoggerMiddleware
       │
       │ injects
       ▼
LoggerService
```

This is the same DI mechanism you've already learned for providers and controllers.

---

# 11. Middleware's DI scope

The documentation says middleware can inject dependencies **available within the same module**.

So think in terms of:

```text
Module
 │
 ├── Middleware
 │      │
 │      └── injects
 │
 └── Providers
```

The middleware participates in Nest's dependency-resolution system.

This is another reason class-based middleware is useful in larger applications.

---

# 12. Middleware is NOT registered inside `@Module()`

This is an important difference from providers/controllers.

For providers:

```typescript
@Module({
  providers: [UsersService],
})
```

For controllers:

```typescript
@Module({
  controllers: [UsersController],
})
```

But middleware is **not** configured like:

```typescript
@Module({
  middleware: [LoggerMiddleware], // ❌
})
```

Instead, Nest uses:

```typescript
configure()
```

and:

```typescript
MiddlewareConsumer
```

---

# 13. `NestModule`

The module containing middleware configuration implements:

```typescript
NestModule
```

Example:

```typescript
import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // middleware configuration
  }
}
```

This creates a special configuration hook:

```text
AppModule
    │
    ▼
configure()
    │
    ▼
MiddlewareConsumer
    │
    ▼
middleware registration
```

---

# 14. `MiddlewareConsumer`

The `consumer` is the object through which we configure middleware.

Example:

```typescript
configure(consumer: MiddlewareConsumer) {
  consumer
    .apply(LoggerMiddleware)
    .forRoutes('cats');
}
```

Read this almost like English:

> Apply `LoggerMiddleware` for the `cats` routes.

So:

```text
MiddlewareConsumer
      │
      ├── apply(...)
      │
      └── forRoutes(...)
```

---

# 15. `apply()` vs `forRoutes()`

These two methods have different responsibilities.

```typescript
consumer
  .apply(LoggerMiddleware)
  .forRoutes('cats');
```

### `apply()`

Answers:

> **Which middleware should run?**

```typescript
.apply(LoggerMiddleware)
```

### `forRoutes()`

Answers:

> **Where should it run?**

```typescript
.forRoutes('cats')
```

So:

```text
.apply()
   ↓
middleware selection

.forRoutes()
   ↓
route selection
```

---

# 16. Applying middleware to a route

Given:

```typescript
@Controller('cats')
export class CatsController {

  @Get()
  findAll() {}

  @Post()
  create() {}
}
```

This:

```typescript
consumer
  .apply(LoggerMiddleware)
  .forRoutes('cats');
```

conceptually applies the middleware to the `/cats` route handlers.

```text
GET  /cats ──► LoggerMiddleware ──► CatsController
POST /cats ──► LoggerMiddleware ──► CatsController
```

The middleware is associated with the route path.

---

# 17. Restrict middleware by HTTP method

The documentation provides:

```typescript
consumer
  .apply(LoggerMiddleware)
  .forRoutes({
    path: 'cats',
    method: RequestMethod.GET,
  });
```

Now:

```text
GET  /cats
 │
 ▼
LoggerMiddleware
 │
 ▼
Controller


POST /cats
 │
 └── middleware does not apply
```

So the route configuration can include:

```typescript
{
  path: 'cats',
  method: RequestMethod.GET,
}
```

---

# 18. Why `RequestMethod`?

Nest provides:

```typescript
RequestMethod
```

instead of requiring you to write raw strings such as:

```typescript
'GET'
```

Example:

```typescript
import { RequestMethod } from '@nestjs/common';
```

Then:

```typescript
method: RequestMethod.GET
```

This gives you a defined Nest enum representing HTTP methods.

---

# 19. Middleware can be applied to controllers

Instead of:

```typescript
.forRoutes('cats');
```

you can conceptually target controller classes:

```typescript
.forRoutes(CatsController);
```

This is useful when you want:

```text
CatsController
    │
    ├── GET /cats
    ├── POST /cats
    ├── GET /cats/:id
    └── DELETE /cats/:id
```

to share middleware configuration.

The important architectural idea is:

> Middleware configuration can be associated with Nest route/controller metadata rather than only raw URL strings.

---

# 20. Middleware ordering

Suppose:

```typescript
consumer
  .apply(AuthMiddleware)
  .apply(LoggerMiddleware)
  .forRoutes('cats');
```

The conceptual request flow becomes:

```text
Request
   │
   ▼
AuthMiddleware
   │
   │ next()
   ▼
LoggerMiddleware
   │
   │ next()
   ▼
CatsController
```

Middleware therefore forms a **chain**.

```text
M1 → M2 → M3 → Controller
```

Each middleware controls whether execution proceeds.

---

# 21. Middleware is adapter-level logic

This is especially important for the architecture you're learning.

Middleware operates very close to the HTTP adapter:

```text
Client
  │
  ▼
HTTP
  │
  ▼
Middleware
  │
  ▼
Nest request pipeline
  │
  ▼
Controller
  │
  ▼
Application logic
```

So middleware is generally a good place for concerns such as:

- request logging
    
- correlation/request IDs
    
- raw request preprocessing
    
- CORS-related adapter behavior
    
- request metrics
    
- legacy HTTP compatibility
    
- low-level request/response manipulation
    

But don't automatically put every cross-cutting concern into middleware.

Nest provides other mechanisms for that.

---

# 22. Middleware vs Guard

This distinction becomes extremely important later.

Suppose you want authentication.

Middleware can do:

```text
Request
   ↓
Read Authorization header
   ↓
Validate token
   ↓
next()
```

But Nest's **Guard** is specifically integrated into Nest's execution context and authorization mechanism.

Conceptually:

```text
Middleware
   ↓
HTTP-level preprocessing
   ↓
Guards
   ↓
authorization decision
   ↓
Interceptors/Pipes/etc.
   ↓
Controller
```

So don't think:

> "Middleware = authentication."

Instead:

> **Middleware is a general request pipeline mechanism; Guards are Nest's dedicated authorization/execution-context mechanism.**

We'll go deep into this when we reach Guards.

---

# 23. Middleware vs Pipe

Similarly:

### Middleware

Works with:

```text
req
res
next
```

and runs before the route handler.

### Pipe

Works primarily with:

```text
input value
metadata
```

and is responsible for:

- transformation
    
- validation
    

For example:

```text
Request
   │
   ▼
Middleware
   │
   ▼
Route selection
   │
   ▼
Pipe
   │
   ├── transform
   └── validate
   │
   ▼
Controller
```

So a middleware isn't the right abstraction for DTO validation.

---

# 24. Middleware vs Interceptor

An interceptor is also capable of running code around controller execution, but it is a **Nest-level abstraction** with access to the execution context and `CallHandler`.

Conceptually:

```text
Middleware
   │
   ▼
Nest execution pipeline
   │
   ▼
Interceptor
   │
   ▼
Controller
```

Middleware operates closer to the HTTP adapter.

Interceptors operate inside Nest's execution pipeline.

This distinction becomes very useful when deciding where cross-cutting behavior belongs.

---

# 25. The complete request pipeline

At a high level, you should now visualize the Nest HTTP request like this:

```text
                         HTTP Request
                              │
                              ▼
                     ┌─────────────────┐
                     │    Middleware   │
                     │                 │
                     │ req/res/next    │
                     └────────┬────────┘
                              │
                            next()
                              │
                              ▼
                       Route Resolution
                              │
                              ▼
                         Guards
                              │
                              ▼
                       Interceptors
                              │
                              ▼
                           Pipes
                              │
                              ▼
                         Controller
                              │
                              ▼
                           Service
                              │
                              ▼
                         Response
```

The exact detailed Nest lifecycle has additional nuances, and we'll refine this when we study **Request Lifecycle**, but this is the correct conceptual position for middleware.

---

# 26. Why Nest doesn't put middleware in `@Module()`

This design makes sense once you understand what middleware actually represents.

`@Module()` primarily describes the **dependency/module graph**:

```text
Module
├── imports
├── providers
├── controllers
└── exports
```

Middleware configuration instead describes:

```text
HTTP route pipeline
       │
       ├── middleware
       └── routes
```

Therefore Nest separates:

```text
Module composition
       ↓
@Module()

HTTP middleware configuration
       ↓
configure(MiddlewareConsumer)
```

This is an important architectural distinction.

---

# 27. `configure()` can be asynchronous

The documentation notes that:

```typescript
configure()
```

can be:

```typescript
async configure(...)
```

For example:

```typescript
async configure(consumer: MiddlewareConsumer) {
  await someInitialization();

  consumer
    .apply(LoggerMiddleware)
    .forRoutes('cats');
}
```

The important point is that middleware configuration itself can perform asynchronous initialization before registering the middleware.

This is **configuration-time asynchronous behavior**, not middleware request-time asynchronous behavior.

---

# 28. Express body-parser detail

When using the Express adapter, Nest registers:

```text
json
urlencoded
```

from `body-parser` by default.

Therefore, if you want to customize those through `MiddlewareConsumer`, Nest's default body-parser middleware needs to be disabled.

Application creation:

```typescript
const app = await NestFactory.create(
  AppModule,
  {
    bodyParser: false,
  },
);
```

Then you can configure the body-parser middleware yourself.

The important architecture is:

```text
Default Nest setup
      │
      ▼
body-parser middleware
      │
      ▼
Nest middleware configuration
```

If you need control over the body-parser layer, you first disable Nest's automatic registration.

---

# 29. A complete practical example

Let's combine everything.

### `logger.middleware.ts`

```typescript
import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';

import {
  Request,
  Response,
  NextFunction,
} from 'express';

@Injectable()
export class LoggerMiddleware
  implements NestMiddleware
{
  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    console.log(
      `${req.method} ${req.originalUrl}`,
    );

    next();
  }
}
```

### `app.module.ts`

```typescript
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [
    CatsModule,
  ],
})
export class AppModule implements NestModule {

  configure(
    consumer: MiddlewareConsumer,
  ) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({
        path: 'cats',
        method: RequestMethod.GET,
      });
  }
}
```

The flow is:

```text
GET /cats
   │
   ▼
LoggerMiddleware
   │
   │ console.log(...)
   │
   │ next()
   ▼
CatsController
   │
   ▼
Response
```

But:

```text
POST /cats
   │
   ▼
CatsController
```

because our middleware configuration specifically targeted:

```typescript
RequestMethod.GET
```

---

# 30. The key architecture to retain

You should now connect middleware with the module system you've just learned:

```text
                         AppModule
                            │
                            │ implements
                            ▼
                       NestModule
                            │
                            ▼
                       configure()
                            │
                            ▼
                   MiddlewareConsumer
                            │
                  ┌─────────┴──────────┐
                  │                    │
               apply()             forRoutes()
                  │                    │
                  ▼                    ▼
            Which middleware?     Which routes?
                  │                    │
                  └─────────┬──────────┘
                            ▼
                       HTTP Pipeline
                            │
                            ▼
                       Middleware
                            │
                          next()
                            │
                            ▼
                       Controller
```

And the most important conceptual distinction:

```text
┌─────────────────────────────────────────────────────────┐
│                    MIDDLEWARE                           │
│                                                         │
│  Runs before route handler                              │
│  Access: req, res, next                                 │
│                                                         │
│  Can:                                                   │
│    • execute code                                       │
│    • modify request                                     │
│    • modify response                                    │
│    • terminate request                                  │
│    • call next()                                        │
│                                                         │
│  Registration:                                          │
│    NestModule.configure()                               │
│        ↓                                                │
│    MiddlewareConsumer                                   │
│        ↓                                                │
│    apply().forRoutes()                                  │
│                                                         │
│  Class middleware:                                      │
│    @Injectable() + NestMiddleware                       │
│    → supports DI                                        │
│                                                         │
│  Function middleware:                                   │
│    req, res, next                                       │
│    → simple, no Nest-specific interface required       │
└─────────────────────────────────────────────────────────┘
```

### The one mental model

> **Middleware is the adapter-level request pipeline layer that gets control of `req`/`res` before the Nest route handler and decides whether to modify the request/response, terminate the request, or pass control onward with `next()`.**

The next important step is to go deeper into **middleware registration and matching**—`apply()`, `forRoutes()`, controller targets, route objects, `exclude()`, multiple middleware ordering, and how Nest internally converts this configuration into the underlying Express/Fastify middleware chain.