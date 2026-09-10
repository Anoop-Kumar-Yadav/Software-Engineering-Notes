## Phase 8 — Build the In-Memory Adapters

We now have the ports:

```text
ShortCodeGenerator
ShortenedUrlIdGenerator
ShortenedUrlReader
ShortenedUrlWriter
```

Now we create concrete implementations.

```text
Port
  ▲
  │ implements
  │
Adapter
```

### `src/adapters/generators/in-memory-short-code-generator.ts`

```ts
import { ShortCode } from '../../core/domain/value-objects/short-code';
import { ShortCodeGenerator } from '../../core/application/ports/short-code-generator';

export class InMemoryShortCodeGenerator
  implements ShortCodeGenerator
{
  generate(): ShortCode {
    const value = Math.random()
      .toString(36)
      .substring(2, 8);

    return ShortCode.create(value);
  }
}
```

### `src/adapters/generators/in-memory-shortened-url-id-generator.ts`

```ts
import { ShortenedUrlId } from '../../core/domain/value-objects/shortened-url-id';
import { ShortenedUrlIdGenerator } from '../../core/application/ports/shortened-url-id-generator';

export class InMemoryShortenedUrlIdGenerator
  implements ShortenedUrlIdGenerator
{
  generate(): ShortenedUrlId {
    return ShortenedUrlId.create(
      Math.random().toString(36).substring(2),
    );
  }
}
```

### `src/adapters/persistence/in-memory-shortened-url-repository.ts`

```ts
import { ShortenedUrl } from '../../core/domain/entities/shortened-url';
import { ShortCode } from '../../core/domain/value-objects/short-code';

import { ShortenedUrlReader } from '../../core/application/ports/shortened-url-reader';
import { ShortenedUrlWriter } from '../../core/application/ports/shortened-url-writer';

export class InMemoryShortenedUrlRepository
  implements ShortenedUrlReader, ShortenedUrlWriter
{
  private readonly urls = new Map<string, ShortenedUrl>();

  async findByShortCode(
    shortCode: ShortCode,
  ): Promise<ShortenedUrl | null> {
    for (const shortenedUrl of this.urls.values()) {
      if (
        shortenedUrl
          .getShortCode()
          .equals(shortCode)
      ) {
        return shortenedUrl;
      }
    }

    return null;
  }

  async save(
    shortenedUrl: ShortenedUrl,
  ): Promise<void> {
    this.urls.set(
      shortenedUrl.getId().getValue(),
      shortenedUrl,
    );
  }
}
```

## Current Dependency Structure

```text
                    CORE
                     │
          ┌──────────┴──────────┐
          │                     │
     CreateShortUrl       ResolveShortUrl
          │                     │
          ▼                     ▼
       PORTS                  PORT
          ▲                     ▲
          │                     │
     ┌────┼────────┐            │
     │    │        │            │
     │    │        │            │
 Generator ID   Repository      │
     │    │        │            │
     └────┴────────┴────────────┘
              │
           ADAPTERS
```

The important part is that **the adapters depend on the ports, not the other way around**.

Next is the critical step: **`wire.ts`**. We will construct the concrete adapters, inject them into the use cases, and expose the completed URL module.