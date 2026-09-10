Yes — you mean the **actual HTTP entry point** for `url-service`, not a CLI/test entry point.

The flow we want is:

```text
HTTP Request
    ↓
HTTP Entry Point
    ↓
Controller
    ↓
Use Case
    ↓
Port
    ↓
Adapter
    ↓
Database / External System
```

For our current implementation:

```text
Client
  │
  ▼
HTTP Server (main.ts)
  │
  ▼
Controller
  │
  ▼
CreateShortUrlUseCase
  │
  ├── ShortCodeGenerator
  ├── UniqueIdGenerator
  ├── ShortenedUrlReader
  └── ShortenedUrlWriter
       │
       ▼
InMemoryShortenedUrlRepository
```

### Important architectural distinction

`main.ts` should **bootstrap the HTTP server**.

It should **not contain business logic**.

So we should eventually have:

```text
main.ts
   │
   ├── create HTTP server
   ├── create application wiring
   ├── register routes/controllers
   └── start listening
```

And our HTTP-specific code should live outside the application/domain:

```text
url-service/
├── adapters/
│   ├── generators/
│   ├── persistence/
│   └── http/
│       ├── controllers/
│       └── routes/
│
├── application/
├── domain/
├── tests/
├── main.ts
└── wire.ts
```

However, **don't create all of that yet**.

The next concept we should implement is the **HTTP controller**, because we already have the use case and wiring.

For example:

```text
POST /urls
        │
        ▼
CreateShortUrlController
        │
        ▼
createShortUrl.execute(...)
```

Then:

```text
GET /:shortCode
        │
        ▼
ResolveShortUrlController
        │
        ▼
resolveShortUrl.execute(...)
```

After that, `main.ts` becomes the actual HTTP bootstrap.

**So yes: let's build the HTTP entry point properly, starting with the controller layer.**

---
Good. We’ll build the HTTP layer **one boundary at a time**.

## 1. Create the HTTP controller

The controller's responsibility is only:

1. Receive HTTP request.
    
2. Extract input.
    
3. Call the use case.
    
4. Convert the use-case result into an HTTP response.
    

It must **not** contain URL business rules.

Create:

```text
adapters/
└── http/
    └── controllers/
        └── createShortUrl.controller.ts
```

### `adapters/http/controllers/createShortUrl.controller.ts`

```ts
import { Request, Response } from 'express';

import { CreateShortUrlUseCase } from '../../../application/use-cases/createShortUrl.use-case';

export class CreateShortUrlController {
  constructor(
    private readonly createShortUrlUseCase: CreateShortUrlUseCase,
  ) {}

  async handle(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { originalUrl, expiresAt } = req.body;

    const result =
      await this.createShortUrlUseCase.execute({
        originalUrl,
        expiresAt: expiresAt
          ? new Date(expiresAt)
          : undefined,
      });

    res.status(201).json({
      id: result.id.getValue(),
      originalUrl: result.originalUrl.getValue(),
      shortCode: result.shortCode.getValue(),
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
    });
  }
}
```

### Why this boundary matters

Notice what the controller **doesn't know**:

```text
❌ MongoDB
❌ Mongoose
❌ ShortCode generation
❌ URL validation rules
❌ Short-code uniqueness
❌ ShortenedUrl entity construction
```

It only knows:

```text
HTTP → Use Case → HTTP
```

That is exactly what we want.

---

## 2. Resolve controller

Now create:

```text
adapters/
└── http/
    └── controllers/
        └── resolveShortUrl.controller.ts
```

Since your current use-case file is named:

```text
application/use-cases/resolveUrl.use-case.ts
```

we'll use that exact naming for now.

```ts
import { Request, Response } from 'express';

import { ResolveShortUrlUseCase } from '../../../application/use-cases/resolveUrl.use-case';

export class ResolveShortUrlController {
  constructor(
    private readonly resolveShortUrlUseCase: ResolveShortUrlUseCase,
  ) {}

  async handle(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { shortCode } = req.params;

    const result =
      await this.resolveShortUrlUseCase.execute({
        shortCode,
      });

    res.status(200).json({
      shortCode: result.shortCode.getValue(),
      originalUrl: result.originalUrl.getValue(),
    });
  }
}
```

So now we have:

```text
HTTP
 │
 ├── POST /urls
 │      ↓
 │  CreateShortUrlController
 │      ↓
 │  CreateShortUrlUseCase
 │
 └── GET /:shortCode
        ↓
    ResolveShortUrlController
        ↓
    ResolveShortUrlUseCase
```

### One important point

The controller currently lets exceptions propagate:

```ts
await this.createShortUrlUseCase.execute(...)
```

That's intentional.

We **should not** put this everywhere:

```ts
try {
   ...
} catch {
   ...
}
```

Instead, the next HTTP-layer piece should be a **centralized error-handling middleware**. That will translate domain/application errors into proper HTTP responses.

So the progression is:

```text
Controllers
      ↓
HTTP Routes
      ↓
Express App
      ↓
Global Error Handler
      ↓
main.ts
```

**Next: create the two HTTP routes and connect these controllers to the use cases through `wire.ts`.**

---

Yes. Now we connect the controllers to HTTP routes.

## 1. Create the routes

Add:

```text
adapters/
└── http/
    └── routes/
        └── url.routes.ts
```

### `adapters/http/routes/url.routes.ts`

```ts
import { Router } from 'express';

import { CreateShortUrlController } from '../controllers/createShortUrl.controller';
import { ResolveShortUrlController } from '../controllers/resolveShortUrl.controller';

export function createUrlRoutes(
  createShortUrlController: CreateShortUrlController,
  resolveShortUrlController: ResolveShortUrlController,
): Router {
  const router = Router();

  router.post(
    '/urls',
    createShortUrlController.handle.bind(
      createShortUrlController,
    ),
  );

  router.get(
    '/:shortCode',
    resolveShortUrlController.handle.bind(
      resolveShortUrlController,
    ),
  );

  return router;
}
```

### Why pass controllers into the route factory?

Because the route should **not construct dependencies**.

Bad:

```ts
const controller = new CreateShortUrlController(...);
```

inside the route.

Instead:

```text
wire.ts
   │
   ├── creates adapters
   ├── creates use cases
   ├── creates controllers
   └── gives controllers to routes
```

This keeps construction in the **composition root**.

---

# 2. Update `wire.ts`

Now `wire.ts` becomes the place where the entire dependency graph is assembled.

Conceptually:

```text
InMemoryShortCodeGenerator ──────┐
InMemoryUniqueIdGenerator ───────┤
InMemoryRepository ──────────────┤
                                 ▼
                       CreateShortUrlUseCase
                                 │
                                 ▼
                       CreateShortUrlController
```

and:

```text
InMemoryRepository
       │
       ▼
ResolveShortUrlUseCase
       │
       ▼
ResolveShortUrlController
```

Add the controllers to your existing `wire.ts`.

```ts
import { CreateShortUrlUseCase } from './application/use-cases/createShortUrl.use-case';
import { ResolveShortUrlUseCase } from './application/use-cases/resolveUrl.use-case';

import { CreateShortUrlUseCaseImpl } from './application/use-cases/createShortUrl.use-case.impl';
import { ResolveShortUrlUseCaseImpl } from './application/use-cases/resolveUrl.use-case.impl';

import { InMemoryShortCodeGenerator } from './adapters/generators/inMemoryShortCode.generator';
import { InMemoryUniqueIdGenerator } from './adapters/generators/inMemoryUniqueId.generator';
import { InMemoryShortenedUrlRepository } from './adapters/persistence/inMemoryShortenedUrl.repository';

import { CreateShortUrlController } from './adapters/http/controllers/createShortUrl.controller';
import { ResolveShortUrlController } from './adapters/http/controllers/resolveShortUrl.controller';

export interface UrlService {
  createShortUrl: CreateShortUrlUseCase;
  resolveShortUrl: ResolveShortUrlUseCase;
  createShortUrlController: CreateShortUrlController;
  resolveShortUrlController: ResolveShortUrlController;
}

export function wireUrlService(): UrlService {
  const shortCodeGenerator =
    new InMemoryShortCodeGenerator();

  const uniqueIdGenerator =
    new InMemoryUniqueIdGenerator();

  const shortenedUrlRepository =
    new InMemoryShortenedUrlRepository();

  const createShortUrl =
    new CreateShortUrlUseCaseImpl(
      shortCodeGenerator,
      uniqueIdGenerator,
      shortenedUrlRepository,
      shortenedUrlRepository,
    );

  const resolveShortUrl =
    new ResolveShortUrlUseCaseImpl(
      shortenedUrlRepository,
    );

  const createShortUrlController =
    new CreateShortUrlController(
      createShortUrl,
    );

  const resolveShortUrlController =
    new ResolveShortUrlController(
      resolveShortUrl,
    );

  return {
    createShortUrl,
    resolveShortUrl,
    createShortUrlController,
    resolveShortUrlController,
  };
}
```

**Important:** your exact implementation filenames may differ slightly from the illustrative names above. Keep the names you already created; the important part is the dependency direction.

---

# 3. What `wire.ts` is now doing

This is the key architectural concept.

`wire.ts` knows about **everything concrete**:

```text
                    wire.ts
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
   Generators      Repository       Use Cases
                                        │
                                        ▼
                                  Controllers
```

But:

```text
Domain
   ↑
Application
   ↑
Adapters
```

The dependency direction remains:

```text
HTTP Adapter
     ↓
Application
     ↓
Domain
```

while the application depends only on **ports**, not concrete adapters.

---

# 4. Now `main.ts` becomes very small

The actual HTTP entry point can now bootstrap everything:

```ts
import express from 'express';

import { wireUrlService } from './wire';
import { createUrlRoutes } from './adapters/http/routes/url.routes';

const app = express();

app.use(express.json());

const urlService = wireUrlService();

app.use(
  createUrlRoutes(
    urlService.createShortUrlController,
    urlService.resolveShortUrlController,
  ),
);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(
    `URL service running on http://localhost:${PORT}`,
  );
});
```

Now the runtime flow is:

```text
main.ts
   │
   ├── Express
   │
   ├── wireUrlService()
   │       │
   │       ├── adapters
   │       ├── use cases
   │       └── controllers
   │
   └── createUrlRoutes(...)
             │
             ├── POST /urls
             └── GET /:shortCode
```

At this point we have a **real HTTP application**, while the domain and application layers remain independent of Express.

The next piece should be the **global HTTP error handler**, so domain errors such as `InvalidUrlError` don't become uncontrolled Express 500 responses.