# Custom Decorators in NestJS

Custom decorators allow us to create reusable syntax for behavior that would otherwise be repeated in controllers.

For example, instead of writing:

TypeScript

```
@Get()
findOne(@Req() req: Request) {
  const user = req.user;
  console.log(user);
}
```

we can create a custom parameter decorator:

TypeScript

```
@Get()
findOne(@User() user: UserEntity) {
  console.log(user);
}
```

The controller becomes more expressive because it directly declares what data it needs, rather than manually accessing the request object.

# 1. What Is a Decorator?

A decorator is a special expression prefixed with `@` that can attach behavior or metadata to a program element.

In NestJS, decorators are used on:

- Classes
    
- Methods
    
- Properties
    
- Method parameters
    

Examples:

TypeScript

```
@Controller('cats')
export class CatsController {}
```

TypeScript

```
@Get()
findAll() {}
```

TypeScript

```
@Injectable()
export class CatsService {}
```

TypeScript

```
findOne(@Param('id') id: string) {}
```

The decorator itself does not necessarily execute the route handler. Instead, it provides information or behavior that NestJS uses while building and executing the application.

For example:

TypeScript

```
@Controller('cats')
```

tells NestJS that the class is a controller associated with the `cats` route prefix.

Similarly:

TypeScript

```
@Body()
```

tells NestJS how to obtain an argument from the incoming request.

# 2. Parameter Decorators

A parameter decorator is applied to a parameter of a method.

For example:

TypeScript

```
@Get(':id')
findOne(@Param('id') id: string) {
  return id;
}
```

Here:

TypeScript

```
@Param('id')
```

is a parameter decorator.

NestJS uses it to resolve the value that will be passed to the `id` parameter when the method executes.

## Common built-in parameter decorators

|  
NestJS decorator

|

Corresponding request value

|  
| --- | --- |  
|

`@Request()` or `@Req()`

|

`req`

|  
|

`@Response()` or `@Res()`

|

`res`

|  
|

`@Next()`

|

`next`

|  
|

`@Session()`

|

`req.session`

|  
|

`@Param()`

|

`req.params`

|  
|

`@Param('id')`

|

`req.params.id`

|  
|

`@Body()`

|

`req.body`

|  
|

`@Body('name')`

|

`req.body.name`

|  
|

`@Query()`

|

`req.query`

|  
|

`@Query('page')`

|

`req.query.page`

|  
|

`@Headers()`

|

`req.headers`

|  
|

`@Headers('authorization')`

|

A specific request header

|  
|

`@Ip()`

|

`req.ip`

|  
|

`@HostParam()`

|

`req.hosts`

|

For example:

TypeScript

```
@Get(':id')
findOne(
  @Param('id') id: string,
  @Query('includePosts') includePosts: string,
) {
  return {
    id,
    includePosts,
  };
}
```

For a request such as:

http

```
GET /users/101?includePosts=true
```

NestJS resolves the parameters approximately as:

TypeScript

```
id = '101';
includePosts = 'true';
```

The parameter decorators determine where the argument value comes from.

# 3. Why Custom Parameter Decorators Are Useful

In Node.js applications, authentication middleware or guards commonly attach the authenticated user to the request object:

TypeScript

```
request.user = authenticatedUser;
```

Then, without a custom decorator, every controller may manually access that property:

TypeScript

```
@Get()
findOne(@Req() request: Request) {
  const user = request.user;

  return {
    user,
  };
}
```

This works, but the controller contains request-extraction details.

The same logic may be repeated across many handlers:

TypeScript

```
const user = request.user;
```

TypeScript

```
const user = req.user;
```

TypeScript

```
const currentUser = request.user;
```

A custom parameter decorator hides this repetitive extraction logic behind a meaningful name:

TypeScript

```
@Get()
findOne(@User() user: UserEntity) {
  return {
    user,
  };
}
```

The controller now expresses the intention directly:

> Inject the authenticated user into this parameter.

This improves:

- Readability
    
- Reusability
    
- Consistency
    
- Separation of concerns
    
- Controller maintainability
    

The decorator does not authenticate the user itself. It only extracts the user that another part of the application has already attached to the request.

# 4. Creating a Basic `@User()` Decorator

NestJS provides:

TypeScript

```
createParamDecorator()
```

This function is used to create a custom parameter decorator.

TypeScript

```
import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
```

## Understanding the factory function

The decorator factory receives two arguments:

TypeScript

```
(data, ctx)
```

### `data`

The `data` argument contains optional information passed to the decorator.

For the basic usage:

TypeScript

```
@User()
```

no data is supplied.

Therefore, `data` is not needed in this example.

### `ctx`

The `ctx` argument is an `ExecutionContext`.

It provides information about the current execution environment.

Because this decorator is designed for HTTP requests, it switches to the HTTP context:

TypeScript

```
ctx.switchToHttp()
```

Then it obtains the request object:

TypeScript

```
ctx.switchToHttp().getRequest()
```

The complete extraction process is:

TypeScript

```
const request = ctx.switchToHttp().getRequest();
```

Then the decorator returns:

TypeScript

```
return request.user;
```

That returned value becomes the value of the decorated controller parameter.

# 5. Using the Custom Decorator

Assume an authentication layer has already attached a user to the request:

TypeScript

```
request.user = {
  id: 101,
  firstName: 'Alan',
  lastName: 'Turing',
  email: 'alan@email.com',
  roles: ['admin'],
};
```

The controller can use the custom decorator like this:

TypeScript

```
@Get()
async findOne(@User() user: UserEntity) {
  console.log(user);
}
```

NestJS resolves the parameter approximately as follows:

```
Incoming HTTP request
        ↓
Authentication layer attaches request.user
        ↓
NestJS resolves controller parameters
        ↓
@User() decorator reads request.user
        ↓
Returned value is assigned to user parameter
        ↓
findOne(user) executes
```

Conceptually, the method receives:

TypeScript

```
user = {
  id: 101,
  firstName: 'Alan',
  lastName: 'Turing',
  email: 'alan@email.com',
  roles: ['admin'],
};
```

The controller does not need to write:

TypeScript

```
const request = ctx.switchToHttp().getRequest();
const user = request.user;
```

That extraction logic is centralized inside the decorator.

# 6. The Decorator Does Not Create the User

The custom decorator only reads:

TypeScript

```
request.user
```

It does not:

- Verify a JWT
    
- Authenticate the request
    
- Query the database
    
- Check user permissions
    
- Attach the user to the request
    
- Guarantee that the user exists
    

Those responsibilities belong to other parts of the request pipeline, such as:

- Authentication middleware
    
- Authentication guards
    
- Passport strategies
    
- Custom authentication services
    

The responsibility of this decorator is simply:

```
Read the user from the current HTTP request
```

If `request.user` has not been assigned, the decorator returns:

TypeScript

```
undefined
```

Therefore, the decorator depends on the authentication layer being executed before the controller parameter is resolved.

# 7. Custom Decorators with Data

A custom decorator can accept an argument.

For example:

TypeScript

```
@User('firstName')
```

could mean:

> Read the `firstName` property from the authenticated user.

The argument passed to the decorator is received by the `data` parameter of the factory function.

The implementation is:

TypeScript

```
import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

The key expression is:

TypeScript

```
data ? user?.[data] : user
```

It means:

- If `data` is provided, return the corresponding user property.
    
- If `data` is not provided, return the complete user object.
    

## Case A: No property key

TypeScript

```
@User()
user: UserEntity
```

The decorator receives no key.

Therefore:

TypeScript

```
data
```

is undefined, and the expression returns:

TypeScript

```
user
```

Conceptually:

TypeScript

```
@User()
```

returns:

TypeScript

```
request.user
```

## Case B: A property key is provided

TypeScript

```
@User('firstName')
firstName: string
```

The decorator receives:

TypeScript

```
data = 'firstName';
```

Then:

TypeScript

```
user?.[data]
```

becomes conceptually:

TypeScript

```
user?.['firstName']
```

The result is:

TypeScript

```
'Alan'
```

The controller can therefore be written as:

TypeScript

```
@Get()
async findOne(@User('firstName') firstName: string) {
  console.log(`Hello ${firstName}`);
}
```

Output:

```
Hello Alan
```

# 8. Dynamic Property Access

This expression:

TypeScript

```
user?.[data]
```

uses dynamic property access.

The bracket notation allows the property name to come from a variable.

For example:

TypeScript

```
const key = 'email';

user[key];
```

is equivalent to:

TypeScript

```
user['email'];
```

The optional chaining operator:

TypeScript

```
?.
```

prevents an error if `user` is `null` or `undefined`.

Therefore:

TypeScript

```
user?.[data]
```

returns `undefined` when the user object does not exist instead of throwing an error.

The behavior is approximately:

|  
Request user

|

Decorator usage

|

Result

|  
| --- | --- | --- |  
|

User object exists

|

`@User()`

|

Complete user

|  
|

User object exists

|

`@User('email')`

|

Email value

|  
|

User object exists

|

`@User('roles')`

|

Roles array

|  
|

User is undefined

|

`@User()`

|

`undefined`

|  
|

User is undefined

|

`@User('email')`

|

`undefined`

|  
|

Property does not exist

|

`@User('phone')`

|

`undefined`

|

# 9. Example with a URL-Shortener Service

In a URL-shortener service, an authentication layer may attach the authenticated account to the request:

TypeScript

```
request.user = {
  id: 'user-101',
  email: 'anoop@example.com',
  roles: ['user'],
};
```

A controller could use:

TypeScript

```
@Post()
createShortUrl(
  @User('id') userId: string,
  @Body() createUrlDto: CreateUrlDto,
) {
  return this.urlService.createShortUrl({
    userId,
    ...createUrlDto,
  });
}
```

The controller receives the authenticated user ID directly:

TypeScript

```
userId = 'user-101';
```

This is clearer than:

TypeScript

```
@Post()
createShortUrl(
  @Req() request: Request,
  @Body() createUrlDto: CreateUrlDto,
) {
  const userId = request.user.id;

  return this.urlService.createShortUrl({
    userId,
    ...createUrlDto,
  });
}
```

The custom decorator keeps request-specific extraction at the boundary of the application.

# 10. Type Safety for the `data` Argument

`createParamDecorator` is generic.

You can specify the type of the `data` argument:

TypeScript

```
createParamDecorator<string>((data, ctx) => {
  // data is treated as string
});
```

Alternatively, you can annotate the factory parameter directly:

TypeScript

```
createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    // data is treated as string
  },
);
```

For the `User` decorator, this is preferable to leaving `data` untyped:

TypeScript

```
export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    // ...
  },
);
```

Without an explicit generic or parameter annotation, TypeScript may infer `data` as `any`, depending on the surrounding compiler configuration.

A more explicit version is:

TypeScript

```
export const User = createParamDecorator<string | undefined>(
  (data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

The `undefined` part reflects that the decorator may be used without an argument: