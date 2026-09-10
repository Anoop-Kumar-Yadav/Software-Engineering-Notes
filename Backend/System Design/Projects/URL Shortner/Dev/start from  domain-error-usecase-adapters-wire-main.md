### `src/core/domain/value-objects/url.ts`

```ts
export class Url {
  private constructor(
    private readonly value: string,
  ) {}

  public static create(value: string): Url {
    if (!value || value.trim().length === 0) {
      throw new Error('URL cannot be empty');
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      throw new Error('Invalid URL');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('URL must use HTTP or HTTPS');
    }

    return new Url(parsedUrl.toString());
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Url): boolean {
    return this.value === other.value;
  }
}
```

### `src/core/domain/value-objects/short-code.ts`

```ts
export class ShortCode {
  private constructor(
    private readonly value: string,
  ) {}

  public static create(value: string): ShortCode {
    if (!value || value.trim().length === 0) {
      throw new Error('Short code cannot be empty');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new Error('Invalid short code format');
    }

    return new ShortCode(value);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: ShortCode): boolean {
    return this.value === other.value;
  }
}
```

### `src/core/domain/value-objects/shortened-url-id.ts`

```ts
export class ShortenedUrlId {
  private constructor(
    private readonly value: string,
  ) {}

  public static create(value: string): ShortenedUrlId {
    if (!value || value.trim().length === 0) {
      throw new Error('Shortened URL ID cannot be empty');
    }

    return new ShortenedUrlId(value);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: ShortenedUrlId): boolean {
    return this.value === other.value;
  }
}
```

### `src/core/domain/types/shortened-url-status.ts`

```ts
export enum ShortenedUrlStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}
```

### `src/core/domain/entities/shortened-url.ts`

```ts
import { ShortenedUrlId } from '../value-objects/shortened-url-id';
import { ShortCode } from '../value-objects/short-code';
import { Url } from '../value-objects/url';
import { ShortenedUrlStatus } from '../types/shortened-url-status';

interface CreateShortenedUrlProps {
  id: ShortenedUrlId;
  originalUrl: Url;
  shortCode: ShortCode;
  createdAt: Date;
  expiresAt?: Date;
}

export class ShortenedUrl {
  private status: ShortenedUrlStatus;

  private constructor(
    private readonly id: ShortenedUrlId,
    private readonly originalUrl: Url,
    private readonly shortCode: ShortCode,
    private readonly createdAt: Date,
    private readonly expiresAt?: Date,
  ) {
    this.status = ShortenedUrlStatus.ACTIVE;
  }

  public static create(
    props: CreateShortenedUrlProps,
  ): ShortenedUrl {
    if (
      props.expiresAt &&
      props.expiresAt <= props.createdAt
    ) {
      throw new Error(
        'Expiration date must be after creation date',
      );
    }

    return new ShortenedUrl(
      props.id,
      props.originalUrl,
      props.shortCode,
      props.createdAt,
      props.expiresAt,
    );
  }

  public getId(): ShortenedUrlId {
    return this.id;
  }

  public getOriginalUrl(): Url {
    return this.originalUrl;
  }

  public getShortCode(): ShortCode {
    return this.shortCode;
  }

  public getStatus(): ShortenedUrlStatus {
    return this.status;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getExpiresAt(): Date | undefined {
    return this.expiresAt;
  }

  public isExpired(now: Date = new Date()): boolean {
    return Boolean(
      this.expiresAt && now >= this.expiresAt,
    );
  }

  public canResolve(now: Date = new Date()): boolean {
    if (this.status !== ShortenedUrlStatus.ACTIVE) {
      return false;
    }

    return !this.isExpired(now);
  }

  public expire(): void {
    if (this.status !== ShortenedUrlStatus.ACTIVE) {
      throw new Error(
        'Only an active shortened URL can expire',
      );
    }

    this.status = ShortenedUrlStatus.EXPIRED;
  }

  public disable(): void {
    if (this.status !== ShortenedUrlStatus.ACTIVE) {
      throw new Error(
        'Only an active shortened URL can be disabled',
      );
    }

    this.status = ShortenedUrlStatus.DISABLED;
  }
}
```

## Domain Exploration — Next: Domain Error Types

```text
src/
└── core/
    └── domain/
        ├── entities/
        │   └── shortened-url.ts
        ├── value-objects/
        │   ├── url.ts
        │   ├── short-code.ts
        │   └── shortened-url-id.ts
        ├── types/
        │   └── shortened-url-status.ts
        └── errors/
            ├── invalid-url.error.ts
            ├── invalid-short-code.error.ts
            └── invalid-shortened-url.error.ts
```

### `src/core/domain/errors/invalid-url.error.ts`

```ts
export class InvalidUrlError extends Error {
  constructor(message = 'Invalid URL') {
    super(message);

    this.name = 'InvalidUrlError';
  }
}
```

### `src/core/domain/errors/invalid-short-code.error.ts`

```ts
export class InvalidShortCodeError extends Error {
  constructor(message = 'Invalid short code') {
    super(message);

    this.name = 'InvalidShortCodeError';
  }
}
```

### `src/core/domain/errors/invalid-shortened-url.error.ts`

```ts
export class InvalidShortenedUrlError extends Error {
  constructor(message = 'Invalid shortened URL') {
    super(message);

    this.name = 'InvalidShortenedUrlError';
  }
}
```

### Update `url.ts`

```ts
import { InvalidUrlError } from '../errors/invalid-url.error';

export class Url {
  private constructor(
    private readonly value: string,
  ) {}

  public static create(value: string): Url {
    if (!value || value.trim().length === 0) {
      throw new InvalidUrlError('URL cannot be empty');
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      throw new InvalidUrlError('Invalid URL');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new InvalidUrlError(
        'URL must use HTTP or HTTPS',
      );
    }

    return new Url(parsedUrl.toString());
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Url): boolean {
    return this.value === other.value;
  }
}
```

### Update `short-code.ts`

```ts
import { InvalidShortCodeError } from '../errors/invalid-short-code.error';

export class ShortCode {
  private constructor(
    private readonly value: string,
  ) {}

  public static create(value: string): ShortCode {
    if (!value || value.trim().length === 0) {
      throw new InvalidShortCodeError(
        'Short code cannot be empty',
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new InvalidShortCodeError(
        'Invalid short code format',
      );
    }

    return new ShortCode(value);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: ShortCode): boolean {
    return this.value === other.value;
  }
}
```

### Update `shortened-url.ts`

```ts
import { InvalidShortenedUrlError } from '../errors/invalid-shortened-url.error';

export class ShortenedUrl {
  private status: ShortenedUrlStatus;

  private constructor(
    private readonly id: ShortenedUrlId,
    private readonly originalUrl: Url,
    private readonly shortCode: ShortCode,
    private readonly createdAt: Date,
    private readonly expiresAt?: Date,
  ) {
    this.status = ShortenedUrlStatus.ACTIVE;
  }

  public static create(
    props: CreateShortenedUrlProps,
  ): ShortenedUrl {
    if (
      props.expiresAt &&
      props.expiresAt <= props.createdAt
    ) {
      throw new InvalidShortenedUrlError(
        'Expiration date must be after creation date',
      );
    }

    return new ShortenedUrl(
      props.id,
      props.originalUrl,
      props.shortCode,
      props.createdAt,
      props.expiresAt,
    );
  }

  // ...remaining methods unchanged
}
```
## Phase 4 — Use-Case Contracts

```text
src/
└── core/
    └── application/
        └── use-cases/
            ├── create-short-url/
            │   ├── create-short-url.use-case.ts
            │   └── create-short-url.types.ts
            │
            └── resolve-short-url/
                ├── resolve-short-url.use-case.ts
                └── resolve-short-url.types.ts
```

### `src/core/application/use-cases/create-short-url/create-short-url.types.ts`

```ts
import { ShortenedUrlId } from '../../../domain/value-objects/shortened-url-id';
import { ShortCode } from '../../../domain/value-objects/short-code';
import { Url } from '../../../domain/value-objects/url';

export interface CreateShortUrlInput {
  originalUrl: string;
  expiresAt?: Date;
}

export interface CreateShortUrlOutput {
  id: ShortenedUrlId;
  originalUrl: Url;
  shortCode: ShortCode;
  createdAt: Date;
  expiresAt?: Date;
}
```

### `src/core/application/use-cases/create-short-url/create-short-url.use-case.ts`

```ts
import {
  CreateShortUrlInput,
  CreateShortUrlOutput,
} from './create-short-url.types';

export interface CreateShortUrlUseCase {
  execute(
    input: CreateShortUrlInput,
  ): Promise<CreateShortUrlOutput>;
}
```

### `src/core/application/use-cases/resolve-short-url/resolve-short-url.types.ts`

```ts
import { ShortCode } from '../../../domain/value-objects/short-code';
import { Url } from '../../../domain/value-objects/url';

export interface ResolveShortUrlInput {
  shortCode: string;
}

export interface ResolveShortUrlOutput {
  shortCode: ShortCode;
  originalUrl: Url;
}
```

### `src/core/application/use-cases/resolve-short-url/resolve-short-url.use-case.ts`

```ts
import {
  ResolveShortUrlInput,
  ResolveShortUrlOutput,
} from './resolve-short-url.types';

export interface ResolveShortUrlUseCase {
  execute(
    input: ResolveShortUrlInput,
  ): Promise<ResolveShortUrlOutput>;
}
```

## Phase 5 — Implement `CreateShortUrl`

Now we have the use-case **contract**. We need its concrete implementation.

The implementation needs three external capabilities:

```text
CreateShortUrl
├── ShortCodeGenerator
├── ShortenedUrlReader
└── ShortenedUrlWriter
```

So we define those ports first.

### `src/core/application/ports/short-code-generator.ts`

```ts
import { ShortCode } from '../../domain/value-objects/short-code';

export interface ShortCodeGenerator {
  generate(): ShortCode;
}
```

### `src/core/application/ports/shortened-url-reader.ts`

```ts
import { ShortCode } from '../../domain/value-objects/short-code';
import { ShortenedUrl } from '../../domain/entities/shortened-url';

export interface ShortenedUrlReader {
  findByShortCode(
    shortCode: ShortCode,
  ): Promise<ShortenedUrl | null>;
}
```

### `src/core/application/ports/shortened-url-writer.ts`

```ts
import { ShortenedUrl } from '../../domain/entities/shortened-url';

export interface ShortenedUrlWriter {
  save(shortenedUrl: ShortenedUrl): Promise<void>;
}
```

---

## `src/core/application/use-cases/create-short-url/create-short-url.use-case.impl.ts`

```ts
import { ShortenedUrl } from '../../../domain/entities/shortened-url';
import { ShortenedUrlId } from '../../../domain/value-objects/shortened-url-id';
import { Url } from '../../../domain/value-objects/url';

import { ShortCodeGenerator } from '../../ports/short-code-generator';
import { ShortenedUrlReader } from '../../ports/shortened-url-reader';
import { ShortenedUrlWriter } from '../../ports/shortened-url-writer';

import {
  CreateShortUrlInput,
  CreateShortUrlOutput,
} from './create-short-url.types';
import { CreateShortUrlUseCase } from './create-short-url.use-case';

export class CreateShortUrlUseCaseImpl
  implements CreateShortUrlUseCase
{
  constructor(
    private readonly shortCodeGenerator: ShortCodeGenerator,
    private readonly shortenedUrlReader: ShortenedUrlReader,
    private readonly shortenedUrlWriter: ShortenedUrlWriter,
  ) {}

  async execute(
    input: CreateShortUrlInput,
  ): Promise<CreateShortUrlOutput> {
    const originalUrl = Url.create(input.originalUrl);

    let shortCode = this.shortCodeGenerator.generate();

    while (
      await this.shortenedUrlReader.findByShortCode(shortCode)
    ) {
      shortCode = this.shortCodeGenerator.generate();
    }

    const shortenedUrl = ShortenedUrl.create({
      id: ShortenedUrlId.create(crypto.randomUUID()),
      originalUrl,
      shortCode,
      createdAt: new Date(),
      expiresAt: input.expiresAt,
    });

    await this.shortenedUrlWriter.save(shortenedUrl);

    return {
      id: shortenedUrl.getId(),
      originalUrl: shortenedUrl.getOriginalUrl(),
      shortCode: shortenedUrl.getShortCode(),
      createdAt: shortenedUrl.getCreatedAt(),
      expiresAt: shortenedUrl.getExpiresAt(),
    };
  }
}
```

## Current Dependency Flow

```text
CreateShortUrlUseCaseImpl
        │
        ├── ShortCodeGenerator
        ├── ShortenedUrlReader
        ├── ShortenedUrlWriter
        │
        └── Domain
            ├── Url
            ├── ShortCode
            ├── ShortenedUrlId
            └── ShortenedUrl
```

One correction we'll make in the next step: **ID generation should also become a port**, rather than calling `crypto.randomUUID()` directly inside the use case. That gives us the clean dependency boundary we are trying to learn.

## Phase 7 — Implement `ResolveShortUrl`

### `src/core/application/use-cases/resolve-short-url/resolve-short-url.use-case.impl.ts`

```ts
import { ShortCode } from '../../../domain/value-objects/short-code';

import { ShortenedUrlReader } from '../../ports/shortened-url-reader';

import {
  ResolveShortUrlInput,
  ResolveShortUrlOutput,
} from './resolve-short-url.types';

import { ResolveShortUrlUseCase } from './resolve-short-url.use-case';

export class ResolveShortUrlUseCaseImpl
  implements ResolveShortUrlUseCase
{
  constructor(
    private readonly shortenedUrlReader: ShortenedUrlReader,
  ) {}

  async execute(
    input: ResolveShortUrlInput,
  ): Promise<ResolveShortUrlOutput> {
    const shortCode = ShortCode.create(input.shortCode);

    const shortenedUrl =
      await this.shortenedUrlReader.findByShortCode(shortCode);

    if (!shortenedUrl) {
      throw new Error(
        `Short URL '${shortCode.getValue()}' not found`,
      );
    }

    if (!shortenedUrl.canResolve()) {
      throw new Error(
        `Short URL '${shortCode.getValue()}' cannot be resolved`,
      );
    }

    return {
      shortCode: shortenedUrl.getShortCode(),
      originalUrl: shortenedUrl.getOriginalUrl(),
    };
  }
}
```

### Current Application Layer

```text
core/
│
├── domain/
│   ├── entities/
│   │   └── shortened-url.ts
│   ├── value-objects/
│   │   ├── shortened-url-id.ts
│   │   ├── short-code.ts
│   │   └── url.ts
│   ├── types/
│   │   └── shortened-url-status.ts
│   └── errors/
│
└── application/
    ├── ports/
    │   ├── short-code-generator.ts
    │   ├── shortened-url-id-generator.ts
    │   ├── shortened-url-reader.ts
    │   └── shortened-url-writer.ts
    │
    └── use-cases/
        ├── create-short-url/
        │   ├── create-short-url.use-case.ts
        │   ├── create-short-url.use-case.impl.ts
        │   └── create-short-url.types.ts
        │
        └── resolve-short-url/
            ├── resolve-short-url.use-case.ts
            ├── resolve-short-url.use-case.impl.ts
            └── resolve-short-url.types.ts
```

One thing remains before moving to adapters: the two `Error` calls above should eventually be replaced with **URL-service-specific application/domain errors** rather than generic `Error`.

Next, we move outward to **adapters**: first the in-memory implementations of our ports, so we can test the entire core without MongoDB.