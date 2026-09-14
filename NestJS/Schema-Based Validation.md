# Schema-Based Validation

Schema-based validation means validating an incoming request value against a defined structure and set of rules, called a schema, before the controller method executes.

In this section, the focus is the body received by the `create()` method.

TypeScript

```
@Post()
async create(
  @Body() createCatDto: CreateCatDto,
) {
  this.catsService.create(createCatDto);
}
```

The incoming body should contain valid values for:

TypeScript

```
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

The intended validation requirement is:

```
Request Body
    ↓
Validate name
    ↓
Validate age
    ↓
Validate breed
    ↓
Valid DTO
    ↓
Controller
```

If any required rule fails:

```
Request Body
    ↓
Validation Pipe
    ↓
Invalid
    ↓
Exception
    ↓
Controller is not executed
```

## 1. Why Not Validate Inside the Controller?

One possible implementation would be:

TypeScript

```
@Post()
async create(
  @Body() createCatDto: CreateCatDto,
) {
  if (!createCatDto.name) {
    throw new BadRequestException(
      'Name is required',
    );
  }

  if (!createCatDto.age) {
    throw new BadRequestException(
      'Age is required',
    );
  }

  if (!createCatDto.breed) {
    throw new BadRequestException(
      'Breed is required',
    );
  }

  this.catsService.create(createCatDto);
}
```

Although this can work, it mixes two responsibilities:

```
Controller
├── HTTP request handling
└── Input validation
```

The controller should primarily coordinate the request and delegate the actual application operation.

Putting detailed validation logic inside every route handler can cause:

- repeated validation code
    
- large controller methods
    
- inconsistent validation rules
    
- difficult maintenance
    
- reduced reusability
    
- violation of the Single Responsibility Principle
    

The controller should not need to know every validation rule for every DTO.

## 2. Why Not Use a Separate Validator Class?

Another approach is to create a validator:

TypeScript

```
export class CreateCatValidator {
  validate(dto: CreateCatDto): void {
    // validation logic
  }
}
```

Then the controller must remember to call it:

TypeScript

```
@Post()
async create(
  @Body() createCatDto: CreateCatDto,
) {
  this.createCatValidator.validate(createCatDto);

  this.catsService.create(createCatDto);
}
```

This separates the validation logic, but the controller still has to manually invoke the validator.

Every route handler must remember:

```
Receive input
    ↓
Call validator
    ↓
Call service
```

This creates a risk that a developer may forget to call the validator in one route.

A pipe removes this manual step because Nest automatically executes the pipe during argument processing.

## 3. Why Middleware Is Not Ideal for Generic Validation

Middleware executes before the route handler is selected.

Its general position is:

```
HTTP Request
     ↓
Middleware
     ↓
Route selection
     ↓
Controller
```

Middleware has access to the request and response objects, but it does not naturally know:

- which controller handler will execute
    
- which parameter is being processed
    
- which DTO type is expected
    
- which validation rules belong to that handler
    
- whether the input is a body, query parameter, or route parameter
    

For example, the same middleware may run for multiple routes:

```
POST /cats
POST /users
POST /orders
GET  /cats/:id
GET  /users/:id
```

But each route may expect a different input structure.

```
POST /cats
    → CreateCatDto

POST /users
    → CreateUserDto

POST /orders
    → CreateOrderDto
```

A generic middleware does not inherently receive the controller parameter metadata required to choose the correct validation rules.

# 4. Why Pipes Are the Correct Mechanism

Pipes execute when Nest is preparing the arguments for a particular controller method.

The complete flow is:

```
HTTP Request
     ↓
Middleware
     ↓
Route matching
     ↓
Guards
     ↓
Interceptors
     ↓
Argument resolution
     ↓
Pipe
     ↓
Controller method
```

At the pipe stage, Nest knows the argument being processed.

The pipe can receive:

- the actual value
    
- the argument type
    
- the argument source
    
- the parameter name
    
- attached schema metadata
    

Therefore, a pipe can validate the exact value intended for the exact controller argument.

```
Controller Handler
       │
       ├── @Body() createCatDto
       │          ↓
       │       Body Pipe
       │
       ├── @Param('id') id
       │          ↓
       │       ID Pipe
       │
       └── @Query('page') page
                  ↓
               Page Pipe
```

This is more precise than generic middleware.

# 5. Schema-Based Validation Flow

For the `CreateCatDto` example:

TypeScript

```
@Post()
async create(
  @Body() createCatDto: CreateCatDto,
) {
  this.catsService.create(createCatDto);
}
```

The desired processing is:

```
Incoming JSON Body
        ↓
CreateCat schema
        ↓
Validate:
  - name
  - age
  - breed
        ↓
Valid?
   ┌────┴────┐
   ↓         ↓
  YES        NO
   ↓         ↓
Return       Throw exception
validated    ↓
value        Exceptions Layer
   ↓
Controller
```

The pipe acts as the boundary between:

```
untrusted external input
```

and:

```
validated controller input
```

# 6. What Is a Schema?

A schema is a formal description of the expected structure and rules for a value.

For the cat creation body, the schema may describe:

```
Object
├── name
│    └── must be a string
│
├── age
│    └── must be a number
│
└── breed
     └── must be a string
```

A more detailed schema could also specify:

```
name
 ├── required
 ├── string
 └── non-empty

age
 ├── required
 ├── number
 └── positive

breed
 ├── required
 └── string
```

The schema describes the rules. The pipe is responsible for applying those rules to the incoming value.

```
Schema
  ↓
Validation rules

Pipe
  ↓
Executes validation against the value
```

# 7. The Role of `StandardSchemaValidationPipe`

Nest provides:

TypeScript

```
StandardSchemaValidationPipe
```

This pipe reads the schema attached to the controller parameter's metadata.

The relationship is:

```
Parameter Decorator
       ↓
schema option
       ↓
ArgumentMetadata.schema
       ↓
StandardSchemaValidationPipe
       ↓
Schema validation
```

The important distinction is:

- the schema defines the validation rules
    
- the pipe executes the validation process
    
- the controller receives the value only after successful processing
    

# 8. Schema Metadata

The `ArgumentMetadata` object can contain:

TypeScript

```
export interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom';
  metatype?: Type<unknown>;
  data?: string;
  schema?: StandardSchemaV1;
}
```

For schema-based validation, the relevant property is:

TypeScript

```
metadata.schema
```

This field contains the Standard Schema-compatible schema attached to the parameter.

For example, conceptually:

TypeScript

```
@Body({
  schema: createCatSchema,
})
```

or:

TypeScript

```
@Param('id', {
  schema: idSchema,
})
```

allows the schema to be associated with that particular argument.

Then the pipe can inspect:

TypeScript

```
metadata.schema
```

and validate:

TypeScript

```
value
```

against it.

# 9. Why This Is Better Than Generic Middleware

The difference is the available context.

|  
Middleware

|

Pipe

|  
| --- | --- |  
|

Runs before route selection

|

Runs while controller arguments are being prepared

|  
|

Primarily works with request/response/next

|

Works with the actual argument value

|  
|

Does not naturally know the target handler's parameters

|

Receives argument metadata

|  
|

Generic request-level processing

|

Argument-specific processing

|  
|

Not naturally aware of DTO/schema expectations

|

Can use DTO or schema metadata

|  
|

Can run for many unrelated routes

|

Can be bound to a specific argument, method, controller, or application

|

The core reason is:

> Pipes are executed at the point where Nest knows which controller argument is being prepared.

# 10. Validation Failure Behavior

If the schema validation fails, the pipe throws an exception.

```
Invalid request body
       ↓
StandardSchemaValidationPipe
       ↓
Validation failure
       ↓
Exception thrown
       ↓
Nest Exceptions Layer
       ↓
Exception Filter
       ↓
Error response
```

The controller does not execute:

TypeScript

```
this.catsService.create(createCatDto);
```

This prevents invalid input from reaching the service layer.

# 11. Main Principle

The complete architectural reasoning is:

```
Controller validation
    ↓
Violates separation of responsibilities
    ↓
Validator class
    ↓
Requires manual invocation
    ↓
Generic middleware
    ↓
Does not know handler argument metadata
    ↓
Pipe
    ↓
Runs for the exact controller argument
    ↓
Can use metadata/schema
    ↓
Validates before handler execution
```

## Key revision points

- Schema-based validation checks incoming data against a predefined schema.
    
- A DTO describes the intended structure, but a type declaration alone does not automatically validate runtime input.
    
- Validation inside controllers mixes HTTP handling with validation logic.
    
- A separate validator class improves separation but requires every handler to call it manually.
    
- Middleware is not ideal for generic DTO validation because it does not naturally know the target handler and its parameters.
    
- Pipes execute during controller argument processing.
    
- Pipes receive both the argument value and `ArgumentMetadata`.
    
- `metadata.schema` contains an attached Standard Schema-compatible schema.
    
- `StandardSchemaValidationPipe` uses that schema metadata for validation.
    
- If validation fails, the pipe throws an exception.
    
- The exception enters Nest's exceptions layer.
    
- The controller method is not executed when the pipe throws.
    
- Pipes provide a clean validation boundary between external input and application logic.