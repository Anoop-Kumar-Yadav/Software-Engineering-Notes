# Built-in Pipes

NestJS provides several pipes out of the box through:

```typescript
@nestjs/common
```

### Available built-in pipes

```text
ValidationPipe
StandardSchemaValidationPipe

ParseIntPipe
ParseFloatPipe
ParseBoolPipe
ParseArrayPipe
ParseUUIDPipe
ParseEnumPipe
ParseDatePipe

DefaultValuePipe
ParseFilePipe
```

The most useful way to understand them is by separating **transformation/parsing pipes** from **validation/defaulting pipes**.

---

## 1. `Parse*` Pipes

The `Parse*` family primarily performs **transformation + validation**.

```text
Incoming value
      ↓
Parse* Pipe
      │
      ├── valid → transformed value
      │
      └── invalid → exception
```

Examples:

|Pipe|Purpose|
|---|---|
|`ParseIntPipe`|String → integer|
|`ParseFloatPipe`|String → floating-point number|
|`ParseBoolPipe`|String → boolean|
|`ParseArrayPipe`|Parse/validate array input|
|`ParseUUIDPipe`|Validate UUID string|
|`ParseEnumPipe`|Validate enum value|
|`ParseDatePipe`|Parse/validate date input|

These can be used with:

- route parameters
    
- query parameters
    
- request body values
    

---

# 2. `ParseIntPipe`

This is the simplest example of a transformation pipe.

Suppose:

```typescript
@Get(':id')
async findOne(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.catsService.findOne(id);
}
```

Request:

```http
GET /cats/42
```

The route parameter initially comes from HTTP as a string:

```text
"42"
```

The pipe processes it:

```text
"42"
 ↓
ParseIntPipe
 ↓
42
 ↓
findOne(id)
```

So the controller receives:

```typescript
id === 42
```

rather than:

```typescript
id === "42"
```

---

## 3. Invalid Input

Suppose:

```http
GET /cats/abc
```

Then:

```text
"abc"
 ↓
ParseIntPipe
 ↓
cannot parse as integer
 ↓
exception
```

Nest returns:

```json
{
  "statusCode": 400,
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request"
}
```

Most importantly:

```typescript
findOne(...)
```

**does not execute**.

So the guarantee provided by the pipe is:

```text
findOne(id)
     ↓
id is a valid integer
```

or the request is rejected before the method executes.

---

# 4. Passing the Pipe Class

Notice:

```typescript
@Param('id', ParseIntPipe)
```

not:

```typescript
@Param('id', new ParseIntPipe())
```

When you pass:

```typescript
ParseIntPipe
```

you give Nest the **class**.

Nest is responsible for creating/managing the instance.

```text
ParseIntPipe
     ↓
Nest DI / framework
     ↓
Pipe instance
     ↓
transform()
```

This is the preferred approach when you don't need custom configuration.

---

# 5. Passing a Pipe Instance

You can instead create the instance yourself:

```typescript
@Param(
  'id',
  new ParseIntPipe({
    errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
  }),
)
id: number
```

Here:

```text
new ParseIntPipe(options)
        ↓
customized pipe instance
        ↓
Nest uses it
```

This is useful when you need to configure the pipe.

For example:

```typescript
{
  errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE
}
```

changes the HTTP status used when parsing fails.

So:

```text
ParseIntPipe
     ↓
default configuration
```

versus:

```text
new ParseIntPipe(options)
     ↓
custom configuration
```

---

# 6. Parameter-Level Binding

This:

```typescript
@Get(':id')
async findOne(
  @Param('id', ParseIntPipe) id: number,
) {}
```

is **parameter-level pipe binding**.

The pipe is associated specifically with:

```typescript
@Param('id')
```

not with the whole method.

Conceptually:

```text
findOne(
    @Param('id', ParseIntPipe) id,
    @Query(...) other
)
       │
       ↓
ParseIntPipe applies to `id`
```

This is useful when only a particular argument needs transformation or validation.

---

# 7. Query Parameters

The same pipes can process query parameters.

```typescript
@Get()
async findOne(
  @Query('id', ParseIntPipe) id: number,
) {
  return this.catsService.findOne(id);
}
```

Request:

```http
GET /cats?id=42
```

Flow:

```text
query.id
   ↓
"42"
   ↓
ParseIntPipe
   ↓
42
   ↓
findOne(42)
```

Again, HTTP query values arrive as strings, so the pipe provides the conversion.

---

# 8. `ParseUUIDPipe`

`ParseUUIDPipe` validates that the incoming value is a valid UUID.

```typescript
@Get(':uuid')
async findOne(
  @Param('uuid', new ParseUUIDPipe())
  uuid: string,
) {
  return this.catsService.findOne(uuid);
}
```

Flow:

```text
UUID string
    ↓
ParseUUIDPipe
    │
    ├── valid UUID → controller
    │
    └── invalid    → exception
```

By default, the documentation example covers UUID versions:

```text
v3
v4
v5
```

If your application requires a specific UUID version, you can provide the version through the pipe's options.

---

# 9. Parse Pipes Follow the Same Pattern

Once `ParseIntPipe` is understood, the other `Parse*` pipes follow the same basic model:

```text
Request value
      ↓
Parse* Pipe
      │
      ├── valid
      │     ↓
      │ transformed/validated value
      │     ↓
      │ Controller
      │
      └── invalid
            ↓
         Exception
            ↓
      Exceptions Layer
```

Examples:

```typescript
@Param('id', ParseIntPipe)
```

```typescript
@Query('price', ParseFloatPipe)
```

```typescript
@Param('active', ParseBoolPipe)
```

```typescript
@Param('uuid', ParseUUIDPipe)
```

```typescript
@Query('status', ParseEnumPipe)
```

The exact accepted input and resulting value depend on the particular pipe.

---

# 10. `ValidationPipe` Is Different

Do not treat `ValidationPipe` as just another `Parse*` pipe.

The `Parse*` pipes are generally focused on **specific values and representations**:

```text
"42" → 42
"true" → true
UUID → validated UUID
```

Whereas `ValidationPipe` is designed for **object/DTO validation**.

Typical flow:

```text
Request Body
     ↓
DTO
     ↓
ValidationPipe
     ↓
Validate DTO properties
     ↓
Controller
```

Example:

```typescript
@Post()
create(
  @Body(new ValidationPipe())
  createCatDto: CreateCatDto,
) {}
```

`ValidationPipe` is therefore particularly important when validating structured request bodies.

---

# 11. `StandardSchemaValidationPipe`

Nest also provides:

```typescript
StandardSchemaValidationPipe
```

This is another validation-oriented pipe and is separate from the traditional `ValidationPipe`.

Keep the distinction at this level for now:

```text
ValidationPipe
       ↓
Nest's established DTO validation mechanism

StandardSchemaValidationPipe
       ↓
Standard Schema-based validation
```

---

# 12. `DefaultValuePipe`

`DefaultValuePipe` is used when an incoming value may be absent and you want to provide a default.

Conceptually:

```text
Input
  ↓
DefaultValuePipe
  │
  ├── value exists → use value
  │
  └── value missing → use default
```

It is particularly useful when combined with another pipe.

For example, conceptually:

```text
missing query parameter
       ↓
DefaultValuePipe
       ↓
default value
       ↓
ParseIntPipe
       ↓
integer
```

This combination is important because it allows you to establish a value **before subsequent transformation/validation**.

---

# 13. `ParseFilePipe`

`ParseFilePipe` is intended for processing uploaded files.

Its responsibility belongs to the request's file input rather than ordinary route/query primitive values.

So keep it conceptually separate:

```text
Normal data
   → ParseIntPipe
   → ParseBoolPipe
   → ParseUUIDPipe
   → ...

File upload
   → ParseFilePipe
```

---

# 14. The Most Important Mental Model

For built-in pipes, remember this execution model:

```text
HTTP Request
     ↓
Route matched
     ↓
Arguments resolved
     ↓
Pipe
     ↓
┌─────────────────────┐
│                     │
│ Valid / transform   │
│        OR           │
│ Throw exception     │
│                     │
└─────────────────────┘
     ↓
Controller Method
```

If the pipe returns:

```typescript
return transformedValue;
```

the controller receives that value.

If the pipe throws:

```typescript
throw new BadRequestException();
```

the controller **never executes**.

---

## Quick Revision Table

|Pipe|Primary purpose|
|---|---|
|`ValidationPipe`|Validate structured input/DTOs|
|`StandardSchemaValidationPipe`|Standard Schema validation|
|`ParseIntPipe`|Convert/validate integer|
|`ParseFloatPipe`|Convert/validate float|
|`ParseBoolPipe`|Convert/validate boolean|
|`ParseArrayPipe`|Parse/validate arrays|
|`ParseUUIDPipe`|Validate/parse UUID|
|`ParseEnumPipe`|Validate enum values|
|`ParseDatePipe`|Parse/validate dates|
|`DefaultValuePipe`|Supply missing/default value|
|`ParseFilePipe`|Validate/process uploaded files|

### One rule to retain

> **Built-in pipes are pre-controller argument processors. `Parse*` pipes typically transform and validate specific values; `ValidationPipe` handles broader structured validation; `DefaultValuePipe` supplies missing values.**