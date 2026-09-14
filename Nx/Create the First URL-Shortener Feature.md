# Practical Step 4: Create the First URL-Shortener Feature

We will now replace the generated demo logic with the first real feature of `url-service`:

> Create a short URL from a long URL.

For now, we will not connect MongoDB, Prisma, Redis, or any external service. We will first establish the correct NestJS feature structure.

# 1. The Feature We Are Building

Our first endpoint will be:

http

```
POST /urls
```

It will receive:

JSON

```
{
  "originalUrl": "https://example.com/very-long-resource"
}
```

For now, it will return a temporary response such as:

JSON

```
{
  "originalUrl": "https://example.com/very-long-resource",
  "shortCode": "abc123",
  "shortUrl": "http://localhost:3000/abc123"
}
```

At this stage, the short URL will not be persisted in a database. We are only establishing the application structure and request flow.

# 2. Desired NestJS Structure

Inside `url-service`, we will create a feature module:

```
apps/url-service/src/
├── app/
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── app.service.ts
├── urls/
│   ├── urls.module.ts
│   ├── urls.controller.ts
│   └── urls.service.ts
└── main.ts
```

The new feature will contain:

```
UrlsModule
├── UrlsController
└── UrlsService
```

The responsibilities will be:

```
UrlsController
    → Receives HTTP requests

UrlsService
    → Performs URL-shortening logic

UrlsModule
    → Connects the controller and service
```

# 3. Generate the Feature Using Nx

From the workspace root, run:

Bash

```
pnpm nx g @nx/nest:module urls --project=url-service
```

This command means:

```
@nx/nest:module
    → Generate a NestJS module

urls
    → Name of the feature

--project=url-service
    → Add the module to the url-service application
```

Nx should generate a module similar to:

```
apps/url-service/src/app/urls/
└── urls.module.ts
```

Depending on the generator version and configuration, the generated location may vary slightly.

# 4. Generate the Controller

Run:

Bash

```
pnpm nx g @nx/nest:controller urls --project=url-service
```

This generates a controller similar to:

```
urls.controller.ts
```

A basic controller may look like:

TypeScript

```
import { Controller } from '@nestjs/common';

@Controller('urls')
export class UrlsController {}
```

The decorator:

TypeScript

```
@Controller('urls')
```

sets the route prefix for the controller.

Therefore, if we later define:

TypeScript

```
@Post()
create() {}
```

the complete route will be:

http

```
POST /urls
```

The route is formed by combining:

```
Controller prefix + method decorator path
```

In this case:

```
'urls' + ''
    ↓
'/urls'
```

# 5. Generate the Service

Run:

Bash

```
pnpm nx g @nx/nest:service urls --project=url-service
```

This generates a service similar to:

TypeScript

```
import { Injectable } from '@nestjs/common';

@Injectable()
export class UrlsService {}
```

The `@Injectable()` decorator allows NestJS to manage the service through dependency injection.

The intended relationship is:

```
UrlsController
      │
      │ constructor injection
      ▼
UrlsService
```

The controller should not implement all URL-shortening logic directly. It should delegate that responsibility to `UrlsService`.

# 6. Register the Controller and Service in the Module

Open:

Bash

```
cat apps/url-service/src/app/urls/urls.module.ts
```

Update it to:

TypeScript

```
import { Module } from '@nestjs/common';
import { UrlsController } from './urls.controller';
import { UrlsService } from './urls.service';

@Module({
  controllers: [UrlsController],
  providers: [UrlsService],
})
export class UrlsModule {}
```

This module tells NestJS:

- `UrlsController` belongs to this module.
    
- `UrlsService` is a provider in this module.
    
- The service can be injected into the controller.
    

The module graph now looks like:

```
UrlsModule
├── UrlsController
└── UrlsService
```

# 7. Import `UrlsModule` into `AppModule`

Open:

Bash

```
cat apps/url-service/src/app/app.module.ts
```

Update the module:

TypeScript

```
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UrlsModule } from './urls/urls.module';

@Module({
  imports: [UrlsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Now the NestJS module graph becomes:

```
AppModule
    │
    └── UrlsModule
          ├── UrlsController
          └── UrlsService
```

This is essential.

Creating a module file does not automatically make it part of the application. The module must be imported into a module that belongs to the application graph.

# 8. Inject `UrlsService` into the Controller

Open:

Bash

```
cat apps/url-service/src/app/urls/urls.controller.ts
```

Update it:

TypeScript

```
import { Controller, Get } from '@nestjs/common';
import { UrlsService } from './urls.service';

@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Get()
  getUrls() {
    return this.urlsService.getUrls();
  }
}
```

At this point, the controller exposes:

http

```
GET /urls
```

The request flow is:

```
GET /urls
    │
    ▼
UrlsController.getUrls()
    │
    ▼
UrlsService.getUrls()
    │
    ▼
Response
```

# 9. Add Temporary Logic to `UrlsService`

Open:

Bash

```
cat apps/url-service/src/app/urls/urls.service.ts
```

Update it:

TypeScript

```
import { Injectable } from '@nestjs/common';

@Injectable()
export class UrlsService {
  getUrls() {
    return {
      message: 'URL service is working',
    };
  }
}
```

This is temporary logic. We will replace it with actual URL creation logic later.

# 10. Start the Application

Run:

Bash

```
pnpm nx serve url-service
```

Then send a request:

Bash

```
curl http://localhost:3000/urls
```

Expected response:

JSON

```
{
  "message": "URL service is working"
}
```

The complete execution flow is:

```
HTTP GET /urls
       │
       ▼
NestJS route matching
       │
       ▼
UrlsController
       │
       ▼
getUrls()
       │
       ▼
UrlsService.getUrls()
       │
       ▼
Returned object serialized as JSON
```

# 11. What Nx Did and What NestJS Did

This step involved both Nx and NestJS, but their responsibilities were different.

## Nx responsibilities

Nx generated files and managed the project:

Bash

```
pnpm nx g @nx/nest:module urls --project=url-service
pnpm nx g @nx/nest:controller urls --project=url-service
pnpm nx g @nx/nest:service urls --project=url-service
```

Nx also runs the application:

Bash

```
pnpm nx serve url-service
```

## NestJS responsibilities

NestJS manages the runtime application:

```
AppModule
    └── UrlsModule
          ├── UrlsController
          └── UrlsService
```

NestJS handles:

- Module registration.
    
- Dependency injection.
    
- Route registration.
    
- Controller execution.
    
- Service resolution.
    
- HTTP response handling.
    

The distinction is:

```
Nx:
  Generates and executes the project.

NestJS:
  Runs the application and manages its internal architecture.
```

## Current Checkpoint

You now have a real feature inside `url-service`:

```
AppModule
    │
    └── UrlsModule
          ├── UrlsController
          │     └── GET /urls
          │
          └── UrlsService
                └── Temporary URL logic
```

The next practical concept is replacing the temporary `GET /urls` endpoint with a proper `POST /urls` endpoint that receives an `originalUrl` request body.