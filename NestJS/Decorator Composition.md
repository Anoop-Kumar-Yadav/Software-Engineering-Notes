# Decorator Composition

Decorator composition means combining multiple decorators into one reusable custom decorator.

Instead of repeatedly applying several decorators to every route, we define them once and expose them through a single decorator.

NestJS provides the helper:

TypeScript

```
applyDecorators()
```

from `@nestjs/common`.

## 1. The Problem: Repeating Multiple Decorators

Suppose every protected route in an application needs:

1. Role metadata.
    
2. Authentication guard.
    
3. Role authorization guard.
    
4. Swagger authentication documentation.
    
5. Swagger unauthorized-response documentation.
    

Without composition, a controller method might look like this:

TypeScript

```
@Get('users')
@SetMetadata('roles', ['admin'])
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
})
findAllUsers() {
  // ...
}
```

This works, but the same group of decorators may need to be repeated on many routes.

For example:

TypeScript

```
@Get('users')
@SetMetadata('roles', ['admin'])
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
})
findAllUsers() {}
```

TypeScript

```
@Post('users')
@SetMetadata('roles', ['admin'])
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
})
createUser() {}
```

The repeated declarations create several problems:

- More code in every controller.
    
- Greater chance of forgetting one decorator.
    
- Inconsistent security configuration.
    
- Repeated documentation configuration.
    
- Harder maintenance when the authentication policy changes.
    

Decorator composition solves this by grouping the decorators into one abstraction.

# 2. Creating a Composite `@Auth()` Decorator

TypeScript

```
import {
  applyDecorators,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
}
```

The custom decorator is used like this:

TypeScript

```
@Get('users')
@Auth('admin')
findAllUsers() {
  // ...
}
```

This single declaration expands conceptually into:

TypeScript

```
@Get('users')
@SetMetadata('roles', ['admin'])
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
})
findAllUsers() {}
```

The important point is that `@Auth('admin')` is not itself performing authentication. It is a reusable declaration that applies several existing decorators together.

# 3. Understanding `applyDecorators()`

The function:

TypeScript

```
applyDecorators(...)
```

accepts multiple decorators and returns a new decorator that applies them together.

Conceptually:

TypeScript

```
applyDecorators(
  DecoratorA(),
  DecoratorB(),
  DecoratorC(),
)
```

creates one combined decorator equivalent to applying:

TypeScript

```
@DecoratorA()
@DecoratorB()
@DecoratorC()
```

The composite decorator therefore acts as a convenient wrapper around multiple decorator declarations.

It does not merge the internal implementation of the decorators into one new system. Instead, it applies the supplied decorators as a group.

# 4. Understanding the `...roles` Parameter

The custom decorator is defined as:

TypeScript

```
export function Auth(...roles: Role[]) {
  // ...
}
```

The rest parameter:

TypeScript

```
...roles
```

allows the decorator to receive any number of role arguments.

For example:

TypeScript

```
@Auth('admin')
```

produces:

TypeScript

```
roles = ['admin'];
```

Multiple roles can also be supplied:

TypeScript

```
@Auth('admin', 'manager')
```

which produces:

TypeScript

```
roles = ['admin', 'manager'];
```

Then this line:

TypeScript

```
SetMetadata('roles', roles)
```

attaches the supplied roles as metadata to the decorated route.

Conceptually:

```
@Auth('admin', 'manager')
          ↓
roles = ['admin', 'manager']
          ↓
SetMetadata('roles', ['admin', 'manager'])
          ↓
RolesGuard can later read the required roles
```

The `Role` type is application-specific. For example, it might be defined as:

TypeScript

```
export type Role = 'admin' | 'manager' | 'user';
```

The example assumes that `AuthGuard`, `RolesGuard`, and the Swagger decorators are already defined or imported.

# 5. What Each Composed Decorator Contributes

The following line:

TypeScript

```
return applyDecorators(
  SetMetadata('roles', roles),
  UseGuards(AuthGuard, RolesGuard),
  ApiBearerAuth(),
  ApiUnauthorizedResponse({
    description: 'Unauthorized',
  }),
);
```

combines four different concerns.

## `SetMetadata('roles', roles)`

TypeScript

```
SetMetadata('roles', roles)
```

stores the required roles as metadata.

For:

TypeScript

```
@Auth('admin')
```

the metadata is conceptually:

TypeScript

```
{
  roles: ['admin'],
}
```

The `RolesGuard` can later read this metadata and determine which roles are required by the route.

## `UseGuards(AuthGuard, RolesGuard)`

TypeScript

```
UseGuards(AuthGuard, RolesGuard)
```

associates two guards with the route:

- `AuthGuard` checks or establishes authentication.
    
- `RolesGuard` checks whether the authenticated user has an appropriate role.
    

The exact responsibilities depend on the application’s implementation.

The composite decorator ensures that both guards are attached whenever `@Auth()` is used.

## `ApiBearerAuth()`

TypeScript

```
ApiBearerAuth()
```

adds Swagger/OpenAPI metadata indicating that the endpoint uses bearer-token authentication.

This affects generated API documentation. It does not itself validate the token at runtime.

## `ApiUnauthorizedResponse()`

TypeScript

```
ApiUnauthorizedResponse({
  description: 'Unauthorized',
})
```

documents an unauthorized response in the generated Swagger/OpenAPI specification.

It describes the API contract for documentation purposes. It does not automatically throw an exception.

# 6. Using the Composite Decorator

Once the composite decorator has been created, a controller can use:

TypeScript

```
@Get('users')
@Auth('admin')
findAllUsers() {
  return this.usersService.findAll();
}
```

The route declaration now communicates its security requirement directly:

```
GET /users
requires authentication
requires the admin role
uses bearer-token authentication
documents unauthorized responses
```

A second route can use a different role:

TypeScript

```
@Delete('users/:id')
@Auth('admin', 'manager')
deleteUser(@Param('id') id: string) {
  return this.usersService.delete(id);
}
```

Here, the metadata attached to the route becomes conceptually:

TypeScript

```
{
  roles: ['admin', 'manager'],
}
```

The actual meaning of multiple roles—whether any one role is sufficient or all roles are required—is determined by the implementation of `RolesGuard`.

Decorator composition itself does not define that authorization policy.

# 7. Architectural Value

Decorator composition is particularly useful when several decorators always appear together because they represent one application-level concept.

For example:

TypeScript

```
@Auth('admin')
```

can represent the broader policy:

> This route requires authentication, role authorization, and corresponding API documentation.

Other possible composite decorators include:

TypeScript

```
@Public()
```

TypeScript

```
@Paginated()
```

TypeScript

```
@Audited()
```

TypeScript

```
@RateLimited()
```

A composite decorator is useful when it creates a meaningful abstraction rather than merely hiding unrelated decorators.

# 8. Decorator Composition Does Not Automatically Merge All Behavior

`applyDecorators()` can combine decorators that are compatible with it, but it does not guarantee that every decorator can be safely composed.

The NestJS documentation specifically warns that:

TypeScript

```
@ApiHideProperty()
```

from `@nestjs/swagger` is not composable with `applyDecorators()`.

Therefore, this should not be assumed to work correctly:

TypeScript

```
export function HiddenField() {
  return applyDecorators(
    ApiHideProperty(),
  );
}
```

The general lesson is:

> A decorator being valid individually does not necessarily mean it is compatible with decorator composition.

When composing decorators from external libraries, check whether the library supports composition for that decorator.

## Core Takeaway

`applyDecorators()` allows multiple decorators to be exposed through one custom decorator.

Without composition:

TypeScript

```
@SetMetadata('roles', ['admin'])
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse()
```

With composition:

TypeScript

```
@Auth('admin')
```

The composite decorator:

TypeScript

```
export function Auth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
}
```

provides a cleaner, reusable, and more expressive way to apply a group of compatible decorators.