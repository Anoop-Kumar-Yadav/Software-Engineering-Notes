## Phase 10 — Run the Wired Application

Now we test the architecture **without Express, MongoDB, or any HTTP layer**.

### `src/main.ts`

```ts
import { wireUrlService } from './wire';

async function main(): Promise<void> {
  const urlService = wireUrlService();

  const created = await urlService.createShortUrl.execute({
    originalUrl: 'https://example.com/articles/typescript',
  });

  console.log('Created URL:');
  console.log({
    id: created.id.getValue(),
    originalUrl: created.originalUrl.getValue(),
    shortCode: created.shortCode.getValue(),
    createdAt: created.createdAt,
  });

  const resolved =
    await urlService.resolveShortUrl.execute({
      shortCode: created.shortCode.getValue(),
    });

  console.log('\nResolved URL:');
  console.log({
    shortCode: resolved.shortCode.getValue(),
    originalUrl: resolved.originalUrl.getValue(),
  });
}

main().catch((error: unknown) => {
  console.error('Application failed:', error);

  process.exitCode = 1;
});
```

### Expected flow

```text
main.ts
   │
   ▼
wireUrlService()
   │
   ├── ShortCodeGenerator
   ├── ShortenedUrlIdGenerator
   ├── Repository
   │
   ├── CreateShortUrlUseCase
   └── ResolveShortUrlUseCase
          │
          ▼
      Domain Objects
```

Then:

```text
CreateShortUrl
      │
      ▼
ShortenedUrl
      │
      ▼
InMemoryRepository
      │
      ▼
ResolveShortUrl
      │
      ▼
Original URL
```

### Run

```bash
pnpm exec tsx src/main.ts
```

You should see something conceptually like:

```text
Created URL:
{
  id: '...',
  originalUrl: 'https://example.com/articles/typescript',
  shortCode: 'x7k2pa',
  createdAt: ...
}

Resolved URL:
{
  shortCode: 'x7k2pa',
  originalUrl: 'https://example.com/articles/typescript'
}
```

At this checkpoint, we have proven that:

```text
Domain
   ↓
Use Case
   ↓
Port
   ↑
Adapter
   ↑
Wire
   ↓
Application
```

works **without any framework or database**.

The next step should be **testing this complete core**, especially testing `CreateShortUrlUseCaseImpl` with fake ports rather than the real in-memory adapters.