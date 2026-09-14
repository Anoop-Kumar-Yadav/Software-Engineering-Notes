# Setting Roles Per Handler

The previous `RolesGuard` allowed every request:

TypeScript

```
canActivate(): boolean {
  return true;
}
```

The problem is that the guard does not know which roles are required by the current route.

For example, within the same controller:

```
POST /cats
  → admin only

GET /cats
  → accessible to normal users and admins

GET /cats/:id
  → authenticated users
```

The authorization rule differs from handler to handler. Therefore, the guard needs a reusable way to read the roles required by the current handler.

NestJS solves this using custom metadata.

## 1. What Is Custom Metadata?

Metadata is additional information attached to a class, method, or other program element.

In this case, we want to attach authorization information to a route handler:

```
create() handler
      │
      └── required roles: ["admin"]
```

The handler itself still contains the business logic:

TypeScript

```
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  return this.catsService.create(createCatDto);
}
```

The authorization rule is attached separately:

TypeScript

```
@Roles(['admin'])
```

This creates a clean separation:

```
Handler
  → Defines what the route does

Metadata
  → Defines what roles are required

RolesGuard
  → Reads the metadata and enforces the rule
```

The controller does not need to contain role-checking logic directly.

# 2. Creating a `@Roles()` Decorator

NestJS provides `Reflector.createDecorator()` for creating custom decorators that attach metadata.

Create a file named:

```
roles.decorator.ts
```

TypeScript

```
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();
```

## Understanding the code

### Importing `Reflector`

TypeScript

```
import { Reflector } from '@nestjs/core';
```

`Reflector` is a NestJS utility for defining and reading metadata.

It is available from:

TypeScript

```
@nestjs/core
```

The guard will later use the reflector to retrieve the roles attached to a handler.

### Creating the decorator

TypeScript

```
export const Roles = Reflector.createDecorator<string[]>();
```

This creates a decorator named `Roles`.

The generic type:

TypeScript

```
<string[]>
```

specifies the type of metadata that the decorator accepts.

Therefore, the decorator expects an array of strings:

TypeScript

```
@Roles(['admin'])
```

or:

TypeScript

```
@Roles(['admin', 'moderator'])
```

The metadata value is therefore conceptually:

TypeScript

```
{
  roles: ['admin']
}
```

The exact internal storage is managed by NestJS, but from an application perspective, the important fact is:

> `@Roles()` attaches an array of role names to the decorated handler.

# 3. Applying `@Roles()` to a Handler

The decorator can now be used on a controller method:

TypeScript

```
import { Controller, Post, Body } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  @Roles(['admin'])
  async create(@Body() createCatDto: CreateCatDto) {
    return this.catsService.create(createCatDto);
  }
}
```

The important part is:

TypeScript

```
@Roles(['admin'])
```

This expresses the authorization rule:

> Only users with the `admin` role should be allowed to execute `create()`.

The route now contains two separate concerns:

```
@Post()
  → Maps the method to an HTTP POST route

@Roles(['admin'])
  → Declares the roles required by the route
```

The decorator does not itself reject requests.

It only attaches metadata.

The `RolesGuard` must later read that metadata and make the authorization decision.

# 4. Metadata Does Not Enforce Authorization by Itself

This code:

TypeScript

```
@Roles(['admin'])
@Post()
async create() {
  // ...
}
```

does not automatically verify the user’s role.

The process is:

```
@Roles(['admin'])
      ↓
Metadata attached to handler
      ↓
RolesGuard executes
      ↓
RolesGuard reads metadata
      ↓
RolesGuard checks request.user
      ↓
Request allowed or denied
```

Therefore:

```
Decorator = declares the rule
Guard     = enforces the rule
```

This separation is essential.

A decorator should generally describe the route’s requirements, while the guard should contain the authorization mechanism.

# 5. Example with Different Role Requirements

A controller can define different roles for different handlers:

TypeScript

```
@Controller('cats')
export class CatsController {
  @Get()
  @Roles(['user', 'admin'])
  findAll() {
    return this.catsService.findAll();
  }

  @Post()
  @Roles(['admin'])
  create(@Body() createCatDto: CreateCatDto) {
    return this.catsService.create(createCatDto);
  }

  @Delete(':id')
  @Roles(['admin'])
  remove(@Param('id') id: string) {
    return this.catsService.remove(id);
  }
}
```

The metadata associated with the handlers can be understood as:

```
findAll()
  → ["user", "admin"]

create()
  → ["admin"]

remove()
  → ["admin"]
```

The same `RolesGuard` can handle all three routes because it reads the metadata dynamically.

This is more reusable than creating a separate guard for every route:

```
AdminOnlyGuard
UserOrAdminGuard
ModeratorGuard
ManagerGuard
```

Instead, one generic guard can interpret route metadata:

```
RolesGuard
  → reads required roles
  → compares them with the current user's roles
```

# 6. Handler Metadata and Controller Metadata

The supplied example attaches roles directly to a handler:

TypeScript

```
@Roles(['admin'])
@Post()
create() {
  // ...
}
```

This means the metadata is associated with that specific method.

Conceptually:

```
CatsController
      │
      ├── findAll()
      │      └── roles: ["user", "admin"]
      │
      ├── create()
      │      └── roles: ["admin"]
      │
      └── remove()
             └── roles: ["admin"]
```

Because `ExecutionContext` provides:

TypeScript

```
context.getHandler()
context.getClass()
```

the guard can later determine:

- Which handler is executing
    
- Which controller contains it
    
- Which metadata is attached to each one
    

This is why the execution context is important for role-based authorization.

# 7. Alternative: `@SetMetadata()`

NestJS also provides a lower-level decorator called `@SetMetadata()`.

Instead of creating a typed decorator with:

TypeScript

```
Reflector.createDecorator<string[]>()
```

you can attach metadata directly:

TypeScript

```
import { SetMetadata } from '@nestjs/common';

@SetMetadata('roles', ['admin'])
@Post()
create() {
  // ...
}
```

Here:

TypeScript

```
@SetMetadata('roles', ['admin'])
```

contains two values:

```
"roles"
  → metadata key

["admin"]
  → metadata value
```

Conceptually:

TypeScript

```
metadata['roles'] = ['admin'];
```

The guard would later read the metadata using the same key:

TypeScript

```
'roles'
```

## `Reflector.createDecorator()` vs `@SetMetadata()`

|  
Approach

|

Description

|  
| --- | --- |  
|

`Reflector.createDecorator<string[]>()`

|

Creates a reusable, typed custom decorator

|  
|

`@SetMetadata('roles', ['admin'])`

|

Directly attaches metadata using an explicit key

|

### Custom decorator approach

TypeScript

```
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();
```

Usage:

TypeScript

```
@Roles(['admin'])
```

Advantages:

- Cleaner route declarations
    
- Reusable across controllers
    
- Stronger typing for the metadata value
    
- Centralized definition of the metadata decorator
    

### `SetMetadata()` approach

TypeScript

```
import { SetMetadata } from '@nestjs/common';

@SetMetadata('roles', ['admin'])
```

Advantages:

- Direct and flexible
    
- Useful for low-level metadata operations
    
- Does not require defining a separate decorator first
    

The custom decorator is generally more expressive for a recurring authorization concept such as roles.

# 8. The Complete Conceptual Flow

```
1. Define the decorator
   @Roles = metadata decorator

2. Attach it to a handler
   @Roles(['admin'])

3. NestJS stores the metadata
   Handler → required roles: ["admin"]

4. Request reaches the application

5. RolesGuard receives ExecutionContext

6. RolesGuard identifies the current handler
   context.getHandler()

7. RolesGuard reads the handler's metadata

8. RolesGuard compares required roles
   with request.user.roles

9. Guard returns true or false
```

The central architecture is:

```
@Roles(['admin'])
       │
       ▼
Route metadata
       │
       ▼
ExecutionContext
       │
       ▼
RolesGuard
       │
       ▼
Authorization decision
```

## Key Takeaways

- Custom metadata allows authorization rules to be declared separately from handler logic.
    
- `Reflector.createDecorator<string[]>()` creates a reusable `@Roles()` decorator.
    
- `@Roles(['admin'])` attaches the required role information to a handler.
    
- The decorator only declares metadata; it does not enforce access.
    
- `RolesGuard` must read the metadata and compare it with the authenticated user’s roles.
    
- `ExecutionContext` gives the guard access to the current handler and controller.
    
- `@SetMetadata()` is a lower-level alternative for attaching metadata directly.
    
- A single reusable `RolesGuard` can enforce different role requirements for different routes.