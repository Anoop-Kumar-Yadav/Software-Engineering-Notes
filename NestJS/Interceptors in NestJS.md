# Interceptors in NestJS

An interceptor is a class decorated with `@Injectable()` that implements the `NestInterceptor` interface.

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ) {
    // Interceptor logic
  }
}
```

The main idea is that an interceptor can execute around the controller method. It can perform some work before the controller runs, allow the controller to execute, and then perform additional work after the controller has produced a result.

## 1. The problem interceptors solve

Suppose you have several controller methods:

TypeScript

```
@Get()
findAll() {
  return this.usersService.findAll();
}

@Get(':id')
findOne() {
  return this.usersService.findOne();
}

@Post()
create() {
  return this.usersService.create();
}
```

Now suppose you want to add the same behavior to all of them:

- Log when a request starts.
    
- Measure execution time.
    
- Log when the method finishes.
    
- Transform the returned response.
    
- Catch and transform certain errors.
    
- Return a cached result instead of executing the controller.
    

You could manually write this logic inside every controller method:

TypeScript

```
@Get()
findAll() {
  console.log('Request started');

  const result = this.usersService.findAll();

  console.log('Request finished');

  return result;
}
```

However, this creates several problems:

- The same logic is repeated.
    
- Controller methods become cluttered.
    
- Business logic becomes mixed with logging, timing, formatting, and caching.
    
- Changing the common behavior requires editing many methods.
    
- It becomes difficult to apply the behavior consistently.
    

An interceptor allows this cross-cutting logic to be placed in one reusable class instead of duplicating it across many handlers.

## 2. Interceptors and Aspect-Oriented Programming

NestJS describes interceptors as being inspired by Aspect-Oriented Programming, or AOP.

AOP is a programming approach for separating concerns that affect many parts of an application.

Examples of such concerns include:

- Logging
    
- Performance measurement
    
- Security checks
    
- Caching
    
- Transactions
    
- Auditing
    
- Response formatting
    
- Error transformation
    

These concerns are called cross-cutting concerns because they are not limited to one business feature. They may affect many unrelated controller methods.

For example:

```
UsersController.findAll()
UsersController.findOne()
OrdersController.create()
ProductsController.update()
```

All of these methods may need execution-time logging:

```
                 ┌──────────────────────────┐
                 │      Logging Concern     │
                 └────────────┬─────────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
        findAll()        findOne()         create()
```

Instead of placing logging code inside each method, an interceptor provides a reusable layer around those methods.

## 3. The central concept: wrapping method execution

The most important thing to understand is that an interceptor wraps the execution of the handler.

Conceptually:

```
Incoming request
       │
       ▼
   Middleware
       │
       ▼
     Guards
       │
       ▼
  Interceptor
       │
       ├── Logic before handler
       │
       ▼
  Controller method
       │
       ▼
  Returned result
       │
       ├── Logic after handler
       │
       ▼
   HTTP response
```

A more precise representation is:

```
interceptor
    ├── before logic
    ├── execute next.handle()
    │       └── controller method executes
    └── after logic
```

The interceptor is therefore different from a pipe or guard:

|  
Component

|

Main responsibility

|  
| --- | --- |  
|

Middleware

|

Execute logic at the HTTP request level before Nest selects and executes a handler

|  
|

Guard

|

Decide whether the request is allowed to continue

|  
|

Pipe

|

Validate or transform an argument before it reaches the handler

|  
|

Interceptor

|

Wrap handler execution and optionally modify its result or exception

|

An interceptor does not merely execute before the controller. Its defining feature is that it can also execute logic after or around the controller execution.

## 4. The `NestInterceptor` interface

A basic interceptor implements the `NestInterceptor` interface.

Its main method is:

TypeScript

```
intercept(
  context: ExecutionContext,
  next: CallHandler,
)
```

The two parameters have different responsibilities.

### `ExecutionContext`

`ExecutionContext` provides information about the current execution environment.

It can be used to access:

- The current HTTP request.
    
- The current HTTP response.
    
- The controller class.
    
- The controller method.
    
- The execution type, such as HTTP, WebSocket, or RPC.
    

For HTTP applications:

TypeScript

```
const request = context.switchToHttp().getRequest();
const response = context.switchToHttp().getResponse();
```

For example:

TypeScript

```
const request = context.switchToHttp().getRequest();

console.log(request.method);
console.log(request.url);
```

The interceptor can therefore inspect the request and determine which handler is being executed.

### `CallHandler`

`CallHandler` represents the next stage of execution.

Its most important method is:

TypeScript

```
next.handle()
```

Calling `next.handle()` allows the request-processing chain to continue toward the controller method.

Conceptually:

TypeScript

```
next.handle();
```

means:

> Continue execution and obtain the result produced by the next handler.

In the usual HTTP request pipeline, this eventually causes the controller method to execute.

If the interceptor does not call `next.handle()` and does not return an alternative result, the controller method may never execute.

## 5. Basic interceptor structure

A minimal interceptor looks like this:

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ) {
    console.log('Before controller execution');

    const result = next.handle();

    console.log('After controller execution');

    return result;
  }
}
```

However, this example requires an important clarification.

In NestJS, `next.handle()` returns an RxJS `Observable`, not necessarily the final controller result immediately.

Therefore, the following line:

TypeScript

```
console.log('After controller execution');
```

does not necessarily execute after the controller has actually completed. It executes immediately after `next.handle()` returns the Observable.

To execute logic after the handler’s result is produced, interceptors generally use RxJS operators such as `tap()`.

A more meaningful logging interceptor is:

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    console.log('Before controller execution');

    return next.handle().pipe(
      tap(() => {
        console.log('After controller execution');
      }),
    );
  }
}
```

The execution sequence is:

```
1. Interceptor starts
2. "Before controller execution" is logged
3. next.handle() continues the Nest pipeline
4. Controller method executes
5. Controller produces a result
6. tap() runs
7. "After controller execution" is logged
8. Result continues toward the response layer
```

The key distinction is:

TypeScript

```
next.handle()
```

returns an Observable representing the handler execution, while:

TypeScript

```
next.handle().pipe(...)
```

allows the interceptor to react to the emitted result.

## 6. Why interceptors are called “around” logic

An interceptor can surround the handler execution:

TypeScript

```
intercept(context, next) {
  // Before

  return next.handle().pipe(
    // After or during result processing
  );
}
```

This gives an interceptor a structure similar to:

```
┌───────────────────────────────────────┐
│           Interceptor                 │
│                                       │
│   Before logic                        │
│        │                              │
│        ▼                              │
│   Controller method                   │
│        │                              │
│        ▼                              │
│   Result processing                   │
│        │                              │
│        ▼                              │
│   After logic                         │
│                                       │
└───────────────────────────────────────┘
```

This is why interceptors are suitable for operations such as:

- Measuring execution time.
    
- Logging input and output.
    
- Modifying response data.
    
- Handling result caching.
    
- Mapping errors.
    
- Adding common response structure.
    
- Executing cleanup logic.
    

The interceptor does not need to know the internal business logic of the controller. It only needs to wrap the execution boundary.

## 7. The six capabilities listed in the documentation

NestJS identifies several capabilities provided by interceptors:

1. Execute additional logic before or after method execution.
    
2. Transform the result returned by a method.
    
3. Transform an exception thrown by a method.
    
4. Extend the basic behavior of a method.
    
5. Completely override method execution under certain conditions.
    
6. Implement cross-cutting behavior using a reusable abstraction.
    

These capabilities all come from the same central mechanism:

TypeScript

```
next.handle()
```

The interceptor can choose whether to:

- Call `next.handle()`.
    
- Modify the Observable returned by `next.handle()`.
    
- Return a different Observable.
    
- Throw an exception.
    
- Add logic before or after the handler execution.
    

For example:

```
                     Interceptor
                          │
              ┌───────────┴───────────┐
              │                       │
       Call next.handle()       Do not call it
              │                       │
              ▼                       ▼
     Execute controller        Return alternative result
```

The second option is useful for cases such as caching, where a cached response may be returned without executing the controller method.

## 8. Important distinction from guards

A guard answers:

> Is this request allowed to proceed?

An interceptor answers:

> What should happen around the execution of the handler?

For example:

TypeScript

```
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

The guard makes a decision:

```
Allow or deny
```

An interceptor instead wraps execution:

TypeScript

```
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.log(`Execution took ${duration}ms`);
      }),
    );
  }
}
```

The interceptor does not primarily decide whether the request is authorized. It observes or modifies the execution of the handler.

## Core takeaway

An interceptor is a NestJS execution-layer component that wraps a controller handler.

Its most important mechanism is:

TypeScript

```
next.handle()
```

This allows it to:

- Execute logic before the handler.
    
- Allow the handler to execute.
    
- Observe or transform the returned result.
    
- Transform or handle errors.
    
- Replace the handler execution when necessary.
    

In short:

```
Guard       → Should execution continue?
Pipe        → What argument should the handler receive?
Interceptor → What should happen around handler execution?
```

The next focused topic should be the `intercept()` method, `ExecutionContext`, and `CallHandler`, especially why `next.handle()` returns an Observable and how that creates the “before/after” behavior.