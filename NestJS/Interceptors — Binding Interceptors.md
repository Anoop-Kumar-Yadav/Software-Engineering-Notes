# Interceptors — Binding Interceptors

Once an interceptor has been created, it must be attached to the application so that NestJS knows where and when to execute it.

NestJS provides the `@UseInterceptors()` decorator for this purpose.

Interceptors can be bound at three scopes:

1. Controller scope
    
2. Method scope
    
3. Global scope
    

The scope determines which route handlers will execute the interceptor.

## 1. Controller-scoped Interceptor

A controller-scoped interceptor is applied to every route handler inside a controller.

TypeScript

```
import {
  Controller,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common';

import { LoggingInterceptor } from './logging.interceptor';

@Controller('cats')
@UseInterceptors(LoggingInterceptor)
export class CatsController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return {
      message: 'Cat created',
    };
  }
}
```

Here, the interceptor is attached to the controller:

TypeScript

```
@UseInterceptors(LoggingInterceptor)
```

Therefore, it applies to all handlers declared inside `CatsController`.

The following requests use `LoggingInterceptor`:

```
GET  /cats
POST /cats
```

Conceptually:

```
CatsController
      │
      ├── findAll()  ──► LoggingInterceptor
      │
      └── create()   ──► LoggingInterceptor
```

### Why is this useful?

Controller scope is useful when several handlers in the same controller need the same behavior.

For example, every route in `CatsController` might require:

- Request logging
    
- Response formatting
    
- Performance measurement
    
- Audit logging
    
- A common response transformation
    

Instead of attaching the interceptor to every method separately, it can be attached once to the controller.

## 2. Method-scoped Interceptor

A method-scoped interceptor is applied to only one route handler.

TypeScript

```
import {
  Controller,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common';

import { LoggingInterceptor } from './logging.interceptor';

@Controller('cats')
export class CatsController {
  @Get()
  @UseInterceptors(LoggingInterceptor)
  findAll() {
    return [];
  }

  @Post()
  create() {
    return {
      message: 'Cat created',
    };
  }
}
```

Here, the decorator is placed directly above `findAll()`:

TypeScript

```
@UseInterceptors(LoggingInterceptor)
findAll() {
  return [];
}
```

Therefore:

```
GET /cats
   │
   ▼
LoggingInterceptor
   │
   ▼
findAll()
```

But:

```
POST /cats
   │
   ▼
create()
```

does not use this interceptor through the shown binding.

### When should method scope be used?

Use method scope when the behavior is needed only for a particular operation.

For example:

- Log only sensitive operations.
    
- Measure only a slow or expensive endpoint.
    
- Apply caching only to `GET /cats`.
    
- Transform the response of only one route.
    
- Add special audit behavior to `POST /cats`.
    

# 3. Passing the Interceptor Class

The usual form is:

TypeScript

```
@UseInterceptors(LoggingInterceptor)
```

Here, the class itself is passed to NestJS, not an instance.

NestJS is responsible for:

- Creating the interceptor instance.
    
- Managing its lifecycle.
    
- Resolving constructor dependencies.
    
- Integrating it into the execution pipeline.
    

For example:

TypeScript

```
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ) {
    this.logger.log('Request started');

    return next.handle();
  }
}
```

If `LoggingInterceptor` is passed as a class:

TypeScript

```
@UseInterceptors(LoggingInterceptor)
```

NestJS can resolve `LoggerService` through dependency injection, assuming it is registered in the relevant module.

This is generally the preferred approach for interceptors that have dependencies.

# 4. Passing an Interceptor Instance

NestJS also allows an already-created instance:

TypeScript

```
@UseInterceptors(new LoggingInterceptor())
```

For example:

TypeScript

```
@Controller('cats')
@UseInterceptors(new LoggingInterceptor())
export class CatsController {}
```

This attaches the manually created interceptor to every handler in `CatsController`.

However, the instance is created by your code:

TypeScript

```
new LoggingInterceptor()
```

Therefore, NestJS does not create that particular instance through its dependency-injection container.

This matters when the interceptor has constructor dependencies.

For example:

TypeScript

```
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle();
  }
}
```

This will not work automatically:

TypeScript

```
@UseInterceptors(new LoggingInterceptor())
```

because `LoggerService` has not been supplied to the constructor.

You would need to manually provide it:

TypeScript

```
@UseInterceptors(new LoggingInterceptor(loggerService))
```

But doing this bypasses normal NestJS-managed construction.

Therefore:

```
Use class:
@UseInterceptors(LoggingInterceptor)
        │
        ▼
NestJS creates and manages the instance

Use instance:
@UseInterceptors(new LoggingInterceptor())
        │
        ▼
Your code creates the instance
```

# 5. Global Interceptor

A global interceptor applies to every controller and every route handler in the application.

It can be registered using the `useGlobalInterceptors()` method of the Nest application instance.

TypeScript

```
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
  );

  await app.listen(3000);
}

bootstrap();
```

The global interceptor applies across the application:

```
Application
    │
    ├── CatsController
    │     ├── GET /cats
    │     └── POST /cats
    │
    ├── UsersController
    │     ├── GET /users
    │     └── POST /users
    │
    └── OrdersController
          ├── GET /orders
          └── POST /orders
```

If `LoggingInterceptor` is registered globally, it can execute for all these routes.

## Important DI limitation

This registration:

TypeScript

```
app.useGlobalInterceptors(
  new LoggingInterceptor(),
);
```

creates the interceptor outside the context of a NestJS module.

Consequently, the manually created global interceptor cannot automatically receive dependencies from NestJS dependency injection.

For example:

TypeScript

```
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    this.logger.log('Request started');

    return next.handle();
  }
}
```

The following registration does not allow NestJS to resolve `LoggerService` automatically:

TypeScript

```
app.useGlobalInterceptors(
  new LoggingInterceptor(),
);
```

The reason is that the instance was manually constructed before NestJS could resolve its dependencies.

# 6. Global Interceptor with Dependency Injection

To register a global interceptor while still allowing NestJS to manage its dependencies, use the `APP_INTERCEPTOR` provider token.

TypeScript

```
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { LoggingInterceptor } from './logging.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

This provider configuration has two important parts:

TypeScript

```
provide: APP_INTERCEPTOR
```

This tells NestJS that the provider should be treated as a global interceptor.

TypeScript

```
useClass: LoggingInterceptor
```

This tells NestJS which interceptor class should be instantiated and registered.

The interceptor can now use constructor injection:

TypeScript

```
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ) {
    this.logger.log('Request started');

    return next.handle();
  }
}
```

NestJS creates the interceptor and resolves `LoggerService` from the dependency-injection container.

## Why is it still global?

Although the provider is declared inside a module:

TypeScript

```
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

the interceptor is not limited to `AppModule`.

`APP_INTERCEPTOR` has special meaning in NestJS:

```
APP_INTERCEPTOR
      │
      ▼
Register this interceptor globally
      │
      ▼
Apply it to all controllers and route handlers
```

The module only provides the location where the interceptor is registered and where its dependencies can be resolved. It does not define the interceptor’s execution scope.

# 7. Recommended Registration Location

NestJS recommends placing the `APP_INTERCEPTOR` provider in the module where the interceptor is defined.

For example:

```
src/
├── common/
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── logging.module.ts
│   │
│   └── ...
│
└── app.module.ts
```

The interceptor can be registered in the module responsible for it:

TypeScript

```
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { LoggingInterceptor } from './logging.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class LoggingModule {}
```

The interceptor remains global even though it is registered in `LoggingModule`.

This keeps the configuration close to the implementation and makes the ownership of the interceptor clearer.

# Scope Comparison

|  
Scope

|

Registration

|

Applies to

|  
| --- | --- | --- |  
|

Controller

|

`@UseInterceptors(LoggingInterceptor)` above the controller

|

Every handler in that controller

|  
|

Method

|

`@UseInterceptors(LoggingInterceptor)` above a method

|

Only that handler

|  
|

Global, without Nest DI

|

`app.useGlobalInterceptors(new LoggingInterceptor())`

|

Every handler in the application

|  
|

Global, with Nest DI

|

Provider using `APP_INTERCEPTOR`

|

Every handler in the application

|

## Final distinction

There are two separate decisions:

### Execution scope

This determines where the interceptor applies:

```
Method → one handler
Controller → all handlers in one controller
Global → all handlers in the application
```

### Construction mechanism

This determines who creates the interceptor:

```
Class passed to NestJS → NestJS creates it and can inject dependencies
Instance created with new → your code creates it
APP_INTERCEPTOR → global scope with NestJS dependency injection
```

The most important patterns are:

TypeScript

```
@UseInterceptors(LoggingInterceptor)
```

for controller or method binding, and:

TypeScript

```
{
  provide: APP_INTERCEPTOR,
  useClass: LoggingInterceptor,
}
```

for a dependency-injected global interceptor.