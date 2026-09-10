## `main.ts` — Application Entry Point

Since this is a **standalone `url-service` repository with its own server**, `main.ts` should be the runtime entry point.

For now, we are not introducing Express. We first verify that the **wired application can start and execute**.

### `main.ts`

```ts
import { wireUrlService } from './wire';

async function bootstrap(): Promise<void> {
  const urlService = wireUrlService();

  const createdUrl = await urlService.createShortUrl.execute({
    originalUrl: 'https://example.com',
  });

  console.log('Short URL created:', {
    id: createdUrl.id.getValue(),
    shortCode: createdUrl.shortCode.getValue(),
    originalUrl: createdUrl.originalUrl.getValue(),
  });

  const resolvedUrl = await urlService.resolveShortUrl.execute({
    shortCode: createdUrl.shortCode.getValue(),
  });

  console.log('Short URL resolved:', {
    shortCode: resolvedUrl.shortCode.getValue(),
    originalUrl: resolvedUrl.originalUrl.getValue(),
  });
}

bootstrap().catch((error: unknown) => {
  console.error('Application failed to start:', error);

  process.exitCode = 1;
});
```

### Runtime flow

```text
main.ts
   │
   ▼
wireUrlService()
   │
   ├── adapters
   │
   └── use cases
         │
         ▼
      execute()
         │
         ▼
       domain
```

For the moment, `main.ts` is effectively our **composition/runtime entry point test**.

Later, when we add HTTP:

```text
main.ts
   │
   ▼
wireUrlService()
   │
   ▼
HTTP Server
   │
   ├── POST /shorten
   └── GET /:shortCode
```

The important architectural rule remains:

```text
main.ts
   ↓
wire.ts
   ↓
use cases
   ↓
ports
   ↓
adapters
```

**Next we should make `wire.ts` compile against your exact current filenames and interfaces**, then run `main.ts` before adding HTTP.