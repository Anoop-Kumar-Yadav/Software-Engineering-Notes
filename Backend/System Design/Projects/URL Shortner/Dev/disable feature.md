Yes. That's the better progression. We already designed the `DISABLED` domain state, so now we'll make it an actual use case.

We will **not add expiration or redirect yet**.

## Step 1 — Define the use case

The feature flow is:

```text
POST /urls/:shortCode/disable
        ↓
Controller
        ↓
DisableShortUrlUseCase
        ↓
ShortenedUrlReader
        ↓
ShortenedUrl.disable()
        ↓
ShortenedUrlWriter
```

The important part is that **the entity performs the state transition**:

```ts
shortenedUrl.disable();
```

The use case orchestrates the operation.

---

## Step 2 — Create the use-case files

Add:

```text
application/
└── use-cases/
    └── disableShortUrl/
        ├── disableShortUrl.use-case.ts
        ├── disableShortUrl.types.ts
        └── disableShortUrl.use-case.impl.ts
```

### `disableShortUrl.types.ts`

```ts
export interface DisableShortUrlInput {
  shortCode: string;
}

export interface DisableShortUrlOutput {
  shortCode: string;
  status: string;
}
```

### `disableShortUrl.use-case.ts`

```ts
import {
  DisableShortUrlInput,
  DisableShortUrlOutput,
} from './disableShortUrl.types';

export interface DisableShortUrlUseCase {
  execute(
    input: DisableShortUrlInput,
  ): Promise<DisableShortUrlOutput>;
}
```

### `disableShortUrl.use-case.impl.ts`

```ts
import { ShortCode } from '../../../domain/value-objects/shortCode.value';
import { ShortenedUrlReader } from '../../ports/shortenedUrlReader.port';
import { ShortenedUrlWriter } from '../../ports/shortenedUrlWriter.port';
import { ShortenedUrlStatus } from '../../../domain/types/shortenedUrlStatus.type';

import {
  DisableShortUrlInput,
  DisableShortUrlOutput,
} from './disableShortUrl.types';

import { DisableShortUrlUseCase } from './disableShortUrl.use-case';

export class DisableShortUrlUseCaseImpl
  implements DisableShortUrlUseCase
{
  constructor(
    private readonly shortenedUrlReader: ShortenedUrlReader,
    private readonly shortenedUrlWriter: ShortenedUrlWriter,
  ) {}

  async execute(
    input: DisableShortUrlInput,
  ): Promise<DisableShortUrlOutput> {
    const shortCode = ShortCode.create(input.shortCode);

    const shortenedUrl =
      await this.shortenedUrlReader.findByShortCode(
        shortCode,
      );

    if (!shortenedUrl) {
      throw new Error(
        `Short URL '${shortCode.getValue()}' not found`,
      );
    }

    shortenedUrl.disable();

    await this.shortenedUrlWriter.save(shortenedUrl);

    return {
      shortCode: shortenedUrl
        .getShortCode()
        .getValue(),

      status: shortenedUrl.getStatus(),
    };
  }
}
```

### One thing to notice

We don't do this:

```ts
shortenedUrl.status = DISABLED;
```

The entity owns that rule:

```ts
shortenedUrl.disable();
```

So if later the rule becomes:

> Only an ACTIVE URL can be disabled.

the entity already protects it.

```text
Use Case
   │
   │ orchestrates
   ▼
Entity
   │
   │ enforces business rule
   ▼
DISABLED
```

---

## Step 3 — Wire the new use case

Add it to `wire.ts`:

```ts
import { DisableShortUrlUseCase } from './application/use-cases/disableShortUrl/disableShortUrl.use-case';
import { DisableShortUrlUseCaseImpl } from './application/use-cases/disableShortUrl/disableShortUrl.use-case.impl';
```

Add it to the service interface:

```ts
export interface UrlService {
  createShortUrl: CreateShortUrlUseCase;
  resolveShortUrl: ResolveShortUrlUseCase;
  disableShortUrl: DisableShortUrlUseCase;

  createShortUrlController: CreateShortUrlController;
  resolveShortUrlController: ResolveShortUrlController;
}
```

Then construct it:

```ts
const disableShortUrl =
  new DisableShortUrlUseCaseImpl(
    shortenedUrlRepository,
    shortenedUrlRepository,
  );
```

And return it:

```ts
return {
  createShortUrl,
  resolveShortUrl,
  disableShortUrl,
  createShortUrlController,
  resolveShortUrlController,
};
```

We don't need a new adapter because our existing repository already implements both:

```ts
ShortenedUrlReader
ShortenedUrlWriter
```

---

## Step 4 — Controller

Create:

```text
adapters/
└── http/
    └── controllers/
        └── disableShortUrl.controller.ts
```

```ts
import { Request, Response } from 'express';

import { DisableShortUrlUseCase } from '../../../application/use-cases/disableShortUrl/disableShortUrl.use-case';

export class DisableShortUrlController {
  constructor(
    private readonly disableShortUrlUseCase: DisableShortUrlUseCase,
  ) {}

  async handle(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { shortCode } = req.params;

    const result =
      await this.disableShortUrlUseCase.execute({
        shortCode,
      });

    res.status(200).json(result);
  }
}
```

---

## Step 5 — Route

Update:

```text
adapters/http/routes/url.routes.ts
```

Add the controller parameter:

```ts
export function createUrlRoutes(
  createShortUrlController: CreateShortUrlController,
  resolveShortUrlController: ResolveShortUrlController,
  disableShortUrlController: DisableShortUrlController,
): Router {
```

Import it:

```ts
import { DisableShortUrlController } from '../controllers/disableShortUrl.controller';
```

And add:

```ts
router.post(
  '/urls/:shortCode/disable',
  disableShortUrlController.handle.bind(
    disableShortUrlController,
  ),
);
```

---

## Step 6 — Wire the controller

In `wire.ts`:

```ts
import { DisableShortUrlController } from './adapters/http/controllers/disableShortUrl.controller';
```

Create it:

```ts
const disableShortUrlController =
  new DisableShortUrlController(
    disableShortUrl,
  );
```

Return it:

```ts
return {
  createShortUrl,
  resolveShortUrl,
  disableShortUrl,
  createShortUrlController,
  resolveShortUrlController,
  disableShortUrlController,
};
```

And update `UrlService`:

```ts
export interface UrlService {
  createShortUrl: CreateShortUrlUseCase;
  resolveShortUrl: ResolveShortUrlUseCase;
  disableShortUrl: DisableShortUrlUseCase;

  createShortUrlController: CreateShortUrlController;
  resolveShortUrlController: ResolveShortUrlController;
  disableShortUrlController: DisableShortUrlController;
}
```

---

## Step 7 — Register the route in `main.ts`

Change:

```ts
app.use(
  createUrlRoutes(
    urlService.createShortUrlController,
    urlService.resolveShortUrlController,
    urlService.disableShortUrlController,
  ),
);
```

Now the complete feature is:

```text
POST /urls
     ↓
CreateShortUrlController
     ↓
CreateShortUrlUseCase
     ↓
ShortenedUrl
```

and:

```text
GET /:shortCode
     ↓
ResolveShortUrlController
     ↓
ResolveShortUrlUseCase
     ↓
ShortenedUrl
```

and now:

```text
POST /urls/:shortCode/disable
     ↓
DisableShortUrlController
     ↓
DisableShortUrlUseCase
     ↓
ShortenedUrl.disable()
     ↓
Repository.save()
```

### Test it

First create a URL:

```bash
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://example.com"}'
```

Suppose you get:

```json
{
  "shortCode": "a1b2c3"
}
```

Then:

```bash
curl -X POST http://localhost:3000/urls/a1b2c3/disable
```

Expected:

```json
{
  "shortCode": "a1b2c3",
  "status": "DISABLED"
}
```

Then try:

```bash
curl http://localhost:3000/a1b2c3
```

It should **not resolve**, because `canResolve()` returns `false` for `DISABLED`.

One caveat: the code above assumes your use-case folders/files use the naming shown. Since your repository has some existing camelCase filenames, if TypeScript reports an import-path mismatch, use your exact existing filenames rather than renaming the architecture just to match the example.