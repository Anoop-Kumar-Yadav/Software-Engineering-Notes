# Pipes in NestJS

A **Pipe** is a NestJS class used to process data **before a controller route handler executes**.

A pipe has two primary responsibilities:

```text
Input
  ↓
Pipe
  ├── Transform → modified value
  └── Validate → same value / exception
  ↓
Controller Handler
```

The important point is that pipes operate on the **arguments that are going to be passed to the controller method**.

---

## 1. What is a Pipe?

A pipe is a class that:

- is decorated with `@Injectable()`
    
- implements `PipeTransform`
    
- receives an argument value
    
- can transform or validate that value
    
- returns the value if processing succeeds
    
- can throw an exception if processing fails
    

Basic structure:

```typescript
import {
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class MyPipe implements PipeTransform {
  transform(value: any) {
    // transform or validate value

    return value;
  }
}
```

The important contract is:

```text
PipeTransform
      ↓
transform(value)
      ↓
processed value
```

---

# 2. Where Does a Pipe Execute?

Nest places the pipe **immediately before the controller method is invoked**.

For example:

```typescript
@Get(':id')
findOne(@Param('id') id: number) {
  return this.service.findOne(id);
}
```

Conceptually:

```text
HTTP Request
     ↓
Route matched
     ↓
Nest resolves controller arguments
     ↓
Pipe
     ↓
Controller method
     ↓
Service
```

The pipe operates on the value that is going to become:

```typescript
id
```

inside:

```typescript
findOne(id)
```

So pipes are associated with **controller arguments**, not simply with the raw HTTP request.

---

# 3. Two Main Uses

Nest defines two typical use cases for pipes.

## Transformation

Change incoming data into the desired representation.

Example:

```text
"42"
  ↓
Pipe
  ↓
42
```

This is particularly useful because HTTP request data commonly arrives as strings.

For example:

```http
GET /users/42
```

The route parameter initially comes from the HTTP request as:

```typescript
"42"
```

A pipe can transform it into:

```typescript
42
```

before the controller receives it.

---

## Validation

Check whether incoming data satisfies some requirement.

```text
Input
  ↓
Pipe
  ↓
Valid?
 ┌───────┴────────┐
 ↓                ↓
YES              NO
 ↓                ↓
pass through    throw exception
 ↓
Controller
```

For valid data, the pipe returns the value.

For invalid data, it throws an exception.

Example:

```text
age = 25
   ↓
validation
   ↓
valid
   ↓
controller executes
```

But:

```text
age = -5
   ↓
validation
   ↓
invalid
   ↓
exception
   ↓
controller does NOT execute
```

---

# 4. Transformation vs Validation

These should be kept conceptually separate.

### Transformation

The input is acceptable, but its **representation needs to change**.

```text
"123"
 ↓
123
```

### Validation

The input is checked for correctness.

```text
"abc"
 ↓
Is this a valid integer?
 ↓
NO
 ↓
exception
```

A single pipe can technically perform both operations.

```text
Input
  ↓
Transform
  ↓
Validate
  ↓
Return transformed value
```

---

# 5. Pipes Operate on Controller Arguments

This is one of the most important concepts.

Suppose:

```typescript
@Get(':id')
findOne(
  @Param('id') id: number,
) {}
```

The pipe receives the argument value associated with:

```typescript
@Param('id')
```

It is not simply receiving the entire HTTP request.

Conceptually:

```text
Request
  │
  ├── params
  │     └── id = "42"
  │
  ├── query
  └── body
        │
        ↓
Argument resolution
        │
        ↓
@Param('id')
        │
        ↓
Pipe
        │
        ↓
Controller argument
        │
        ↓
findOne(id)
```

This becomes especially important when we study **pipe binding**, because pipes can be attached to different levels of the argument/controller/application.

---

# 6. Pipes Run Before Method Invocation

Suppose:

```typescript
@Get(':id')
findOne(@Param('id') id: number) {
  console.log('Controller executed');

  return this.service.findOne(id);
}
```

If a pipe rejects the input:

```text
HTTP Request
     ↓
Route
     ↓
Pipe
     ↓
❌ exception
     ↓
Exceptions Layer
     ↓
HTTP Response
```

The controller method is **never called**.

There is no:

```text
findOne(...)
```

execution after the pipe throws.

This makes pipes particularly useful for **system-boundary validation**.

---

# 7. Pipes Run Inside the Exceptions Zone

This is an important NestJS execution detail.

If a pipe throws an exception:

```typescript
throw new BadRequestException('Invalid ID');
```

the exception enters Nest's normal exceptions handling mechanism.

```text
Request
   ↓
Pipe
   │
   └── throw exception
           ↓
     Exceptions Layer
           ↓
     Exception Filter
           ↓
     HTTP Response
```

Therefore, you don't generally need to manually send a response from a pipe.

For example:

```typescript
@Injectable()
export class ParseIdPipe implements PipeTransform {
  transform(value: string) {
    const id = Number(value);

    if (Number.isNaN(id)) {
      throw new BadRequestException(
        'ID must be a number',
      );
    }

    return id;
  }
}
```

If the request contains:

```text
/users/abc
```

then:

```text
"abc"
 ↓
ParseIdPipe
 ↓
Number("abc")
 ↓
NaN
 ↓
BadRequestException
 ↓
Exceptions Layer
 ↓
400 Response
```

and:

```typescript
findOne(...)
```

never executes.

---

# 8. Why Pipes Are a System-Boundary Mechanism

External input enters your application through boundaries such as:

```text
HTTP
WebSocket
Microservice message
```

That input cannot automatically be trusted to have the shape or type your internal code expects.

Pipes provide a controlled boundary:

```text
External Input
      ↓
   Pipe
      │
      ├── transform
      ├── validate
      └── reject
      ↓
Trusted Controller Argument
      ↓
Application Logic
```

This allows the controller/service layer to work with data that has already passed the required processing.

---

# 9. Pipe vs Exception Filter

Since we just studied exception filters, keep the distinction clear:

```text
Pipe
 ↓
Prevents invalid argument from reaching controller
```

while:

```text
Exception Filter
 ↓
Handles exception after it has been thrown
 ↓
Produces response
```

Example:

```text
"abc"
 ↓
ParseIntPipe
 ↓
invalid
 ↓
throw BadRequestException
 ↓
Exception Layer
 ↓
Exception Filter
 ↓
400 response
```

So they work together:

```text
Pipe
  → detects/rejects problem

Exception Layer / Filter
  → handles the resulting exception
```

---

# 10. Core Pipe Contract

The central abstraction to remember is:

```typescript
PipeTransform
```

with:

```typescript
transform(value, metadata)
```

The pipe receives the value and can:

```text
return value
```

to continue processing,

or:

```text
return transformedValue
```

to modify the argument,

or:

```text
throw exception
```

to stop execution.

```text
                transform()
                    │
          ┌─────────┼─────────┐
          ↓         ↓         ↓
       return     return     throw
       same       changed    error
       value      value
          │         │         │
          ↓         ↓         ↓
       Handler   Handler    Exception
       executes  executes     Layer
```

### Essential mental model

> **A pipe is a pre-controller argument-processing mechanism: it transforms or validates the value destined for a controller method, and if it throws, the controller method is never executed.**

Next, the natural step is **built-in pipes**—especially `ParseIntPipe`, `ParseBoolPipe`, `ParseUUIDPipe`, `DefaultValuePipe`, `ParseArrayPipe`, `ParseEnumPipe`, and `ValidationPipe`—and how each one fits into this execution model.