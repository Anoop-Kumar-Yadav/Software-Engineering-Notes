# Custom Pipes

Custom pipes let you implement your own **transformation or validation logic** while following Nest's pipe contract.

The two important pieces are:

```text
@Injectable()
      +
PipeTransform
      ↓
transform(value, metadata)
```

---

## 1. Basic Custom Pipe

A pipe must implement `PipeTransform`:

```typescript
import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
} from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
```

This is currently an **identity pipe**:

```text
input
  ↓
transform()
  ↓
same input
  ↓
controller
```

It doesn't validate or transform anything yet. It simply demonstrates the required structure.

---

# 2. `PipeTransform<T, R>`

`PipeTransform` is a generic interface:

```typescript
PipeTransform<T, R>
```

where:

```text
T → input type
R → returned/transformed type
```

Conceptually:

```text
T
 ↓
transform()
 ↓
R
```

For example, a pipe that receives a string and returns a number could conceptually be:

```typescript
PipeTransform<string, number>
```

```text
"123" : string
     ↓
   pipe
     ↓
123 : number
```

The generic parameters describe the **type contract**; they don't perform runtime conversion themselves.

---

# 3. `transform()` — Mandatory Method

Every custom pipe must implement:

```typescript
transform(value, metadata)
```

because this is the contract defined by `PipeTransform`.

It receives two things:

```text
transform(
    value,
    metadata
)
   │       │
   │       └── information about the argument
   │
   └── actual argument value
```

---

# 4. `value`

`value` is the **current value being processed** before it reaches the controller method.

Example:

```typescript
@Get(':id')
findOne(
  @Param('id', MyPipe) id: number,
) {}
```

If the request is:

```http
GET /cats/42
```

the pipe processes the parameter value:

```text
"42"
  ↓
MyPipe.transform(value)
```

So:

```typescript
value === "42"
```

before the pipe transforms it.

If the pipe returns:

```typescript
return 42;
```

then the controller receives:

```typescript
id === 42
```

---

# 5. `metadata`

The second argument tells the pipe **what kind of controller argument it is processing and how that argument was declared**.

```typescript
transform(value, metadata)
```

`metadata` has:

```typescript
interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom';
  metatype?: Type<unknown>;
  data?: string;
  schema?: StandardSchemaV1;
}
```

So:

```text
metadata
├── type
├── metatype
├── data
└── schema
```

These fields provide information about the argument currently being processed.

---

# 6. `type`

`type` tells you **where the argument came from**.

Possible values:

```text
body
query
param
custom
```

### `@Body()`

```typescript
create(@Body() dto: CreateCatDto)
```

→

```text
metadata.type = "body"
```

### `@Query()`

```typescript
find(@Query('page') page: number)
```

→

```text
metadata.type = "query"
```

### `@Param()`

```typescript
findOne(@Param('id') id: string)
```

→

```text
metadata.type = "param"
```

### Custom decorator

A custom parameter decorator can produce:

```text
metadata.type = "custom"
```

So `type` essentially tells the pipe:

> **What category of controller argument am I processing?**

---

# 7. `metatype`

`metatype` contains the runtime type information associated with the parameter.

For example:

```typescript
findOne(
  @Param('id') id: string,
)
```

can provide:

```text
metatype → String
```

Similarly:

```typescript
create(
  @Body() dto: CreateCatDto,
)
```

can provide:

```text
metatype → CreateCatDto
```

This information is particularly important for validation and transformation pipes.

---

## TypeScript Runtime Limitation

TypeScript interfaces disappear during JavaScript transpilation.

For example:

```typescript
interface CreateCatDto {
  name: string;
}
```

At runtime, the interface does not exist.

Therefore:

```typescript
create(
  @Body() dto: CreateCatDto,
)
```

cannot provide the interface itself as runtime metadata.

The documented behavior is that `metatype` becomes:

```text
Object
```

instead.

A class can survive as a runtime value:

```typescript
class CreateCatDto {
  name: string;
}
```

so Nest can obtain its runtime constructor metadata.

This is one reason Nest's validation mechanisms commonly use **DTO classes rather than interfaces**.

---

# 8. `metatype` Can Also Be `undefined`

`metatype` is not guaranteed to exist.

It can be `undefined` when:

- the parameter has no type declaration
    
- you're using vanilla JavaScript
    

For example, without a useful TypeScript runtime type:

```typescript
findOne(@Param('id') id) {}
```

the pipe may receive:

```text
metadata.metatype === undefined
```

Therefore custom pipes should not blindly assume:

```typescript
metadata.metatype
```

always exists.

---

# 9. `data`

`data` represents the string passed to the parameter decorator.

Example:

```typescript
@Body('name')
```

produces conceptually:

```text
metadata.data = "name"
```

Likewise:

```typescript
@Param('id')
```

produces:

```text
metadata.data = "id"
```

Whereas:

```typescript
@Body()
```

has no specific property name:

```text
metadata.data = undefined
```

So:

```text
@Param('id')
       ↓
data = "id"

@Body('name')
       ↓
data = "name"

@Body()
       ↓
data = undefined
```

This lets a pipe know **which specific property/parameter** it is processing.

---

# 10. `schema`

The `schema` field contains a **Standard Schema-compatible schema** attached through parameter decorator options.

For example, conceptually:

```typescript
@Body({
  schema,
})
```

or:

```typescript
@Param('id', {
  schema,
})
```

can make the schema available through:

```typescript
metadata.schema
```

So:

```text
Parameter decorator
       ↓
schema attached
       ↓
ArgumentMetadata
       ↓
metadata.schema
       ↓
validation pipe
```

The built-in:

```typescript
StandardSchemaValidationPipe
```

uses this metadata field to perform validation against a Standard Schema-compatible schema.

---

# 11. Complete Metadata Picture

Suppose we have:

```typescript
@Get(':id')
findOne(
  @Param('id') id: string,
) {}
```

The pipe receives something conceptually like:

```typescript
{
  type: 'param',
  metatype: String,
  data: 'id',
}
```

So:

```text
                    ArgumentMetadata
                          │
              ┌───────────┼───────────┐
              ↓           ↓           ↓
            type       metatype      data
              │           │           │
           "param"      String       "id"
```

If a schema is attached, there can additionally be:

```text
schema
  ↓
Standard Schema-compatible schema
```

---

# 12. Why Metadata Matters

The pipe doesn't just receive:

```typescript
value
```

It also receives information about **where that value came from and how the controller declared it**.

That allows one pipe to behave differently depending on the argument.

For example:

```typescript
transform(value, metadata) {
  if (metadata.type === 'param') {
    // parameter-specific logic
  }

  if (metadata.type === 'query') {
    // query-specific logic
  }

  return value;
}
```

Conceptually:

```text
                  Pipe
                   │
             value + metadata
                   │
          ┌────────┼────────┐
          ↓        ↓        ↓
        param    query     body
          │        │        │
          ↓        ↓        ↓
       logic    logic     logic
```

---

# 13. Custom Pipe's Complete Contract

Keep the complete model together:

```typescript
@Injectable()
export class MyPipe implements PipeTransform {
  transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ) {
    // process value

    return value;
  }
}
```

There are three important requirements/concepts:

```text
@Injectable()
   ↓
Nest can manage the pipe

implements PipeTransform
   ↓
Pipe follows Nest's contract

transform(value, metadata)
   ↓
actual processing logic
```

And `transform()` has three possible outcomes:

```text
Input
  ↓
transform()
  │
  ├── return same value
  │       ↓
  │   controller
  │
  ├── return transformed value
  │       ↓
  │   controller receives new value
  │
  └── throw exception
          ↓
      Exceptions Layer
          ↓
      Controller not executed
```

---

## Key Revision Points

- **Custom pipe** = your own implementation of Nest's `PipeTransform`.
    
- `@Injectable()` allows the pipe to participate in Nest's DI/container system.
    
- `PipeTransform<T, R>`:
    
    - `T` → input type
        
    - `R` → return type
        
- Every pipe must implement `transform()`.
    
- `value` = current controller argument being processed.
    
- `metadata` = information describing that argument.
    
- `metadata.type` → `body`, `query`, `param`, or `custom`.
    
- `metadata.metatype` → runtime type such as `String`, `Number`, or a DTO class.
    
- Interfaces disappear at runtime; their `metatype` becomes `Object`.
    
- `metatype` may be `undefined`.
    
- `metadata.data` → decorator argument such as `'id'` in `@Param('id')`.
    
- `metadata.schema` → Standard Schema-compatible schema attached to the parameter.
    
- Returning a value passes it to the controller; throwing an exception prevents controller execution.
    
- `StandardSchemaValidationPipe` uses `metadata.schema` for Standard Schema-based validation.