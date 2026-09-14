# Guards in NestJS

A guard is a class that decides whether a request is allowed to continue to a route handler.

A guard is defined by implementing the `CanActivate` interface and usually decorating the class with `@Injectable()`.

TypeScript

```
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

The essential responsibility of a guard is:

> Determine whether the current request can access the requested route.

This decision is commonly based on:

- Authentication state
    
- User roles
    
- Permissions
    
- Access-control lists
    
- Ownership rules
    
- Subscription level
    
- Other runtime authorization conditions
    

# 1. Authentication vs Authorization

Guards are mainly associated with authorization, but authorization commonly works together with authentication.

## Authentication

Authentication answers:

> Who is making the request?

For example:

- Is the JWT valid?
    
- Does the session exist?
    
- Is the access token expired?
    
- Which user does the token belong to?
    

A typical authentication process may:

1. Read a token from the request.
    
2. Verify the token.
    
3. Identify the user.
    
4. Attach the authenticated user to the request object.
    

Example:

TypeScript

```
request.user = authenticatedUser;
```

## Authorization

Authorization answers:

> Is this authenticated user allowed to perform this operation?

For example:

- Can this user access the admin dashboard?
    
- Can this user delete this resource?
    
- Does this user have the `admin` role?
    
- Does this user own the requested URL?
    
- Does this user have the required permission?
    

The distinction is:

```
Authentication
    └── Establishes identity

Authorization
    └── Determines access
```

A common request flow is:

```
Incoming request
       │
       ▼
Authenticate the requester
       │
       ▼
Identify the user
       │
       ▼
Authorize the requested operation
       │
       ▼
Execute the route handler
```

Authentication and authorization are related, but they are not the same responsibility.

# 2. Why Guards Exist

In a traditional Express application, authentication and authorization logic is often placed in middleware.

For example:

TypeScript

```
app.use(authMiddleware);
```

The middleware might:

- Read the authorization header.
    
- Verify a token.
    
- Attach a user to `request`.
    
- Call `next()`.
    

This is suitable for operations that are not strongly connected to a particular route.

For example:

```
Every incoming request
        │
        ▼
Verify authentication token
        │
        ▼
Attach user to request
        │
        ▼
next()
```

However, middleware has an important limitation:

> Middleware does not naturally know which controller handler will execute after `next()` is called.

It operates at the request-processing level and is generally unaware of the NestJS route handler's metadata.

# 3. Middleware Is Context-Blind

Consider two routes:

TypeScript

```
@Get('profile')
getProfile() {
  // ...
}
```

TypeScript

```
@Delete('users/:id')
deleteUser() {
  // ...
}
```

Suppose middleware executes before both routes.

At the middleware level, it can inspect the request:

TypeScript

```
req.method;
req.url;
req.headers;
```

But it does not naturally have access to the NestJS controller metadata describing:

- Which controller class will handle the request
    
- Which method will execute
    
- Which roles are required by that method
    
- Which custom decorators are attached to the handler
    
- Which permissions are associated with the route
    

The middleware generally sees:

```
Request
   │
   ▼
Middleware
   │
   ▼
next()
```

It does not operate with the same NestJS execution context that is available to guards.

This becomes a problem when authorization depends on route-specific metadata.

For example:

TypeScript

```
@Roles('admin')
@Delete(':id')
deleteUser() {
  // ...
}
```

The authorization logic needs to know that the `deleteUser()` handler requires the `admin` role.

A guard can access this handler context. Ordinary middleware cannot naturally do so.

# 4. Guards Have Access to `ExecutionContext`

A guard implements:

TypeScript

```
CanActivate
```

The central method is:

TypeScript

```
canActivate(context: ExecutionContext)
```

Example:

TypeScript

```
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

The `ExecutionContext` provides information about the current execution point in NestJS.

It allows the guard to determine:

- Which type of request is being processed
    
- Which controller class is involved
    
- Which handler method is about to execute
    
- Which request and response objects are available
    
- Which metadata is attached to the handler or controller
    

The important distinction is:

```
Middleware
    └── Primarily operates on the request/response flow

Guard
    └── Operates with knowledge of the NestJS execution context
```

This makes guards suitable for route-specific authorization.

# 5. The `CanActivate` Interface

The `CanActivate` interface defines the guard contract.

Conceptually:

TypeScript

```
interface CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean>;
}
```

A guard's `canActivate()` method can return:

- `true`
    
- `false`
    
- `Promise<boolean>`
    
- `Observable<boolean>`
    

The exact implementation depends on whether the authorization decision is synchronous or asynchronous.

## Synchronous guard

TypeScript

```
@Injectable()
export class SimpleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

The decision is immediately available.

## Asynchronous guard

TypeScript

```
@Injectable()
export class AsyncGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const hasPermission = await this.checkPermission();

    return hasPermission;
  }

  private async checkPermission(): Promise<boolean> {
    return true;
  }
}
```

This is useful when the guard must:

- Query a database
    
- Check Redis
    
- Verify a token asynchronously
    
- Call an external authorization service
    
- Retrieve permissions from a remote service
    

## Observable-based guard

NestJS also supports an Observable result:

TypeScript

```
@Injectable()
export class ObservableGuard implements CanActivate {
  canActivate(context: ExecutionContext): Observable<boolean> {
    return of(true);
  }
}
```

The guard's result must ultimately resolve to an authorization decision.

# 6. Meaning of the Return Value

The return value determines whether NestJS should continue processing the request.

```
canActivate()
      │
      ├── true
      │     │
      │     ▼
      │  Continue request pipeline
      │     │
      │     ▼
      │  Execute later stages
      │     │
      │     ▼
      │  Controller handler
      │
      └── false
            │
            ▼
       Access denied
```

A guard returning `true` allows the request to proceed.

A guard returning `false` denies access.

In NestJS, a guard denial generally results in a `ForbiddenException`, producing an HTTP `403 Forbidden` response unless custom behavior changes the result.

A guard can also explicitly throw another exception, such as:

TypeScript

```
throw new UnauthorizedException();
```

This allows the guard to distinguish between different situations:

- `401 Unauthorized`: authentication is missing or invalid
    
- `403 Forbidden`: the requester is authenticated but lacks permission
    

# 7. Guards in the Request Lifecycle

The documentation highlights the following ordering:

> Guards execute after all middleware, but before interceptors and pipes.

The relevant simplified lifecycle is:

```
Incoming HTTP request
          │
          ▼
Middleware
          │
          ▼
Guards
          │
          ▼
Interceptors
          │
          ▼
Pipes
          │
          ▼
Controller handler
          │
          ▼
Service/business logic
```

A more detailed conceptual flow is:

```
HTTP request
    │
    ▼
Middleware
    │
    ▼
Route resolution / Nest execution context
    │
    ▼
Guard.canActivate()
    │
    ├── false or exception
    │       │
    │       ▼
    │   Request denied
    │
    └── true
            │
            ▼
       Interceptors
            │
            ▼
       Pipes
            │
            ▼
       Controller method
```

The most important consequence is:

> If a guard denies the request, later stages such as interceptors, pipes, and the controller handler are not executed for that request.

# 8. Why Guards Run Before Pipes

Suppose a route requires authentication:

TypeScript

```
@Get('profile')
getProfile(@Query('format', ParseIntPipe) format: number) {
  // ...
}
```

If the requester is not authorized, there is no reason to perform the route's later argument-processing work.

The guard can reject the request before:

- Controller argument transformation
    
- DTO validation
    
- Service execution
    
- Controller business logic
    

Conceptually:

```
Request
   │
   ▼
Authentication/authorization guard
   │
   ├── Denied → Stop
   │
   └── Allowed
         │
         ▼
   Parse and validate arguments
         │
         ▼
   Execute controller
```

This ordering makes guards suitable for access decisions that should happen before handler execution.

# 9. Guards and Declarative Authorization

A guard can be attached declaratively to a route using decorators.

For example:

TypeScript

```
@UseGuards(AuthGuard)
@Get('profile')
getProfile() {
  return {
    message: 'Private profile',
  };
}
```

The authorization behavior is declared beside the route definition.

The controller method does not need to contain repetitive authorization logic:

TypeScript

```
@Get('profile')
getProfile(request: Request) {
  if (!request.user) {
    throw new UnauthorizedException();
  }

  // ...
}
```

Instead, the guard handles the access decision:

TypeScript

```
@UseGuards(AuthGuard)
@Get('profile')
getProfile() {
  // The guard runs before this method.
}
```

This improves separation of responsibilities:

|  
Component

|

Responsibility

|  
| --- | --- |  
|

Middleware

|

Request-level processing, such as token extraction

|  
|

Guard

|

Decide whether the current execution is allowed

|  
|

Pipe

|

Transform or validate controller arguments

|  
|

Interceptor

|

Wrap or extend handler execution

|  
|

Controller

|

Coordinate the requested operation

|  
|

Service

|

Execute business logic

|

# 10. Example: A Basic Authentication Guard

TypeScript

```
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    return true;
  }
}
```

The guard performs the following operations:

TypeScript

```
const request = context.switchToHttp().getRequest<Request>();
```

This obtains the HTTP request from the NestJS execution context.

Then:

TypeScript

```
const user = request.user;
```

The guard expects an earlier authentication process to have attached the authenticated user to the request.

Finally:

TypeScript

```
if (!user) {
  throw new UnauthorizedException('Authentication required');
}
```

If no user exists, the request is rejected.

Otherwise:

TypeScript

```
return true;
```

allows the request to continue.

This example assumes that authentication middleware or another earlier component has already populated `request.user`.

# 11. Important Distinction: Guards Do Not Automatically Authenticate Users

A guard is not automatically an authentication mechanism.

A guard can perform authentication itself, but it does not happen merely because the class implements `CanActivate`.

For example, this guard:

TypeScript

```
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

does not verify a token, identify a user, or check permissions. It simply allows every request.

The guard's behavior is entirely determined by its implementation.

A real authentication-and-authorization architecture may look like:

```
Request
   │
   ▼
Authentication middleware or authentication guard
   │
   ▼
request.user populated
   │
   ▼
Authorization guard
   │
   ▼
Check roles/permissions
   │
   ▼
Controller handler
```

Authentication and authorization can be implemented in different components, depending on the application design.

# 12. Core Concept

A guard is a NestJS execution-context-aware decision point.

Its responsibility can be summarized as:

```
Receive execution context
          │
          ▼
Inspect request, user, and route metadata
          │
          ▼
Evaluate access conditions
          │
          ├── Allow → return true
          │
          └── Deny → return false or throw an exception
```

The defining properties of guards are:

- They implement `CanActivate`.
    
- They usually use `@Injectable()`.
    
- They execute after middleware.
    
- They execute before interceptors and pipes.
    
- They can access `ExecutionContext`.
    
- They decide whether the handler may execute.
    
- They are especially useful for authorization.
    
- They can use route and controller metadata.
    
- They support synchronous and asynchronous decisions.
    

The key distinction from middleware is:

> Middleware processes requests without naturally knowing the NestJS handler context, while guards make access decisions with knowledge of the execution context and the handler that is about to run.