# Practical Step 3: Understand the Generated `url-service` Structure

Now that the workspace contains the `url-service` application, we need to understand the files Nx and NestJS generated for it.

The goal is to understand how Nx manages the project and how NestJS runs inside that project.

## 1. Inspect the Application Directory

From the workspace root, run:

Bash

```
tree apps/url-service -L 4
```

The structure will be similar to:

```
apps/url-service/
├── src/
│   ├── app/
│   │   ├── app.controller.spec.ts
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   └── app.service.ts
│   └── main.ts
├── project.json
├── tsconfig.app.json
└── tsconfig.json
```

The exact files may vary according to your Nx and NestJS versions.

At a high level:

```
apps/url-service/
├── src/
│   └── NestJS application source code
├── project.json
│   └── Nx project configuration
├── tsconfig.app.json
│   └── TypeScript configuration for this application
└── tsconfig.json
    └── Additional project-level TypeScript configuration
```

# 2. Understand `main.ts`

Open the file:

Bash

```
cat apps/url-service/src/main.ts
```

A typical NestJS entry point looks similar to:

TypeScript

```
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```

This file is the entry point of the NestJS application.

When you execute:

Bash

```
pnpm nx serve url-service
```

Nx eventually starts the application from this entry point.

The execution flow is:

```
pnpm nx serve url-service
        │
        ▼
Nx finds the url-service project
        │
        ▼
Nx executes its serve target
        │
        ▼
The NestJS application starts
        │
        ▼
main.ts executes
        │
        ▼
NestFactory.create(AppModule)
        │
        ▼
NestJS application is initialized
        │
        ▼
app.listen(...)
        │
        ▼
HTTP server starts
```

### Responsibility of `main.ts`

`main.ts` is responsible for bootstrapping the application.

Typical responsibilities include:

- Creating the NestJS application.
    
- Loading the root module.
    
- Registering global middleware.
    
- Registering global pipes.
    
- Registering global filters.
    
- Registering global interceptors.
    
- Configuring application-level settings.
    
- Starting the HTTP or microservice listener.
    

For example:

TypeScript

```
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```

The important point is:

> `main.ts` starts and configures the NestJS application. It is not an Nx configuration file.

# 3. Understand `app.module.ts`

Open:

Bash

```
cat apps/url-service/src/app/app.module.ts
```

A typical generated module looks similar to:

TypeScript

```
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

`AppModule` is the root module of the NestJS application.

It defines the initial dependency-injection container structure.

Conceptually:

```
AppModule
├── imports
├── controllers
└── providers
```

### `imports`

The `imports` array registers other NestJS modules.

Example:

TypeScript

```
@Module({
  imports: [UrlModule],
})
export class AppModule {}
```

This tells NestJS that `UrlModule` is part of the application module graph.

### `controllers`

The `controllers` array registers controllers belonging to the module.

Example:

TypeScript

```
@Module({
  controllers: [AppController],
})
export class AppModule {}
```

### `providers`

The `providers` array registers injectable classes such as services.

Example:

TypeScript

```
@Module({
  providers: [AppService],
})
export class AppModule {}
```

## Nx and NestJS Have Different Graphs

At this point, two different graphs exist.

### Nx project graph

This graph represents relationships between Nx projects:

```
url-service ─────▶ logger
url-service ─────▶ contracts
```

### NestJS module graph

This graph represents relationships between NestJS modules:

```
AppModule
    │
    ▼
UrlModule
    │
    ├── UrlController
    └── UrlService
```

These are not the same thing.

```
Nx project graph:
  Repository-level project dependencies

NestJS module graph:
  Runtime application module dependencies
```

A NestJS module such as `UrlModule` is not automatically an Nx library project.

# 4. Understand `app.controller.ts`

Open:

Bash

```
cat apps/url-service/src/app/app.controller.ts
```

A generated controller may look like:

TypeScript

```
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }
}
```

The controller handles incoming HTTP requests.

For example:

http

```
GET /
```

The request flow is:

```
HTTP request
    │
    ▼
AppController
    │
    ▼
getData()
    │
    ▼
AppService.getData()
    │
    ▼
HTTP response
```

The controller should generally focus on:

- Receiving requests.
    
- Reading route parameters.
    
- Reading query parameters.
    
- Reading request bodies.
    
- Calling application services.
    
- Returning responses.
    

It should not contain all business logic.

# 5. Understand `app.service.ts`

Open:

Bash

```
cat apps/url-service/src/app/app.service.ts
```

A generated service may look like:

TypeScript

```
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData() {
    return {
      message: 'Hello API',
    };
  }
}
```

The `@Injectable()` decorator makes the class available to NestJS’s dependency-injection system when it is registered as a provider.

The controller receives the service through constructor injection:

TypeScript

```
constructor(private readonly appService: AppService) {}
```

Conceptually:

```
NestJS Dependency Injection Container
              │
              ▼
        Creates AppService
              │
              ▼
        Creates AppController
              │
              ▼
   Injects AppService into controller
```

The typical responsibility separation is:

```
Controller
    → Handles HTTP-level concerns

Service
    → Handles application or business operations
```

# 6. Understand `project.json`

Now open the Nx project configuration:

Bash

```
cat apps/url-service/project.json
```

A simplified configuration may look similar to:

JSON

```
{
  "name": "url-service",
  "projectType": "application",
  "sourceRoot": "apps/url-service/src",
  "targets": {
    "build": {
      "executor": "...",
      "options": {}
    },
    "serve": {
      "executor": "...",
      "options": {}
    },
    "test": {
      "executor": "...",
      "options": {}
    },
    "lint": {
      "executor": "...",
      "options": {}
    }
  }
}
```

The actual executor names and options depend on the generated workspace.

This file is concerned with how Nx manages the application.

It defines things such as:

- The project name.
    
- The project type.
    
- The source root.
    
- Build behavior.
    
- Serve behavior.
    
- Test behavior.
    
- Lint behavior.
    
- Task options.
    
- Task dependencies.
    
- Cache-related configuration.
    

For example:

JSON

```
{
  "projectType": "application"
}
```

means Nx treats this project as an application project.

This does not mean that NestJS has been configured with an `@Module()` decorator. That is handled by NestJS source files.

# 7. Understand `tsconfig.app.json`

Open:

Bash

```
cat apps/url-service/tsconfig.app.json
```

This file configures TypeScript compilation for the application.

A simplified example may look like:

JSON

```
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "declaration": false,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["jest.config.ts", "src/**/*.spec.ts"]
}
```

The exact content may differ.

Its responsibilities commonly include:

- Extending shared TypeScript settings.
    
- Defining compiler options for the application.
    
- Selecting which TypeScript files are compiled.
    
- Excluding test files from production compilation.
    
- Defining the output directory for TypeScript compilation.
    

The relationship is:

```
tsconfig.base.json
        │
        ▼
tsconfig.app.json
        │
        ▼
TypeScript configuration for url-service
```

The workspace-level configuration provides common defaults, while the application-level configuration provides application-specific settings.

# 8. Understand `tsconfig.base.json`

Open:

Bash

```
cat tsconfig.base.json
```

This is usually the shared TypeScript configuration for the entire workspace.

It may contain:

- Common compiler options.
    
- Path aliases.
    
- Module resolution settings.
    
- Strictness settings.
    
- Shared TypeScript behavior.
    

For example, a path alias may conceptually look like:

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

Then application code can import the library using:

TypeScript

```
import { createLogger } from '@url-platform/logger';
```

instead of:

TypeScript

```
import { createLogger } from '../../../../libs/logger/src';
```

Path aliases improve readability and reduce fragile relative paths.

However, a path alias alone does not necessarily make a library an independent deployable service. It only provides a convenient way to reference code.

# 9. Complete Relationship Between the Files

The generated application can be understood as follows:

```
url-service/
│
├── project.json
│   └── Tells Nx how to build, serve, test, and lint the project
│
├── tsconfig.app.json
│   └── Tells TypeScript how to compile this application
│
└── src/
    ├── main.ts
    │   └── Starts and configures NestJS
    │
    └── app/
        ├── app.module.ts
        │   └── Root NestJS module
        │
        ├── app.controller.ts
        │   └── Handles incoming requests
        │
        └── app.service.ts
            └── Provides application logic
```

The complete execution flow is:

```
pnpm nx serve url-service
        │
        ▼
Nx reads project.json
        │
        ▼
Nx executes the configured serve target
        │
        ▼
NestJS starts from main.ts
        │
        ▼
main.ts creates AppModule
        │
        ▼
AppModule registers controllers and providers
        │
        ▼
NestJS starts the server
        │
        ▼
Requests reach AppController
        │
        ▼
AppController calls AppService
```

## Key Takeaway

The same `url-service` project contains two layers of configuration:

### Nx layer

```
project.json
nx.json
```

These manage the project and its tasks.

### NestJS layer

```
main.ts
app.module.ts
app.controller.ts
app.service.ts
```

These define and run the application.

### TypeScript layer

```
tsconfig.base.json
tsconfig.app.json
```

These control TypeScript compilation and shared compiler behavior.

The next practical concept is creating the first real URL-shortener feature inside `url-service` using a NestJS module, controller, and service.