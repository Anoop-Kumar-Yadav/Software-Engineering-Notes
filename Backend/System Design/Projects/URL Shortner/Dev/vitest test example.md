Yes. **Vitest is the right choice** for this TypeScript/Node.js project.

I should have included it when we reached testing. Since we're building this as a real mini repository, let's use **Vitest from the beginning** rather than discussing tests abstractly.

## 1. Install Vitest

```bash
pnpm add -D vitest
```

## 2. `package.json`

Add the test scripts:

```json
{
  "scripts": {
    "dev": "tsx src/main.ts",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 3. `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    clearMocks: true,
  },
});
```

## 4. Test the Domain First

Before testing the use cases, we should test the things we just built:

```text
Domain
├── Url
├── ShortCode
├── ShortenedUrlId
└── ShortenedUrl
```

For example:

### `src/core/domain/value-objects/url.test.ts`

```ts
import { describe, expect, it } from 'vitest';

import { InvalidUrlError } from '../../errors/invalid-url.error';
import { Url } from './url';

describe('Url', () => {
  it('should create a valid HTTP URL', () => {
    const url = Url.create('https://example.com');

    expect(url.getValue()).toBe(
      'https://example.com/',
    );
  });

  it('should create a valid HTTPS URL', () => {
    const url = Url.create(
      'https://example.com/docs',
    );

    expect(url.getValue()).toBe(
      'https://example.com/docs',
    );
  });

  it('should reject an empty URL', () => {
    expect(() => Url.create('')).toThrow(
      InvalidUrlError,
    );
  });

  it('should reject an invalid URL', () => {
    expect(() =>
      Url.create('not-a-url'),
    ).toThrow(InvalidUrlError);
  });

  it('should reject unsupported protocols', () => {
    expect(() =>
      Url.create('ftp://example.com'),
    ).toThrow(InvalidUrlError);
  });

  it('should consider equal URLs equal', () => {
    const first = Url.create(
      'https://example.com',
    );

    const second = Url.create(
      'https://example.com',
    );

    expect(first.equals(second)).toBe(true);
  });
});
```

Run:

```bash
pnpm test:run
```

## 5. Our Testing Progression

We should follow the architecture itself:

```text
1. Domain tests
       ↓
2. Use-case tests
       ↓
3. Adapter tests
       ↓
4. Wiring/integration test
       ↓
5. HTTP/endpoint tests
```

For the use-case tests, we **don't necessarily need fakes immediately**. Since our current adapters are in-memory, we can test the complete application using:

```text
CreateShortUrlUseCase
        ↓
InMemoryShortenedUrlRepository
        ↓
InMemoryShortCodeGenerator
        ↓
InMemoryShortenedUrlIdGenerator
```

Then later we'll deliberately learn **why and when a fake/mock/stub is preferable**.

So the next actual implementation step should be:

**Write Vitest tests for `Url`, `ShortCode`, `ShortenedUrlId`, and `ShortenedUrl` first.**