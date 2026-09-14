## More Operators: Handling Request Timeouts

The `timeout()` operator is used when an endpoint must complete within a specific time limit.

For example, if an endpoint does not produce a response within 5 seconds, we may want to stop waiting and return a timeout-related HTTP error.

An interceptor is a suitable place for this because it wraps the execution stream returned by:

TypeScript

```
next.handle()
```

## 1. The `timeout()` Operator

The `timeout()` operator monitors an Observable and raises a `TimeoutError` if the Observable does not emit a value within the configured duration.

TypeScript

```
timeout(5000)
```

Here:

- `5000` represents 5,000 milliseconds.
    
- 5,000 milliseconds equals 5 seconds.
    
- If the handler does not emit a response within that time, the stream fails with a `TimeoutError`.
    

The basic structure is:

TypeScript

```
return next.handle().pipe(
  timeout(5000),
);
```

Conceptually:

```
Request enters interceptor
        ↓
next.handle()
        ↓
Controller starts executing
        ↓
Wait for the response
        ↓
Response emitted within 5 seconds?
        ├── Yes → Continue normally
        └── No  → TimeoutError is raised
```

## 2. Complete `TimeoutInterceptor`

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';

import {
  Observable,
  throwError,
  TimeoutError,
} from 'rxjs';

import {
  catchError,
  timeout,
} from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor
  implements NestInterceptor
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      timeout(5000),

      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () => new RequestTimeoutException(),
          );
        }

        return throwError(() => err);
      }),
    );
  }
}
```

This interceptor performs two operations:

1. Apply a five-second timeout to the handler’s Observable.
    
2. Convert a `TimeoutError` into NestJS’s `RequestTimeoutException`.
    

## 3. Understanding the Operator Chain

The important part is:

TypeScript

```
return next.handle().pipe(
  timeout(5000),
  catchError((err) => {
    if (err instanceof TimeoutError) {
      return throwError(
        () => new RequestTimeoutException(),
      );
    }

    return throwError(() => err);
  }),
);
```

The operators are applied in sequence:

```
next.handle()
      ↓
timeout(5000)
      ↓
catchError(...)
      ↓
Observable returned by interceptor
```

### Case A: The handler responds in time

Suppose the controller responds after 2 seconds:

```
Controller starts
      ↓
2 seconds pass
      ↓
Controller emits response
      ↓
timeout(5000) allows it
      ↓
catchError() is not triggered
      ↓
Normal response is returned
```

### Case B: The handler exceeds the timeout

Suppose the controller does not emit a response within 5 seconds:

```
Controller starts
      ↓
5 seconds pass without an emission
      ↓
timeout(5000) raises TimeoutError
      ↓
catchError() receives TimeoutError
      ↓
RequestTimeoutException is created
      ↓
NestJS exception layer processes it
      ↓
Error response is sent to the client
```

### Case C: The handler throws another error

Suppose the controller or a service throws a database-related error:

```
Controller/service throws an error
      ↓
timeout() does not convert it
      ↓
catchError() receives the original error
      ↓
Error is not a TimeoutError
      ↓
Original error is rethrown
```

This part preserves non-timeout errors:

TypeScript

```
return throwError(() => err);
```

Therefore, the interceptor changes only timeout errors and leaves other errors unchanged.

## 4. Why `throwError()` Is Used

The callback passed to `catchError()` must return an Observable.

This is why the interceptor uses:

TypeScript

```
return throwError(
  () => new RequestTimeoutException(),
);
```

`throwError()` creates an Observable that immediately terminates with an error.

It does not return a successful value.

Conceptually:

```
TimeoutError
    ↓
throwError(...)
    ↓
RequestTimeoutException
    ↓
NestJS exception handling
```

The following would be incorrect for this purpose:

TypeScript

```
return new RequestTimeoutException();
```

That returns an exception object as an ordinary value rather than creating an error Observable.

## 5. Why the Error Is Mapped to `RequestTimeoutException`

RxJS produces a technical error:

TypeScript

```
TimeoutError
```

NestJS applications generally expose HTTP-oriented exceptions to clients.

The interceptor translates the RxJS error into:

TypeScript

```
new RequestTimeoutException()
```

This is an instance of a NestJS HTTP exception representing HTTP 408 Request Timeout.

The interceptor therefore acts as an adapter between:

```
RxJS error
    ↓
NestJS HTTP exception
    ↓
HTTP error response
```

The client can then receive a timeout-related HTTP response instead of an internal RxJS error.

## 6. Important Meaning of “Request Processing Is Canceled”

The documentation states that after five seconds, request processing is canceled.

More precisely, the `timeout()` operator stops waiting for the Observable and raises a timeout error. It does not necessarily terminate every underlying operation immediately.

For example:

```
HTTP request
    ↓
Controller calls a database
    ↓
Database operation is still running
    ↓
Timeout occurs in interceptor
    ↓
Client receives timeout response
```

The database operation may still continue unless the underlying operation supports cancellation and the application explicitly propagates cancellation.

Therefore:

- The interceptor stops waiting for the response stream.
    
- The client-facing request can fail with a timeout response.
    
- Underlying work may require additional cancellation or cleanup logic.
    

This distinction is important for expensive operations such as:

- Database queries.
    
- External HTTP requests.
    
- File processing.
    
- Message-broker operations.
    
- Long-running computations.
    

## 7. Adding Cleanup Logic

The documentation mentions adding custom logic before throwing `RequestTimeoutException`, such as releasing resources.

For example:

TypeScript

```
catchError((err) => {
  if (err instanceof TimeoutError) {
    // Custom cleanup logic
    // release resources
    // record timeout metrics
    // log timeout details

    return throwError(
      () => new RequestTimeoutException(),
    );
  }

  return throwError(() => err);
})
```

Possible timeout-related actions include:

- Logging the timeout.
    
- Recording metrics.
    
- Releasing acquired resources.
    
- Cancelling an operation if cancellation is supported.
    
- Closing temporary streams.
    
- Clearing application-level locks.
    
- Adding tracing information.
    
- Notifying an external monitoring system.
    

For cleanup that should run on success, error, or completion, the RxJS `finalize()` operator is often useful:

TypeScript

```
return next.handle().pipe(
  timeout(5000),
  finalize(() => {
    // Cleanup executed when the stream terminates
  }),
);
```

The exact cleanup strategy depends on the resource being managed.

## 8. Operator Order Matters

The order of RxJS operators affects the behavior of the stream.

The documented order is:

TypeScript

```
next.handle().pipe(
  timeout(5000),
  catchError(...),
)
```

This means:

1. The handler stream is subject to the timeout.
    
2. If a timeout occurs, `catchError()` can recognize it.
    
3. The timeout error is converted into `RequestTimeoutException`.
    

Conceptually:

```
Handler stream
      ↓
Apply timeout
      ↓
TimeoutError generated if necessary
      ↓
catchError handles the error
```

The central pattern is:

TypeScript

```
next.handle().pipe(
  timeout(duration),
  catchError((error) => {
    // Convert or rethrow the error
  }),
);
```

## Core Takeaway

A timeout interceptor uses RxJS to impose a maximum response-waiting period on a route handler:

TypeScript

```
next.handle()
```

is the handler’s response stream,

TypeScript

```
timeout(5000)
```

limits the waiting period to five seconds, and

TypeScript

```
catchError(...)
```

converts the RxJS `TimeoutError` into a NestJS HTTP exception.

The complete flow is:

```
Request
   ↓
TimeoutInterceptor
   ↓
next.handle()
   ↓
timeout(5000)
   ├── Response emitted in time
   │       ↓
   │   Normal response
   │
   └── No response in 5 seconds
           ↓
       TimeoutError
           ↓
       catchError()
           ↓
       RequestTimeoutException
           ↓
       HTTP 408 response
```