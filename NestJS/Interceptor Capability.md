## 1. Response Mapping

Response mapping means modifying the value returned by a route handler before NestJS sends it to the client.

An interceptor can access the handler’s response through:

TypeScript

```
next.handle()
```

Because `handle()` returns an `Observable`, we can use RxJS operators such as `map()` to transform the emitted value.

### Basic execution flow

```
Client Request
      ↓
Interceptor starts
      ↓
next.handle()
      ↓
Controller method executes
      ↓
Controller returns a value
      ↓
Observable emits that value
      ↓
RxJS map() transforms the value
      ↓
NestJS sends the transformed response
```

The important point is that `map()` does not modify the controller method itself. It modifies the value emitted by the handler’s response stream.

## 2. Example: Wrapping the Response in a `data` Property

Suppose the controller returns:

TypeScript

```
@Get()
findAll() {
  return [];
}
```

Without an interceptor, the client receives:

JSON

```
[]
```

Now create a `TransformInterceptor`:

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
      })),
    );
  }
}
```

### What happens inside `map()`

This expression:

TypeScript

```
map((data) => ({
  data,
}))
```

takes the original response and creates a new object containing that response under the `data` property.

Conceptually:

TypeScript

```
// Original handler response
[]

// Transformed response
{
  data: []
}
```

Therefore, the client receives:

JSON

```
{
  "data": []
}
```

The controller still returns the original array. The interceptor changes the response after the controller has executed but before the response is sent.

## 3. Understanding the Generic Types

The interceptor is declared as:

TypeScript

```
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
```

Here:

- `T` represents the original response type.
    
- `Response<T>` represents the transformed response type.
    
- `Response<T>` is defined as:
    

TypeScript

```
export interface Response<T> {
  data: T;
}
```

For example, if the controller returns:

TypeScript

```
Cat[]
```

then the transformed response becomes conceptually:

TypeScript

```
Response<Cat[]>
```

which means:

TypeScript

```
{
  data: Cat[];
}
```

These generic types provide compile-time type information. They do not perform the transformation at runtime. The actual runtime transformation is performed by:

TypeScript

```
map((data) => ({ data }))
```

## 4. Example: Replacing `null` with an Empty String

Interceptors can also be used to apply a reusable transformation to responses throughout an application.

For example, suppose a handler returns:

TypeScript

```
return null;
```

We may want the client to receive:

JSON

```
""
```

Instead of:

JSON

```
null
```

A reusable interceptor can perform this transformation:

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor
  implements NestInterceptor
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((value) => (value === null ? '' : value)),
    );
  }
}
```

The transformation is:

TypeScript

```
value === null ? '' : value
```

Meaning:

- If the response is `null`, return `''`.
    
- Otherwise, return the original response unchanged.
    

### Example behavior

|  
Controller response

|

Client receives

|  
| --- | --- |  
|

`null`

|

`""`

|  
|

`"Anoop"`

|

`"Anoop"`

|  
|

`42`

|

`42`

|  
|

`[]`

|

`[]`

|  
|

`{ id: 1 }`

|

`{ "id": 1 }`

|

### Important limitation

This example checks only whether the entire emitted response is `null`.

For example:

TypeScript

```
{
  name: null,
  age: 22
}
```

will remain unchanged because the complete response object is not `null`.

It does not recursively replace every nested `null` value.

## 5. Why Response Mapping Is Useful

Response mapping is useful when the same response-formatting requirement appears in many endpoints.

Common examples include:

- Wrapping responses in a common structure:
    
    JSON
    
    ```
    {
      "data": {},
      "message": "Success"
    }
    ```
    
- Adding metadata:
    
    JSON
    
    ```
    {
      "data": [],
      "timestamp": "..."
    }
    ```
    
- Converting internal response formats into public API formats.
    
- Removing or replacing specific values.
    
- Normalizing response structures.
    
- Adding pagination information.
    
- Hiding internal fields before returning data.
    

For example, a common API response structure might be:

TypeScript

```
export interface ApiResponse<T> {
  data: T;
  message: string;
  timestamp: string;
}
```

An interceptor could transform a handler’s response into this structure.

The main architectural benefit is that controllers can focus on application behavior while the interceptor handles a reusable response concern.

## 6. Important Restriction: `@Res()` and Response Mapping

The documentation warns that response mapping does not work with the library-specific response strategy using `@Res()` directly.

For example:

TypeScript

```
@Get()
findAll(@Res() response: Response) {
  response.status(200).json({
    data: [],
  });
}
```

Here, the controller directly manages the native response object.

NestJS is no longer responsible for serializing the value returned from the handler in the normal way. Therefore, a response-mapping interceptor cannot reliably transform the response as it would with a standard return-value-based handler.

The recommended style for response mapping is:

TypeScript

```
@Get()
findAll() {
  return [];
}
```

Then the interceptor can transform the returned value:

```
Controller returns []
        ↓
Interceptor maps it
        ↓
Client receives { data: [] }
```

### Core distinction

```
Standard NestJS response strategy:
Controller returns a value
        ↓
NestJS processes the value
        ↓
Interceptor can map the response

Library-specific response strategy:
Controller directly writes to res
        ↓
Response is sent manually
        ↓
Normal response mapping does not apply
```

# 7. Exception Mapping

An interceptor can also transform exceptions emitted by the handler’s response stream.

For this purpose, RxJS provides:

TypeScript

```
catchError()
```

The general structure is:

TypeScript

```
return next.handle().pipe(
  catchError((error) => {
    // Transform or handle the error
  }),
);
```

## Example

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadGatewayException,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor
  implements NestInterceptor
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => new BadGatewayException()),
      ),
    );
  }
}
```

### Execution flow

```
Client Request
      ↓
Interceptor
      ↓
next.handle()
      ↓
Controller executes
      ↓
Controller or service throws an exception
      ↓
Observable emits an error
      ↓
catchError() receives the error
      ↓
Interceptor creates BadGatewayException
      ↓
NestJS exception layer processes it
      ↓
Client receives the resulting error response
```

The original error is replaced with:

TypeScript

```
new BadGatewayException()
```

A `BadGatewayException` represents HTTP status `502`.

The exact response body is then handled by NestJS’s exception-processing mechanism.

### Important point

This code:

TypeScript

```
catchError((err) =>
  throwError(() => new BadGatewayException()),
)
```

does not return a successful response. It creates a new error stream.

Conceptually:

```
Original error
      ↓
catchError()
      ↓
New BadGatewayException
      ↓
Error continues through NestJS exception handling
```

The original error variable:

TypeScript

```
err
```

is available for logging, inspection, or conditional mapping.

For example:

TypeScript

```
catchError((err) => {
  console.error(err);

  return throwError(
    () => new BadGatewayException('Upstream service failed'),
  );
})
```

The interceptor can also map only specific errors and rethrow all others unchanged.

# 8. Stream Overriding

Stream overriding means preventing the route handler from executing and returning a different `Observable` instead.

Normally, an interceptor continues execution using:

TypeScript

```
return next.handle();
```

But an interceptor can return another stream:

TypeScript

```
return of([]);
```

In that case, the handler is not called through that interceptor.

## Example: Basic Cache Interceptor

TypeScript

```
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class CacheInterceptor
  implements NestInterceptor
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const isCached = true;

    if (isCached) {
      return of([]);
    }

    return next.handle();
  }
}
```

### Execution when the response is cached

Because:

TypeScript

```
const isCached = true;
```

the interceptor executes:

TypeScript

```
return of([]);
```

The flow becomes:

```
Client Request
      ↓
CacheInterceptor
      ↓
isCached === true
      ↓
return of([])
      ↓
Controller is not executed
      ↓
Client receives []
```

The `of()` function creates an Observable that emits the supplied value and completes.

TypeScript

```
of([])
```

therefore creates a stream that emits:

TypeScript

```
[]
```

The controller is bypassed because:

TypeScript

```
next.handle()
```

is never called.

## 9. Cache Hit and Cache Miss

The interceptor conceptually implements two paths.

### Cache hit

TypeScript

```
if (isCached) {
  return of(cachedValue);
}
```

Flow:

```
Cache contains response
      ↓
Return cached Observable
      ↓
Skip controller
      ↓
Send cached response
```

### Cache miss

TypeScript

```
return next.handle();
```

Flow:

```
Cache does not contain response
      ↓
Call next.handle()
      ↓
Controller executes
      ↓
Response is generated
      ↓
Response can be stored in cache
      ↓
Response is returned
```

A realistic cache interceptor would need to handle:

- Cache keys.
    
- Request method.
    
- Request URL and query parameters.
    
- User-specific data.
    
- Cache expiration or TTL.
    
- Cache invalidation.
    
- Concurrent requests.
    
- Cache size limits.
    
- Serialization and deserialization.
    
- Errors while reading or writing the cache.
    
- Whether the endpoint is safe to cache.
    

The documentation’s example intentionally uses hardcoded values only to demonstrate the central mechanism.

## 10. `next.handle()` Versus `of()`

|  
Expression

|

Meaning

|  
| --- | --- |  
|

`next.handle()`

|

Continue toward the next interceptor and eventually the route handler

|  
|

`next.handle().pipe(map(...))`

|

Execute the handler and transform its emitted response

|  
|

`next.handle().pipe(catchError(...))`

|

Execute the handler and transform or handle errors

|  
|

`of(value)`

|

Create a new Observable that emits `value`

|  
|

`return of(value)`

|

Return a response without calling the route handler through this interceptor

|

The most important distinction is:

TypeScript

```
return next.handle();
```

continues the normal execution chain, whereas:

TypeScript

```
return of(value);
```

replaces the normal execution stream.

## Overall Comparison

|  
Interceptor capability

|

RxJS mechanism

|

Handler executed?

|  
| --- | --- | --- |  
|

Response mapping

|

`map()`

|

Yes

|  
|

Exception mapping

|

`catchError()`

|

Usually yes

|  
|

Stream overriding

|

`of()` or another Observable

|

Not necessarily

|  
|

Logging after response

|

`tap()`

|

Yes

|  
|

Cleanup after completion/error

|

`finalize()`

|

Usually yes

|

### Central idea

An interceptor does not have to simply “run before or after” a controller. It can also control the Observable stream representing the controller’s execution:

```
Continue the stream:
next.handle()

Transform successful values:
next.handle().pipe(map(...))

Transform errors:
next.handle().pipe(catchError(...))

Replace the stream:
of(cachedValue)
```

The final example in the documentation mentions using `Reflector` and a custom decorator to make the cache interceptor generic. That would allow different handlers to define their own cache-related metadata, which the interceptor could read and use.