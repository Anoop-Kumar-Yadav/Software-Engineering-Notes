## Phase 9 — Composition Root / `wire.ts`

Now we have all the pieces:

```text
Domain
   ↓
Use Cases
   ↓
Ports
   ↑
Adapters
```

`wire.ts` is where we **connect the concrete implementations to the abstractions**.

### `src/wire.ts`

```ts
import { CreateShortUrlUseCase } from './core/application/use-cases/create-short-url/create-short-url.use-case';
import { CreateShortUrlUseCaseImpl } from './core/application/use-cases/create-short-url/create-short-url.use-case.impl';

import { ResolveShortUrlUseCase } from './core/application/use-cases/resolve-short-url/resolve-short-url.use-case';
import { ResolveShortUrlUseCaseImpl } from './core/application/use-cases/resolve-short-url/resolve-short-url.use-case.impl';

import { InMemoryShortCodeGenerator } from './adapters/generators/in-memory-short-code-generator';
import { InMemoryShortenedUrlIdGenerator } from './adapters/generators/in-memory-shortened-url-id-generator';
import { InMemoryShortenedUrlRepository } from './adapters/persistence/in-memory-shortened-url-repository';

export interface UrlService {
  createShortUrl: CreateShortUrlUseCase;
  resolveShortUrl: ResolveShortUrlUseCase;
}

export function wireUrlService(): UrlService {
  const shortCodeGenerator =
    new InMemoryShortCodeGenerator();

  const shortenedUrlIdGenerator =
    new InMemoryShortenedUrlIdGenerator();

  const shortenedUrlRepository =
    new InMemoryShortenedUrlRepository();

  const createShortUrl =
    new CreateShortUrlUseCaseImpl(
      shortCodeGenerator,
      shortenedUrlIdGenerator,
      shortenedUrlRepository,
      shortenedUrlRepository,
    );

  const resolveShortUrl =
    new ResolveShortUrlUseCaseImpl(
      shortenedUrlRepository,
    );

  return {
    createShortUrl,
    resolveShortUrl,
  };
}
```

## The Object Graph

The important part is understanding what `wire.ts` actually did:

```text
wireUrlService()
        │
        ├── new InMemoryShortCodeGenerator()
        │             │
        │             └── ShortCodeGenerator
        │
        ├── new InMemoryShortenedUrlIdGenerator()
        │             │
        │             └── ShortenedUrlIdGenerator
        │
        ├── new InMemoryShortenedUrlRepository()
        │             │
        │             ├── ShortenedUrlReader
        │             └── ShortenedUrlWriter
        │
        ├── new CreateShortUrlUseCaseImpl(...)
        │
        └── new ResolveShortUrlUseCaseImpl(...)
```

The repository object is injected twice:

```text
InMemoryShortenedUrlRepository
        │
        ├── ShortenedUrlReader
        │       ↓
        │  CreateShortUrl
        │
        └── ShortenedUrlWriter
                ↓
           CreateShortUrl

InMemoryShortenedUrlRepository
        │
        └── ShortenedUrlReader
                ↓
         ResolveShortUrl
```

That's perfectly valid because **one concrete adapter can implement multiple ports**.

---

## The Architecture Is Now Wired

```text
                    wire.ts
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
 ShortCode        ShortenedUrl      ShortenedUrl
 Generator        Repository        ID Generator
       │           │       │              │
       │           │       │              │
       ▼           ▼       ▼              ▼
       Port        Reader  Writer         Port
       │             │       │             │
       └─────────────┼───────┼─────────────┘
                     │       │
                     ▼       ▼
               CreateShortUrl
                     │
                     ▼
                  Domain
```

The next step is **not HTTP yet**.

We should first create a small `main.ts` that calls the wired use cases and verifies that the entire dependency graph actually works end-to-end.