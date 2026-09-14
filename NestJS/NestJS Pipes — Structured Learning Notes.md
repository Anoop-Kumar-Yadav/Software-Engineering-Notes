# NestJS Pipes — Structured Learning Notes

Pipes are a part of the NestJS request-processing system. They are used primarily to transform incoming data and validate whether that data satisfies the requirements of an application before the controller method executes.

The most important distinction to understand is that NestJS pipes are not a single-purpose feature. They support two closely related responsibilities:

1. Transformation: Convert an input into the type or format required by the application.
    
2. Validation: Check whether an input is acceptable according to defined rules and reject it if it is not.
    

The notes below organize the Pipes documentation into a logical learning sequence, keeping related concepts together rather than separating every small feature into an isolated topic.

## 1. What is a Pipe?

A pipe is a class that implements the `PipeTransform` interface and is decorated with `@Injectable()`. NestJS executes a pipe immediately before invoking a route handler or another method that receives processed arguments. The pipe can modify the incoming value, validate it, or throw an exception that prevents the handler from executing.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

### The two responsibilities of pipes

1. Transformation
    

Converts an input from its received form into the form the application expects.

Example: Convert the route parameter `"42"` into the number `42`.

2. Validation
    

Checks whether the input satisfies defined rules. If validation succeeds, the value is passed forward; otherwise, the pipe throws an exception.

Example: Ensure that a request body contains a valid URL-shortener record.

Important: A pipe is not middleware. Middleware generally processes a request without knowing which specific controller parameter will eventually be used. A pipe is designed to process the arguments for a particular handler and therefore has access to parameter metadata.

## 2. Where Pipes Execute in the Request Lifecycle

For an HTTP request, a simplified NestJS flow is:

1. Client sends request
    

Example: GET /urls/42

2. Guards and other request processing
    

Authorization and route processing

3. Pipes execute
    

Transform or validate handler arguments

4. Controller method executes
    

Only if all required pipes succeed

5. Service and response
    

Business logic and HTTP response

The essential rule is:

> If a pipe throws an exception, the controller method does not execute. The exception is handled by NestJS's exception layer. This makes pipes useful for rejecting invalid external input at the application boundary.
> 
> ![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)
> 
> NestJS - A progressive Node.js framework

### Example: URL shortener

Suppose the endpoint is:

http

```
GET /urls/42
```

The HTTP request supplies `42` as a string. The controller expects a number.

TypeScript

```
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  return this.urlsService.findOne(id);
}
```

The pipe processes the value before the method receives it.

|  
Stage

|

Value

|  
| --- | --- |  
|

Incoming route parameter

|

`"42"`

|  
|

After `ParseIntPipe`

|

`42`

|  
|

Controller argument

|

`id: number`

|  
|

Invalid input, such as `"abc"`

|

Exception; handler is not called

|

TypeScript's `id: number` annotation does not perform runtime conversion. The pipe performs the runtime processing.

## 3. Categorization of the Pipes Documentation

The Pipes chapter can be understood through five connected categories.

## Pipes

Common abstraction: transform or validate handler arguments

A. Fundamentals

PipeTransform, transform(), metadata, execution behavior

B. Built-in pipes

Parse values, apply defaults, validate common formats

C. Binding and scope

Parameter, method, controller, and global registration

D. Custom pipes

Implement transformation and validation logic

E. Object and schema validation

Zod, Standard Schema, class-validator, and the built-in ValidationPipe

The best learning order is to understand the pipe contract first, then learn how built-in pipes are attached to parameters, and only afterward study custom validation and global registration.

## 4. Pipe Fundamentals: The Core Contract

Before learning individual pipes, understand the interface every custom pipe follows.

### 4.1 `PipeTransform`

A pipe must implement the `PipeTransform` interface. Its central method is `transform()`, which receives the current argument value and metadata describing that argument.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

TypeScript

```
import {
  Injectable,
  ArgumentMetadata,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ExamplePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    return value;
  }
}
```

The pipe above does not change or validate anything. It simply returns the value it received.

### 4.2 The `transform()` method

TypeScript

```
transform(value: unknown, metadata: ArgumentMetadata) {
  // Process the incoming value
  return value;
}
```

|  
Parameter

|

Meaning

|  
| --- | --- |  
|

`value`

|

The actual argument being processed, such as a route ID, query value, or request body.

|  
|

`metadata`

|

Information about the argument, including its source, declared type, and parameter name.

|  
|

Return value

|

The value that will be passed to the next processing stage or the controller.

|  
|

Exception

|

Stops normal execution of the handler and enters NestJS exception handling.

|

A pipe can therefore implement either of these patterns:

TypeScript

```
// Transformation
transform(value: string) {
  return Number(value);
}
```

TypeScript

```
// Validation
transform(value: unknown) {
  if (!isValid(value)) {
    throw new BadRequestException('Invalid input');
  }

  return value;
}
```

The first changes the value. The second either returns the value or rejects it.

### 4.3 `PipeTransform<T, R>` generics

The interface can describe the input and output types:

TypeScript

```
export interface PipeTransform<T = any, R = any> {
  transform(value: T, metadata: ArgumentMetadata): R;
}
```

For example:

TypeScript

```
@Injectable()
export class StringToNumberPipe
  implements PipeTransform<string, number>
{
  transform(value: string): number {
    const result = Number(value);

    if (!Number.isInteger(result)) {
      throw new BadRequestException('An integer is required');
    }

    return result;
  }
}
```

Here:

- `T` is `string`, the input type.
    
- `R` is `number`, the return type.
    

These are TypeScript type declarations. The actual runtime conversion is performed by the implementation of `transform()`.

### 4.4 `ArgumentMetadata`

NestJS supplies metadata about the parameter being processed. The relevant properties are:

|  
Property

|

Meaning

|

Example

|  
| --- | --- | --- |  
|

`type`

|

Source of the argument

|

`'body'`, `'query'`, `'param'`, `'custom'`

|  
|

`metatype`

|

Runtime constructor associated with the declared type

|

`String`, `Number`, `CreateUrlDto`

|  
|

`data`

|

Name passed to the parameter decorator

|

`'id'` in `@Param('id')`

|  
|

`schema`

|

Standard Schema-compatible schema attached through parameter decorator options

|

A Zod-compatible schema

|

Example controller:

TypeScript

```
@Post()
create(@Body() body: CreateUrlDto) {
  return body;
}

@Get(':id')
findOne(@Param('id') id: string) {
  return id;
}
```

A pipe processing the body may receive metadata similar to:

TypeScript

```
{
  type: 'body',
  metatype: CreateUrlDto,
  data: undefined,
}
```

A pipe processing the route parameter may receive metadata similar to:

TypeScript

```
{
  type: 'param',
  metatype: String,
  data: 'id',
}
```

Important: TypeScript interfaces disappear during transpilation. If a DTO is declared as an interface rather than a class, its runtime `metatype` is generally `Object`. Also, JavaScript does not provide TypeScript runtime type metadata.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

## 5. Built-in Pipes: Ready-to-Use Processing

NestJS provides built-in pipes through `@nestjs/common`. These can be divided according to the kind of processing they perform.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

### 5.1 Categorization of built-in pipes

### A. Primitive transformation and parsing

Converts or parses simple incoming values.

- `ParseIntPipe`
    
- `ParseFloatPipe`
    
- `ParseBoolPipe`
    
- `ParseArrayPipe`
    

### B. Format and constraint validation

Checks whether values conform to a required format.

- `ParseUUIDPipe`
    
- `ParseEnumPipe`
    
- `ParseDatePipe`
    

### C. Default values

- `DefaultValuePipe`
    

### D. Object validation

- `ValidationPipe`
    
- `StandardSchemaValidationPipe`
    

### E. File processing and validation

- `ParseFilePipe`
    

### 5.2 Built-in pipes reference

|  
Pipe

|

Primary purpose

|

Typical use

|  
| --- | --- | --- |  
|

`ParseIntPipe`

|

Parse an integer

|

URL ID, pagination page

|  
|

`ParseFloatPipe`

|

Parse a floating-point number

|

Coordinates, prices

|  
|

`ParseBoolPipe`

|

Parse a boolean

|

Query filters such as `active=true`

|  
|

`ParseArrayPipe`

|

Parse and validate an array

|

Query arrays

|  
|

`ParseUUIDPipe`

|

Validate a UUID

|

Resource identifiers

|  
|

`ParseEnumPipe`

|

Validate an enum value

|

Sort order, status, visibility

|  
|

`ParseDatePipe`

|

Parse a date

|

Date query parameters

|  
|

`DefaultValuePipe`

|

Supply a fallback when input is absent

|

Default page size

|  
|

`ParseFilePipe`

|

Validate uploaded files

|

File type and size checks

|  
|

`ValidationPipe`

|

Validate DTOs using validation decorators

|

Request body validation

|  
|

`StandardSchemaValidationPipe`

|

Validate values against Standard Schema-compatible schemas

|

Schema-driven request validation

|

The `Parse*` family is primarily used for individual values. `ValidationPipe` and `StandardSchemaValidationPipe` are more appropriate for validating structured input against rules or schemas.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

## 6. Binding Pipes: Where and How They Are Attached

Binding means associating a pipe with a parameter, method, controller, or the whole application so NestJS knows when to execute it.

There are four important scopes:

1. Parameter-scoped
    

Most specific

Applies to one particular parameter.

2. Method-scoped
    

Applies to the parameters processed for one route handler.

3. Controller-scoped
    

Applies to handlers within one controller.

4. Global-scoped
    

Broadest

Applies across the application, subject to the application type and registration mechanism.

The scope determines where a pipe is applied. It does not change the fundamental purpose of the pipe.

### 6.1 Parameter-scoped binding

Use a pipe directly with a parameter decorator such as `@Param()`, `@Query()`, or `@Body()`.

TypeScript

```
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

@Controller('urls')
export class UrlsController {
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      id,
      message: 'The ID has been parsed',
    };
  }
}
```

For a request to `GET /urls/42`, the controller receives the number `42`. For `GET /urls/abc`, the pipe throws an error before `findOne()` runs.

#### Using an instance instead of a class

TypeScript

```
@Get(':id')
async findOne(
  @Param(
    'id',
    new ParseIntPipe({
      errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
    }),
  )
  id: number,
) {
  return this.urlsService.findOne(id);
}
```

There are two forms:

|  
Binding form

|

Example

|

When to use

|  
| --- | --- | --- |  
|

Pipe class

|

`ParseIntPipe`

|

Default behavior; NestJS creates the instance

|  
|

Pipe instance

|

`new ParseIntPipe(options)`

|

When you need custom configuration

|

Passing the class allows NestJS to instantiate it and resolve dependencies through its container. Passing an instance is useful when supplying constructor options.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

### 6.2 Binding a pipe to a query parameter

TypeScript

```
@Get()
async findAll(
  @Query('page', ParseIntPipe) page: number,
) {
  return this.urlsService.findAll(page);
}
```

Request:

http

```
GET /urls?page=2
```

The query value arrives from HTTP as text, and the pipe converts it to the integer `2`.

### 6.3 Method-scoped binding with `@UsePipes()`

Use `@UsePipes()` when a pipe should apply to a route handler rather than just one parameter.

TypeScript

```
import {
  Body,
  Controller,
  Post,
  UsePipes,
} from '@nestjs/common';

@Controller('urls')
export class UrlsController {
  @Post()
  @UsePipes(MyCustomPipe)
  create(@Body() body: CreateUrlDto) {
    return this.urlsService.create(body);
  }
}
```

The pipe is applied when the `create()` handler's arguments are processed.

`@UsePipes()` accepts a pipe class or an instance. A method-level pipe is useful when the processing logic belongs to one specific endpoint.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

### 6.4 Controller-scoped binding

Use `@UsePipes()` on the controller class to apply the pipe to its handlers.

TypeScript

```
@Controller('urls')
@UsePipes(MyCustomPipe)
export class UrlsController {
  @Post()
  create(@Body() body: CreateUrlDto) {
    return this.urlsService.create(body);
  }

  @Get()
  findAll() {
    return this.urlsService.findAll();
  }
}
```

This is useful when several endpoints in the same controller share a processing rule.

### 6.5 Global-scoped binding

Register a pipe globally using `useGlobalPipes()`:

TypeScript

```
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```

This makes the pipe available across the application's controllers and route handlers.

Dependency injection distinction: A pipe registered outside a module with `app.useGlobalPipes()` cannot inject dependencies from the NestJS module container in the usual way. If the pipe needs injected services, register it as an `APP_PIPE` provider inside a module.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

TypeScript

```
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

This provider is global, even though it is declared inside a particular module. The module is simply where the provider registration is configured.

## 7. Custom Pipes: Build Your Own Processing Logic

The built-in pipes cover common use cases, but a backend application may need domain-specific processing. For example, a URL shortener may require a pipe that validates a custom short-code format or normalizes a value before the controller receives it.

The general process is:

1. Define a class.
    
2. Implement `PipeTransform`.
    
3. Implement the `transform()` method.
    
4. Return the transformed value or throw an exception.
    
5. Bind the pipe to the appropriate scope.
    

### Example: Custom positive integer pipe

TypeScript

```
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class PositiveIntPipe
  implements PipeTransform<string, number>
{
  transform(
    value: string,
    metadata: ArgumentMetadata,
  ): number {
    const parsedValue = Number(value);

    if (
      !Number.isInteger(parsedValue) ||
      parsedValue <= 0
    ) {
      throw new BadRequestException(
        'A positive integer is required',
      );
    }

    return parsedValue;
  }
}
```

Use it in a controller:

TypeScript

```
import { Controller, Get, Param } from '@nestjs/common';
import { PositiveIntPipe } from './positive-int.pipe';

@Controller('urls')
export class UrlsController {
  @Get(':id')
  findOne(
    @Param('id', PositiveIntPipe) id: number,
  ) {
    return {
      id,
      message: 'Valid URL ID',
    };
  }
}
```

### Execution examples

|  
Request

|

Result

|  
| --- | --- |  
|

`/urls/10`

|

`id` becomes `10`

|  
|

`/urls/1`

|

`id` becomes `1`

|  
|

`/urls/0`

|

`400 Bad Request`

|  
|

`/urls/-5`

|

`400 Bad Request`

|  
|

`/urls/abc`

|

`400 Bad Request`

|  
|

`/urls/2.5`

|

`400 Bad Request`

|

This example demonstrates both responsibilities: the pipe validates the input and transforms the valid string into a number.

## 8. Object Validation: Why Pipes Are Needed

Primitive parsing is only one part of request processing. Most backend APIs receive structured objects, especially in request bodies.

Consider a URL creation endpoint:

TypeScript

```
@Post()
async create(@Body() createUrlDto: CreateUrlDto) {
  return this.urlsService.create(createUrlDto);
}
```

Suppose the DTO is:

TypeScript

```
export class CreateUrlDto {
  originalUrl: string;
  customCode?: string;
}
```

The application may require that:

- `originalUrl` is a valid URL.
    
- `customCode`, if provided, follows a permitted format.
    
- The input does not contain invalid or unexpected fields, depending on the configured validation policy.
    

Where should these checks happen?

|  
Approach

|

Problem or limitation

|  
| --- | --- |  
|

Validate inside the controller

|

Mixes input validation with controller orchestration.

|  
|

Call a validator manually

|

Every endpoint must remember to invoke it.

|  
|

Use generic middleware

|

Middleware does not naturally know the specific handler parameter or its context.

|  
|

Use a pipe

|

Designed to process arguments immediately before the handler and can be reused across endpoints.

|

Conclusion: Pipes provide a natural boundary for request-argument validation. The controller can then focus on coordinating the application rather than manually checking every field.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

## 9. Schema-Based Validation

Schema-based validation means defining a schema that describes the expected structure and rules of an input, then using a validation pipe to process the input against that schema.

The chapter's Zod example follows this pattern:

### Request body

Unknown external input

### Zod schema

Defines fields and validation rules

### ZodValidationPipe

Calls schema.parse(value)

Valid

Return parsed value

Invalid

Throw an exception

### 9.1 Define the schema

Install Zod:

Bash

```
npm install zod
```

Create a schema for URL creation:

TypeScript

```
import { z } from 'zod';

export const createUrlSchema = z.object({
  originalUrl: z.url(),
  customCode: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});

export type CreateUrlDto = z.infer<
  typeof createUrlSchema
>;
```

The schema defines the validation rules. `z.infer` derives the corresponding TypeScript type from the schema.

### 9.2 Create the validation pipe

TypeScript

```
import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe
  implements PipeTransform
{
  constructor(private readonly schema: ZodSchema) {}

  transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ) {
    try {
      return this.schema.parse(value);
    } catch {
      throw new BadRequestException(
        'Validation failed',
      );
    }
  }
}
```

The pipe performs the following operations:

1. Receives the incoming argument.
    
2. Passes the value to `schema.parse()`.
    
3. Returns the parsed result when validation succeeds.
    
4. Throws `BadRequestException` when validation fails.
    

Returning the parsed result is useful because schema libraries may normalize, coerce, or otherwise produce a processed value.

### 9.3 Bind the pipe to the route

TypeScript

```
import {
  Body,
  Controller,
  Post,
  UsePipes,
} from '@nestjs/common';

@Controller('urls')
export class UrlsController {
  @Post()
  @UsePipes(
    new ZodValidationPipe(createUrlSchema),
  )
  create(@Body() body: CreateUrlDto) {
    return this.urlsService.create(body);
  }
}
```

The schema is passed to the pipe through its constructor. The pipe instance is then attached to the route with `@UsePipes()`.

Key concept: The schema defines what is valid. The pipe defines how that schema is applied to a NestJS handler argument.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

### 9.4 Parameter-level schema validation

A schema pipe can also be attached directly to a body parameter:

TypeScript

```
@Put(':id')
async update(
  @Param('id', ParseIntPipe) id: number,
  @Body(new ZodValidationPipe(createUrlSchema))
  body: CreateUrlDto,
) {
  return this.urlsService.update(id, body);
}
```

This combines two different processing requirements:

- `ParseIntPipe` validates and converts the route ID.
    
- `ZodValidationPipe` validates the request body against the URL schema.
    

The pipes process the arguments relevant to their respective decorators.

## 10. Standard Schema Validation

NestJS also provides `StandardSchemaValidationPipe`, which uses a Standard Schema-compatible schema attached to parameter metadata. This allows a compatible schema library to validate request arguments through NestJS's pipe system.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

The important conceptual difference is:

|  
Custom Zod pipe

|

Standard Schema validation pipe

|  
| --- | --- |  
|

You explicitly construct a pipe with a schema.

|

The pipe reads schema metadata associated with the parameter.

|  
|

The pipe calls the schema's parsing or validation method.

|

The built-in pipe uses the Standard Schema contract.

|  
|

You control the pipe implementation and error mapping.

|

NestJS provides the pipe implementation for supported schemas.

|

The Standard Schema approach is useful when you want schema validation to be attached directly to parameter decorators rather than manually constructing a separate validation pipe for every schema.

## 11. Class-Based Validation with `class-validator`

The Pipes documentation also explains validation using decorators on DTO classes. This approach uses:

- `class-validator` — Defines validation rules through decorators.
    
- `class-transformer` — Converts a plain JavaScript object into an instance of a DTO class.
    

Install the packages:

Bash

```
npm install class-validator class-transformer
```

### 11.1 Define a DTO with decorators

TypeScript

```
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';

export class CreateUrlDto {
  @IsUrl()
  originalUrl: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  customCode?: string;
}
```

The DTO class now contains both the shape and the validation rules.

### 11.2 How class-based validation works

A simplified custom validation pipe would perform these operations:

1. Receive the plain request body.
    
2. Read the DTO class from `ArgumentMetadata.metatype`.
    
3. Convert the plain object into a DTO instance using `plainToInstance()`.
    
4. Run `validate()` from `class-validator`.
    
5. Return the value if there are no validation errors.
    
6. Throw `BadRequestException` if validation errors exist.
    

The reason for converting the object is that incoming JSON data is a plain JavaScript object. It does not automatically become an instance of the DTO class or acquire the class's decorator metadata through ordinary JSON deserialization.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

### 11.3 Why `metatype` matters

A generic class-based validation pipe can inspect the runtime type:

TypeScript

```
transform(value: unknown, { metatype }: ArgumentMetadata) {
  // Decide whether this argument should be validated.
}
```

A typical implementation skips primitive JavaScript types such as:

TypeScript

```
const primitiveTypes = [
  String,
  Boolean,
  Number,
  Array,
  Object,
];
```

It then uses the DTO class for transformation and validation.

Practical distinction: Class-based validation uses decorators placed on a class, while schema-based validation uses an explicitly defined schema. Both can be integrated into NestJS through pipes.

## 12. The Built-in `ValidationPipe`

You do not normally need to implement a generic class-validator pipe yourself. NestJS already provides `ValidationPipe`, which supports class-validator-based validation and additional configuration options.

![](https://www.google.com/s2/favicons?domain=https://docs.nestjs.com&sz=32)

NestJS - A progressive Node.js framework

### Parameter-scoped usage

TypeScript

```
import {
  Body,
  Controller,
  Post,
  ValidationPipe,
} from '@nestjs/common';

@Controller('urls')
export class UrlsController {
  @Post()
  create(
    @Body(new ValidationPipe())
    body: CreateUrlDto,
  ) {
    return this.urlsService.create(body);
  }
}
```

This applies validation specifically to the body parameter of the `create()` handler.

### Global usage

TypeScript

```
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe(),
  );

  await app.listen(3000);
}

bootstrap();
```

This is useful when many endpoints across the application use DTOs decorated with class-validator rules.

### Should validation be registered globally or locally?

|  
Situation

|

Recommended approach

|  
| --- | --- |  
|

Most request DTOs throughout the application need validation

|

Register `ValidationPipe` globally.

|  
|

One parameter needs a special schema or custom rule

|

Use a parameter-scoped pipe.

|  
|

One route requires a specific validation strategy

|

Use `@UsePipes()` at method scope.

|  
|

Multiple routes in one controller share a rule

|

Use controller-scoped binding.

|  
|

A pipe requires injected services

|

Register it through a module provider, such as `APP_PIPE`, if it is global.

|

A global `ValidationPipe` is not a replacement for every custom pipe. You can use it globally for DTO validation while using specialized pipes for route IDs, enums, UUIDs, or custom formats.

## 13. Important Distinctions to Remember

### Pipe vs middleware

|  
Middleware

|

Pipe

|  
| --- | --- |  
|

Processes an incoming request or response flow.

|

Processes arguments before a handler executes.

|  
|

Generally does not know the final handler's parameter context.

|

Receives `ArgumentMetadata`.

|  
|

Commonly used for logging, request IDs, and request-level processing.

|

Commonly used for parsing and validating route, query, and body arguments.

|  
|

Calls `next()` to continue the middleware chain.

|

Returns a value or throws an exception.

|

### Transformation vs validation

|  
Transformation

|

Validation

|  
| --- | --- |  
|

Changes the representation or type of the input.

|

Checks whether the input satisfies rules.

|  
|

Example: `"42"` → `42`.

|

Example: `"abc"` is not a valid integer.

|  
|

May return a different value.

|

Commonly returns the same or parsed value, or throws.

|  
|

`ParseIntPipe` is a typical example.

|

`ValidationPipe` and schema validation are typical examples.

|

A pipe may perform both operations. For example, a custom positive integer pipe validates that the input is a positive integer and then returns it as a number.

## 14. Recommended Learning Sequence

To learn the complete Pipes topic without mixing unrelated concepts, follow this order:

## Pipes study roadmap

1. Pipe fundamentals
    
    `PipeTransform`, `transform()`, return values, exceptions, and `ArgumentMetadata`.
    
2. Transformation pipes
    
    Understand `ParseIntPipe`, `ParseFloatPipe`, `ParseBoolPipe`, and how HTTP strings become useful application values.
    
3. Binding pipes
    
    Learn parameter-scoped, method-scoped, controller-scoped, and global-scoped registration.
    
4. Custom transformation pipes
    
    Implement a pipe from scratch and understand how NestJS invokes it.
    
5. Validation concepts
    
    Understand why validation belongs at the request boundary and how pipes prevent invalid data from reaching the handler.
    
6. Schema-based validation
    
    Implement a reusable Zod validation pipe and bind it to a URL-shortener endpoint.
    
7. Class-based validation
    
    Learn DTO decorators, `class-validator`, `class-transformer`, and the built-in `ValidationPipe`.
    
8. Global validation architecture
    
    Understand global configuration, `APP_PIPE`, dependency injection, and how global and local pipes work together.
    

## Final mental model

A pipe is a handler-argument processing component. It receives a value and metadata, performs a transformation or validation, and then either returns a value for the handler or throws an exception to stop execution.

For backend development, remember the responsibilities in this order:

HTTP input → Pipe processing → Validated/transformed arguments → Controller → Service → Database.

The official source for this topic is NestJS Pipes documentation .