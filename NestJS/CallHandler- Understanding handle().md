## CallHandler: Understanding `handle()`

The `CallHandler` is the second argument provided to an interceptor’s `intercept()` method.

TypeScript

```
intercept(
  context: ExecutionContext,
  next: CallHandler,
) {
  // Interceptor logic
}
```

Its main purpose is to provide the `handle()` method:

TypeScript

```
next.handle()
```

This method allows the interceptor to continue execution toward the actual route handler.

## 1. What does `next.handle()` do?

Consider a route in `CatsController`:

TypeScript

```
import { Controller, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create() {
    return {
      message: 'Cat created',
    };
  }
}
```

When a client sends:

http

```
POST /cats
```

NestJS eventually needs to execute:

TypeScript

```
catsController.create();
```

If an interceptor is applied to this route, NestJS gives the interceptor a `CallHandler` object.

The interceptor can invoke the controller by calling:

TypeScript

```
next.handle();
```

Conceptually:

```
POST /cats
    │
    ▼
LoggingInterceptor.intercept()
    │
    ▼
next.handle()
    │
    ▼
CatsController.create()
    │
    ▼
Controller result
```

Therefore, `handle()` means:

> Continue the execution chain and invoke the route handler when the pipeline reaches that point.

## 2. What happens if `handle()` is not called?

If an interceptor does not call `next.handle()`, the route handler is not executed through that interceptor.

For example:

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

@Injectable()
export class BlockingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ) {
    console.log('Interceptor executed');

    // next.handle() is not called
  }
}
```

In this case:

```
Request
   │
   ▼
BlockingInterceptor
   │
   ├── Logs message
   │
   └── Does not call next.handle()
             │
             ▼
       Controller is skipped
```

The `create()` method will not execute.

The interceptor has effectively stopped the normal handler execution. In a real application, the interceptor should generally either:

- Call `next.handle()` to continue the request, or
    
- Return an alternative result when intentionally replacing the handler execution.
    

For example, an interceptor could intentionally return a cached response instead of calling the controller.

## 3. `handle()` returns an `Observable`

The important detail is that:

TypeScript

```
next.handle()
```

does not directly return the final response value.

It returns an RxJS `Observable`.

TypeScript

```
const result = next.handle();
```

Conceptually:

```
handle()
   │
   ▼
Observable
   │
   └── Represents the future result of the route handler
```

An `Observable` represents a stream of values or events that can be processed over time.

For a typical NestJS HTTP handler, the Observable generally represents the result produced by the controller method.

For example, suppose the controller returns:

TypeScript

```
@Post()
create() {
  return {
    id: 1,
    name: 'Tom',
  };
}
```

The interceptor does not necessarily receive this object directly from `handle()`:

TypeScript

```
const result = next.handle();
// result is an Observable, not directly { id: 1, name: 'Tom' }
```

Instead, the result is represented by the Observable:

```
Observable
    │
    ▼
{ id: 1, name: "Tom" }
```

This allows the interceptor to attach RxJS operators to the handler’s result.

## 4. Why does this allow “after” logic?

An interceptor can execute code before calling `handle()`:

TypeScript

```
intercept(context, next) {
  console.log('Before');

  return next.handle();
}
```

The `Before` message is printed before the route handler is allowed to continue.

But code written immediately after `handle()` is different:

TypeScript

```
intercept(context, next) {
  console.log('Before');

  const result = next.handle();

  console.log('After');

  return result;
}
```

Here, `After` is printed immediately after the Observable is created or returned. It does not necessarily mean that the controller has finished executing.

To run logic when the Observable emits the handler’s result, the interceptor can use RxJS operators.

For example:

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
    console.log('Before');

    return next.handle().pipe(
      tap(() => {
        console.log('After');
      }),
    );
  }
}
```

The important part is:

TypeScript

```
next.handle().pipe(
  tap(() => {
    console.log('After');
  }),
);
```

Here:

1. `next.handle()` obtains the Observable.
    
2. `.pipe()` creates a processing chain for that Observable.
    
3. `tap()` registers a side effect.
    
4. The callback inside `tap()` runs when the Observable emits a value.
    
5. The original value continues through the stream unchanged.
    

The execution flow is:

```
Interceptor starts
      │
      ▼
Print "Before"
      │
      ▼
Call next.handle()
      │
      ▼
Controller executes
      │
      ▼
Controller produces result
      │
      ▼
Observable emits result
      │
      ▼
tap() executes
      │
      ▼
Print "After"
      │
      ▼
Result continues to response handling
```

## 5. The meaning of `pipe()`

RxJS provides the `pipe()` method to compose operators.

TypeScript

```
observable.pipe(
  operator1(),
  operator2(),
  operator3(),
);
```

In an interceptor:

TypeScript

```
return next.handle().pipe(
  tap(() => {
    console.log('Handler completed');
  }),
);
```

The interceptor is not manually calling the controller method. It is modifying the Observable that represents the controller’s execution.

This is the general pattern:

TypeScript

```
return next.handle().pipe(
  // RxJS operators
);
```

The operators can:

- Observe emitted values.
    
- Transform emitted values.
    
- Handle errors.
    
- Perform cleanup.
    
- Replace or terminate the stream.
    
- Add timing or logging behavior.
    

## 6. Understanding `tap()`

The `tap()` operator is used for side effects.

A side effect is an operation that observes or records something without changing the value flowing through the stream.

Example:

TypeScript

```
return next.handle().pipe(
  tap((value) => {
    console.log('Response:', value);
  }),
);
```

If the controller produces:

TypeScript

```
{
  id: 1,
  name: 'Tom',
}
```

The `tap()` callback can log that value, but the response remains unchanged:

```
Controller result
      │
      ▼
tap() logs result
      │
      ▼
Same result continues
```

Conceptually:

```
Input value → tap() → Same value
```

This is why `tap()` is useful for:

- Logging.
    
- Auditing.
    
- Measuring execution time.
    
- Dispatching events.
    
- Recording metrics.
    

It is not normally used to transform the response.

For transformation, another RxJS operator such as `map()` is more appropriate.

## 7. The `LoggingInterceptor` example

The documentation’s interceptor is:

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    console.log('Before...');

    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() => {
          console.log(`After... ${Date.now() - now}ms`);
        }),
      );
  }
}
```

The code performs three main operations.

### First: execute before-handler logic

TypeScript

```
console.log('Before...');
```

This runs when the interceptor begins.

### Second: record the starting time

TypeScript

```
const now = Date.now();
```

This stores the current timestamp before the handler execution begins.

### Third: continue execution and observe the result

TypeScript

```
return next
  .handle()
  .pipe(
    tap(() => {
      console.log(`After... ${Date.now() - now}ms`);
    }),
  );
```

The interceptor:

1. Calls `handle()` to allow the route handler to execute.
    
2. Receives the Observable representing the handler result.
    
3. Adds `tap()` to the Observable.
    
4. Calculates the elapsed time when the Observable emits.
    
5. Logs the duration.
    
6. Allows the original result to continue.
    

Example output:

```
Before...
After... 18ms
```

The `18ms` value represents the elapsed time measured by:

TypeScript

```
Date.now() - now
```

## 8. `tap()` and exceptional termination

The documentation notes that `tap()` can execute its callback during normal or exceptional termination of the Observable stream.

However, the callback form shown here:

TypeScript

```
tap(() => {
  console.log('After');
})
```

is primarily associated with emitted values.

For more explicit handling of different stream events, `tap()` can receive separate callbacks:

TypeScript

```
return next.handle().pipe(
  tap({
    next: (value) => {
      console.log('Handler emitted:', value);
    },
    error: (error) => {
      console.log('Handler failed:', error);
    },
    complete: () => {
      console.log('Handler completed');
    },
  }),
);
```

These callbacks have different meanings:

|  
Callback

|

When it runs

|  
| --- | --- |  
|

`next`

|

When the Observable emits a value

|  
|

`error`

|

When the Observable terminates with an error

|  
|

`complete`

|

When the Observable completes successfully

|

The `tap()` operator observes these events without intentionally changing the stream’s values.

## 9. `NestInterceptor<T, R>` generics

The `NestInterceptor` interface supports two generic types:

TypeScript

```
NestInterceptor<T, R>
```

The documentation describes them in terms of the Observable response stream:

- `T` represents the type of the value received from the response stream.
    
- `R` represents the type of the value returned by the transformed response stream.
    

For example:

TypeScript

```
NestInterceptor<string, string>
```

indicates that the interceptor receives and returns string-based response values.

A more practical example is a response transformation interceptor:

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor
  implements NestInterceptor<unknown, unknown>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
```

Here, the interceptor receives the original handler result and wraps it in another object.

For example, the controller returns:

JSON

```
{
  "id": 1,
  "name": "Tom"
}
```

The interceptor can produce:

JSON

```
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tom"
  }
}
```

The important distinction is:

```
tap() → observes a value without changing it
map() → transforms a value into another value
```

## 10. Interceptors can use dependency injection

Interceptors are NestJS-managed classes, so they can inject dependencies through their constructors just like:

- Controllers
    
- Providers
    
- Guards
    
- Pipes
    
- Exception filters
    

For example:

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

import { Observable, tap } from 'rxjs';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    this.logger.log('Before handler execution');

    return next.handle().pipe(
      tap(() => {
        this.logger.log('Handler execution completed');
      }),
    );
  }
}
```

Because NestJS creates the interceptor, NestJS can resolve `LoggerService` from the dependency-injection container.

This is another reason to prefer registering the interceptor as a class rather than manually constructing it with `new`, especially when it has dependencies.

## Core takeaway

`CallHandler` gives an interceptor access to:

TypeScript

```
next.handle()
```

That method:

- Continues the execution chain.
    
- Causes the route handler to execute when reached.
    
- Returns an RxJS `Observable`.
    
- Allows the interceptor to attach operators to the handler’s result.
    
- Can be intentionally skipped when the interceptor wants to replace the handler execution.
    

The central interceptor pattern is:

TypeScript

```
return next.handle().pipe(
  tap(() => {
    // Logic after the handler emits a result
  }),
);
```

In short:

```
CallHandler
    │
    ▼
handle()
    │
    ▼
Observable representing handler execution
    │
    ▼
RxJS operators
    │
    ▼
Final response
```