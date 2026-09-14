# Lesson 10: How Nx Detects Dependencies Between Projects

In the previous lesson, we learned that the Project Graph contains:

- Nodes → Nx projects
    
- Edges → dependencies between projects
    

Now we need to understand:

> How does Nx know that one project depends on another?

Nx primarily identifies dependencies by analyzing project configuration and the relationships expressed in source code.

## 1. Dependency Through an Import

Consider this workspace:

```
url-platform/
├── apps/
│   └── url-service/
└── libs/
    └── logger/
```

The `logger` library exposes a function:

TypeScript

```
// libs/logger/src/lib/logger.ts

export function createLogger() {
  return {
    info(message: string) {
      console.log(message);
    },
  };
}
```

The `url-service` imports that function:

TypeScript

```
// apps/url-service/src/main.ts

import { createLogger } from '@url-platform/logger';

const logger = createLogger();

logger.info('URL service started');
```

Here, `url-service` consumes code from `logger`.

Therefore, Nx identifies this relationship:

```
url-service ──depends on──▶ logger
```

The resulting graph contains:

```
url-service
     │
     ▼
   logger
```

The dependency direction is determined by the consumer:

```
Consumer ──▶ Provider
```

In this example:

- `url-service` is the consumer.
    
- `logger` is the provider.
    
- Therefore, the edge is:
    
    url-service ──▶ logger
    

## 2. Importing Through a Library Alias

In an Nx workspace, libraries are commonly imported using a configured alias rather than a relative path.

For example:

TypeScript

```
import { createLogger } from '@url-platform/logger';
```

The alias may be configured through TypeScript path mappings:

JSON

```
{
  "compilerOptions": {
    "paths": {
      "@url-platform/logger": [
        "libs/logger/src/index.ts"
      ]
    }
  }
}
```

Conceptually, the alias means:

```
@url-platform/logger
        │
        ▼
libs/logger/src/index.ts
```

Nx analyzes the import and resolves the referenced project.

It can then understand that:

```
apps/url-service
```

depends on:

```
libs/logger
```

The important point is that Nx does not only look at the textual name of the import. It must associate the imported code with a specific Nx project.

## 3. Direct and Transitive Dependencies

Dependencies can be either direct or transitive.

### Direct Dependency

A project directly imports another project.

Example:

```
url-service ──▶ logger
```

If `url-service` imports something from `logger`, then `logger` is a direct dependency of `url-service`.

### Transitive Dependency

A project depends on another project indirectly through an intermediate project.

Consider:

```
url-service ──▶ common ──▶ logger
```

Here:

- `url-service` directly depends on `common`.
    
- `common` directly depends on `logger`.
    
- `url-service` indirectly depends on `logger`.
    

Therefore:

```
url-service
    │
    ▼
  common
    │
    ▼
  logger
```

The dependency chain is:

```
url-service → common → logger
```

Even if `url-service` never imports `logger` directly, changes to `logger` may still affect `url-service` through `common`.

## 4. Example with a URL-Shortener Monorepo

Consider these libraries:

```
libs/
├── logger/
├── config/
├── contracts/
└── common/
```

Suppose the relationships are:

```
common ──▶ logger

url-service ──▶ common
url-service ──▶ config
url-service ──▶ contracts

api-gateway ──▶ contracts
api-gateway ──▶ logger
```

The graph can be represented as:

```
url-service ──▶ common ──▶ logger
     │
     ├────────▶ config
     │
     └────────▶ contracts ◀── api-gateway
                              │
                              └──▶ logger
```

In this structure:

- `url-service` directly depends on `common`, `config`, and `contracts`.
    
- `common` directly depends on `logger`.
    
- `url-service` transitively depends on `logger` through `common`.
    
- `api-gateway` directly depends on `contracts` and `logger`.
    

## 5. Dependency Through Configuration

Not every dependency is necessarily created by a normal TypeScript import.

Nx can also recognize relationships through supported project configuration and plugins.

For example, a project may reference another project in a task configuration:

JSON

```
{
  "targets": {
    "serve": {
      "dependsOn": [
        "url-service:build"
      ]
    }
  }
}
```

This expresses a task-level relationship:

```
serve task
    │
    ▼
url-service:build
```

This is different from a source-code import.

There are two distinct concepts:

|  
Dependency type

|

Meaning

|  
| --- | --- |  
|

Source dependency

|

One project imports or consumes code from another project

|  
|

Task dependency

|

One Nx task must run before another task

|  
|

Runtime dependency

|

One running service requires another running service

|  
|

Package dependency

|

One project uses an external npm package

|

These relationships may interact, but they should not be treated as identical.

## 6. Source Dependency vs Runtime Dependency

This is especially important in a microservices architecture.

Suppose the API gateway sends an HTTP request to the URL service:

TypeScript

```
const response = await fetch(
  'http://url-service:3000/urls'
);
```

At runtime:

```
api-gateway ──HTTP──▶ url-service
```

But there may be no source-code import like:

TypeScript

```
import { UrlService } from '@url-platform/url-service';
```

Therefore, Nx may not create a source-code dependency from `api-gateway` to the `url-service` implementation.

The runtime communication and source-code dependency are separate:

```
Source-code graph:

api-gateway ──▶ contracts
url-service ──▶ contracts

Runtime architecture:

api-gateway ──HTTP/TCP──▶ url-service
```

This separation is useful because the API gateway does not need to know the internal implementation of the URL service.

It only needs to know the agreed contract.

## 7. Shared Contract Dependency

Suppose the `contracts` library contains:

TypeScript

```
// libs/contracts/src/lib/url.contract.ts

export interface CreateShortUrlRequest {
  originalUrl: string;
}

export interface CreateShortUrlResponse {
  shortCode: string;
}
```

The API gateway imports the request type:

TypeScript

```
import type {
  CreateShortUrlRequest,
} from '@url-platform/contracts';
```

The URL service imports the response type:

TypeScript

```
import type {
  CreateShortUrlResponse,
} from '@url-platform/contracts';
```

Nx can identify:

```
api-gateway ──▶ contracts
url-service ──▶ contracts
```

The graph shows shared source-code usage:

```
          ┌─────────────┐
          │  contracts  │
          └──────▲──────┘
                 │
        ┌────────┴────────┐
        │                 │
        │                 │
┌───────┴───────┐ ┌───────┴───────┐
│ api-gateway   │ │ url-service   │
└───────────────┘ └───────────────┘
```

This does not mean that the gateway and URL service share their business logic.

They only share defined data structures or communication contracts.

## 8. What Nx Does With Detected Dependencies

Once Nx detects dependencies, it can build a graph such as:

```
api-gateway ──▶ contracts
api-gateway ──▶ logger

url-service ──▶ common
url-service ──▶ config
url-service ──▶ contracts

common ──▶ logger
```

Nx can then reason about relationships.

For example, if `logger` changes:

```
logger
  ▲
  │
common
  ▲
  │
url-service
```

The change may affect:

- `common`
    
- `url-service`
    

If `contracts` changes:

```
contracts
   ▲        ▲
   │        │
api-gateway url-service
```

The change may affect:

- `api-gateway`
    
- `url-service`
    

The graph gives Nx the information required to trace these relationships.

The actual affected-project mechanism will be covered later as a separate topic.

## Core Mental Model

Nx discovers dependencies by examining relationships such as:

```
Project A imports code from Project B
```

which produces:

```
Project A ──▶ Project B
```

A complete dependency chain may look like:

```
api-gateway
     │
     ▼
 contracts
```

or:

```
url-service
     │
     ▼
  common
     │
     ▼
  logger
```

### Core takeaway

> Nx detects project dependencies primarily by resolving imports and recognized project-level configuration. Direct imports create direct edges, while dependency chains create transitive relationships. Runtime HTTP or TCP communication between microservices is separate from source-code dependencies.

Next single concept: Visualizing and inspecting the Nx Project Graph.