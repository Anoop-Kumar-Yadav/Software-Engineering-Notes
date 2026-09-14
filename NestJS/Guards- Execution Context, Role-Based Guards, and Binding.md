# Guards: Execution Context, Role-Based Guards, and Binding

After understanding the basic responsibility of a guard—deciding whether a request may proceed—we now need to understand:

1. How a guard knows which controller and handler are being executed
    
2. How to create a role-based guard
    
3. How to bind guards at different scopes
    
4. How global guards participate in dependency injection
    

## 1. Execution Context

A guard’s `canActivate()` method receives an instance of `ExecutionContext`:

TypeScript

```
import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    return validateRequest(request);
  }
}
```

The important part is:

TypeScript

```
canActivate(context: ExecutionContext)
```

The `context` object contains information about the current request execution.

It allows the guard to determine:

- Which transport is being used
    
- Which controller is involved
    
- Which handler method is about to execute
    
- Which arguments are being passed to the handler
    
- What class and method metadata are attached to the route
    

This is important because authorization decisions are often dependent on the specific route being accessed.

For example:

TypeScript

```
@Get('profile')
getProfile() {
  // Any authenticated user may access this
}

@Delete('users/:id')
deleteUser() {
  // Only administrators may access this
}
```

A generic authentication middleware may verify that a token exists, but it does not naturally know the complete context of the handler that will execute.

A guard, however, receives `ExecutionContext`, which provides that information.

## 2. `ExecutionContext` Inherits from `ArgumentsHost`

Conceptually, the relationship is:

```
ArgumentsHost
      ▲
      │ extends
      │
ExecutionContext
```

`ArgumentsHost` provides access to the arguments associated with the current execution environment.

For HTTP, it can be used to retrieve:

TypeScript

```
const request = context.switchToHttp().getRequest();
const response = context.switchToHttp().getResponse();
```

For example:

TypeScript

```
const httpContext = context.switchToHttp();

const request = httpContext.getRequest();
const response = httpContext.getResponse();
```

The same general mechanism is used in exception filters.

### `ArgumentsHost` capabilities

`ArgumentsHost` provides methods such as:

TypeScript

```
switchToHttp()
switchToRpc()
switchToWs()
getArgs()
getArgByIndex()
getType()
```

These methods allow NestJS components to work with different execution environments.

For example:

```
HTTP request       → HTTP execution context
Microservice call  → RPC execution context
WebSocket event    → WebSocket execution context
```

A guard can therefore be written specifically for HTTP:

TypeScript

```
const request = context.switchToHttp().getRequest();
```

Or it can inspect the transport type:

TypeScript

```
canActivate(context: ExecutionContext): boolean {
  const type = context.getType();

  if (type === 'http') {
    const request = context.switchToHttp().getRequest();

    return validateHttpRequest(request);
  }

  if (type === 'rpc') {
    return validateRpcRequest(context);
  }

  if (type === 'ws') {
    return validateWebSocketRequest(context);
  }

  return false;
}
```

The exact implementation depends on the application and transport being used.

## 3. Additional Information Provided by `ExecutionContext`

`ExecutionContext` extends `ArgumentsHost` and adds methods that describe the NestJS handler currently being executed.

The important methods are:

TypeScript

```
getClass()
getHandler()
```

### `getClass()`

Returns the controller class associated with the current handler.

Example:

TypeScript

```
@Controller('cats')
export class CatsController {
  @Get()
  findAll() {
    return [];
  }
}
```

Inside a guard:

TypeScript

```
const controller = context.getClass();
```

The result refers to:

TypeScript

```
CatsController
```

Conceptually:

```
ExecutionContext
      │
      └── getClass()
              │
              └── CatsController
```

### `getHandler()`

Returns the handler function that is about to execute.

For example:

TypeScript

```
@Get()
findAll() {
  return [];
}
```

Inside a guard:

TypeScript

```
const handler = context.getHandler();
```

The result refers to the `findAll` method.

Conceptually:

```
ExecutionContext
      │
      └── getHandler()
              │
              └── findAll()
```

These methods are especially useful when working with metadata.

For example, a route may declare required roles:

TypeScript

```
@Roles('admin')
@Delete(':id')
removeUser() {
  // ...
}
```

A guard can retrieve metadata associated with:

- The controller class
    
- The specific handler method
    

This allows the same guard to make different authorization decisions for different routes.

## 4. Why `ExecutionContext` Matters for Authorization

Consider these routes:

TypeScript

```
@Controller('users')
export class UsersController {
  @Get()
  getUsers() {
    // Authenticated users may access this
  }

  @Delete(':id')
  deleteUser() {
    // Only administrators may access this
  }
}
```

A guard attached to the entire controller needs to distinguish between:

```
GET /users
DELETE /users/:id
```

The guard can use `ExecutionContext` to identify the current handler:

TypeScript

```
canActivate(context: ExecutionContext): boolean {
  const handler = context.getHandler();
  const controller = context.getClass();

  // Use handler/controller information to determine
  // what authorization rules apply.
}
```

The execution context therefore makes guards route-aware.

The general relationship is:

```
Incoming request
      ↓
Route matched
      ↓
Nest identifies controller and handler
      ↓
Guard receives ExecutionContext
      ↓
Guard examines request and route metadata
      ↓
Authorization decision
      ↓
Controller method executes if allowed
```

# 5. Role-Based Authorization

The next example introduces a `RolesGuard`.

Its purpose is to allow or deny access based on the role associated with the authenticated user.

Typical roles might include:

```
user
admin
moderator
manager
support
```

For example:

```
GET /profile
  → user, admin, moderator

DELETE /users/:id
  → admin only
```

The guard needs to answer a question such as:

> Does the authenticated user have the role required by this route?

A role-based guard commonly depends on two pieces of information:

1. The authenticated user
    
2. The roles required by the current route
    

The authenticated user may be attached to the request by authentication middleware or another guard:

TypeScript

```
request.user = {
  id: 'user-123',
  roles: ['user', 'admin'],
};
```

The required roles may be declared as route metadata:

TypeScript

```
@Roles('admin')
```

The guard can then compare the two.

## 6. Basic `RolesGuard` Template

The documentation begins with a basic guard:

TypeScript

```
import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';

import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
```

At this stage, the guard allows every request:

TypeScript

```
return true;
```

Therefore, it does not yet perform role checking.

The purpose of this template is to establish the structure that will later be extended with:

- Request extraction
    
- User extraction
    
- Route metadata extraction
    
- Role comparison
    
- Authorization failure handling
    

## 7. Understanding the Return Type

The method has this return type:

TypeScript

```
boolean | Promise<boolean> | Observable<boolean>
```

This means the guard may make its decision in three ways.

### Synchronous decision

TypeScript

```
canActivate(context: ExecutionContext): boolean {
  return true;
}
```

Useful when all required information is already available:

TypeScript

```
return request.user?.roles.includes('admin');
```

### Asynchronous decision with `Promise`

TypeScript

```
async canActivate(
  context: ExecutionContext,
): Promise<boolean> {
  const user = await this.userService.findById('user-123');

  return user.roles.includes('admin');
}
```

Useful when authorization requires:

- Database access
    
- External permission service
    
- Remote policy evaluation
    
- Asynchronous token verification
    

### Asynchronous decision with `Observable`

TypeScript

```
canActivate(
  context: ExecutionContext,
): Observable<boolean> {
  return this.permissionService
    .checkPermission()
    .pipe();
}
```

NestJS supports the returned `Observable<boolean>` and resolves the result as part of guard execution.

The essential rule is:

```
true              → allow request
false             → deny request
Promise<true>     → allow after async resolution
Observable<true>  → allow after observable resolution
```

# 8. Binding Guards

A guard does not execute merely because its class exists.

It must be bound to an execution scope.

NestJS supports three major scopes:

```
1. Controller scope
2. Method scope
3. Global scope
```

The `@UseGuards()` decorator is used for controller-scoped and method-scoped guards.

It is imported from:

TypeScript

```
import { UseGuards } from '@nestjs/common';
```

## 9. Controller-Scoped Guard

A controller-scoped guard applies to every handler declared inside that controller.

TypeScript

```
import {
  Controller,
  UseGuards,
} from '@nestjs/common';

@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {
  // Every handler in this controller is protected
}
```

For example:

TypeScript

```
@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return {};
  }

  @Delete(':id')
  remove() {
    return {};
  }
}
```

The guard applies to:

```
GET    /cats
POST   /cats
DELETE /cats/:id
```

Conceptually:

```
CatsController
      │
      ├── findAll()
      │      └── RolesGuard
      │
      ├── create()
      │      └── RolesGuard
      │
      └── remove()
             └── RolesGuard
```

This is useful when all operations in a controller require a common authorization boundary.

For example:

```
AdminController
  → all handlers require administrator access
```

## 10. Method-Scoped Guard

A method-scoped guard applies only to one handler.

TypeScript

```
@Controller('cats')
export class CatsController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  @UseGuards(RolesGuard)
  create() {
    return {};
  }
}
```

Here:

```
GET  /cats
  → RolesGuard is not applied

POST /cats
  → RolesGuard is applied
```

Conceptually:

```
CatsController
      │
      ├── findAll()
      │      └── no RolesGuard
      │
      └── create()
             └── RolesGuard
```

Method scope is useful when only certain operations require additional authorization.

For example:

```
GET /users/profile
  → authenticated user

DELETE /users/:id
  → administrator only
```

## 11. Multiple Guards

`@UseGuards()` can receive multiple guards:

TypeScript

```
@Controller('cats')
@UseGuards(AuthGuard, RolesGuard)
export class CatsController {
  // ...
}
```

The guards are applied together.

A common conceptual arrangement is:

```
AuthGuard
    ↓
RolesGuard
    ↓
Controller handler
```

The first guard may establish or verify identity, while the second checks permissions.

For example:

```
AuthGuard
  → Is the token valid?
  → Who is the user?
  → Attach request.user

RolesGuard
  → What role does the route require?
  → Does request.user have that role?
```

If an earlier guard denies the request, later processing does not continue to the controller handler.

## 12. Passing a Guard Class Versus a Guard Instance

There are two ways to bind a guard.

### Passing the class

TypeScript

```
@UseGuards(RolesGuard)
```

Here, NestJS receives the class itself.

NestJS is responsible for:

- Instantiating the guard
    
- Resolving its dependencies
    
- Managing its lifecycle
    
- Integrating it into the application container
    

This is generally preferred when the guard has dependencies.

For example:

TypeScript

```
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // ...
    return true;
  }
}
```

Binding it by class allows NestJS to resolve:

TypeScript

```
Reflector
PermissionService
```

through dependency injection.

### Passing an instance

TypeScript

```
@UseGuards(new RolesGuard())
```

Here, the instance is manually created.

NestJS does not construct that instance through the normal dependency-injection process.

This is appropriate only when:

- The guard has no dependencies
    
- You intentionally want to configure an instance manually
    
- You understand that NestJS cannot automatically inject dependencies into that manually created instance
    

For example:

TypeScript

```
@Controller('cats')
@UseGuards(new RolesGuard())
export class CatsController {}
```

The guard is attached to every handler in the controller.

### Comparison

|  
Binding

|

Who creates the guard?

|

Dependency injection

|  
| --- | --- | --- |  
|

`@UseGuards(RolesGuard)`

|

NestJS

|

Supported

|  
|

`@UseGuards(new RolesGuard())`

|

Your code

|

Not automatically performed

|

The same distinction applies to pipes and exception filters.

# 13. Global Guards

A global guard applies to every controller and every route handler in the application.

It is registered through the Nest application instance:

TypeScript

```
const app = await NestFactory.create(AppModule);

app.useGlobalGuards(new RolesGuard());
```

Conceptually:

```
Application
    │
    ├── CatsController
    │      ├── GET /cats
    │      └── POST /cats
    │
    ├── UsersController
    │      ├── GET /users
    │      └── DELETE /users/:id
    │
    └── OrdersController
           ├── GET /orders
           └── POST /orders
```

The global guard applies to all of them:

```
Global RolesGuard
       │
       ├── CatsController
       ├── UsersController
       └── OrdersController
```

This is useful for application-wide rules such as:

- Authentication
    
- Global authorization
    
- Maintenance-mode checks
    
- Tenant validation
    
- Global request access policies
    

However, a global guard should be designed carefully because it affects every route.

## 14. Global Guard Registration Outside a Module

This registration:

TypeScript

```
const app = await NestFactory.create(AppModule);

app.useGlobalGuards(new RolesGuard());
```

takes place outside the context of a NestJS module.

Therefore, the manually created guard cannot automatically receive dependencies from the NestJS dependency-injection container.

For example:

TypeScript

```
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // ...
    return true;
  }
}
```

This registration does not automatically inject `UserService`:

TypeScript

```
app.useGlobalGuards(new RolesGuard());
```

The reason is that the instance was created manually:

TypeScript

```
new RolesGuard()
```

NestJS did not construct it through a module provider definition.

# 15. Dependency-Injectable Global Guards with `APP_GUARD`

To register a global guard while preserving dependency injection, use the `APP_GUARD` token.

TypeScript

```
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

Here:

TypeScript

```
provide: APP_GUARD
```

tells NestJS that the provider should be treated as a global guard.

TypeScript

```
useClass: RolesGuard
```

tells NestJS which guard class to instantiate.

NestJS can now resolve dependencies