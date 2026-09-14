# Practical Step 7: Understand `transform` in `ValidationPipe`

We have already enabled:

TypeScript

```
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
);
```

Now we will focus on one remaining option:

TypeScript

```
transform: true
```

This option affects how NestJS handles incoming request data before passing it to your controller.

## 1. The problem: HTTP data arrives as plain JavaScript objects

Consider this request:

http

```
POST /urls
Content-Type: application/json
```

JSON

```
{
  "originalUrl": "https://example.com"
}
```

After JSON parsing, the request body is a normal JavaScript object:

TypeScript

```
{
  originalUrl: 'https://example.com',
}
```

It is not automatically an instance of your DTO class.

For example, conceptually:

TypeScript

```
const body = {
  originalUrl: 'https://example.com',
};
```

This object is simply a plain object.

It is not necessarily equivalent to:

TypeScript

```
const body = new CreateUrlDto();
body.originalUrl = 'https://example.com';
```

This distinction matters because DTOs are classes, and class-based validation and transformation may require the incoming data to be treated as an instance of the appropriate class.

# 2. Enable transformation

Update `main.ts`:

TypeScript

```
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
}

bootstrap();
```

The important addition is:

TypeScript

```
transform: true,
```

## 3. What does `transform: true` do?

At a high level, it tells NestJS to transform incoming data according to the expected parameter type and the transformation metadata available to it.

For DTO-based request handling, the conceptual flow becomes:

```
Incoming JSON object
        │
        ▼
ValidationPipe
        │
        ▼
Transform plain object into DTO instance
        │
        ▼
Apply validation rules
        │
        ▼
Pass validated/transformed value to controller
```

Without transformation:

```
JSON body
   │
   ▼
Plain object
   │
   ▼
Validation
   │
   ▼
Controller
```

With transformation:

```
JSON body
   │
   ▼
Plain object
   │
   ▼
DTO transformation
   │
   ▼
Validation
   │
   ▼
Controller
```

The exact behavior depends on the parameter type and the available metadata, but `transform: true` enables NestJS's transformation capabilities.

# 4. Why DTO classes matter

Our DTO is a class:

TypeScript

```
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;
}
```

The controller declares that the body is expected to have this type:

TypeScript

```
createUrl(@Body() createUrlDto: CreateUrlDto)
```

This tells TypeScript:

> Treat `createUrlDto` as a `CreateUrlDto` value.

However, TypeScript types disappear after compilation. They do not exist at runtime by themselves.

NestJS uses runtime metadata and its transformation/validation system to work with class-based DTOs.

This is why the distinction is important:

```
TypeScript type
    ≠
Runtime validation
    ≠
Runtime transformation
```

Each has a different responsibility.

|  
Mechanism

|

Responsibility

|  
| --- | --- |  
|

TypeScript type

|

Helps during development and compilation

|  
|

Validation decorators

|

Define validation rules

|  
|

`ValidationPipe`

|

Executes validation

|  
|

`transform: true`

|

Enables transformation of incoming values

|

# 5. `transform` does not mean “validate”

This is a common misunderstanding.

Consider:

TypeScript

```
transform: true
```

It does not mean:

> Every incoming value is automatically valid.

Validation still depends on the decorators:

TypeScript

```
@IsString()
@IsNotEmpty()
@IsUrl()
originalUrl: string;
```

The responsibilities remain separate:

```
transform: true
        │
        └── Handles transformation

@IsString()
@IsNotEmpty()
@IsUrl()
        │
        └── Defines validation rules
```

The `ValidationPipe` coordinates both operations.

# 6. Current recommended configuration

For our current URL-shortener prototype, use:

TypeScript

```
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000);
}

bootstrap();
```

The configuration now expresses three policies:

```
transform: true
    → Enable transformation

whitelist: true
    → Remove properties without validation decorators

forbidNonWhitelisted: true
    → Reject unexpected properties
```

# 7. Important caution about primitive conversion

`transform: true` is especially useful when handling values such as route parameters and query parameters.

For example:

TypeScript

```
@Get(':id')
findOne(@Param('id') id: number) {
  // ...
}
```

A URL parameter arrives through HTTP as text:

```
/urls/42
```

The value initially arrives as:

TypeScript

```
'42'
```

not:

TypeScript

```
42
```

Transformation can help convert values according to the expected type, but conversion behavior should be configured deliberately. It should not be assumed that every string will automatically become the correct primitive type in every situation.

For example, the string:

```
"hello"
```

cannot meaningfully become a valid number.

For production APIs, explicit parsing and validation are often preferable for important parameters.

We will handle route parameters and numeric conversion when we implement the URL redirection endpoint.

# 8. Test that validation still works

Start the service:

Bash

```
pnpm nx serve url-service
```

Send a valid request:

Bash

```
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://example.com"}'
```

The request should succeed.

Now send an invalid request:

Bash

```
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"invalid-url"}'
```

The request should still return:

```
HTTP 400 Bad Request
```

Enabling transformation does not remove or weaken the validation rules.

# 9. Final request lifecycle

Our current request-processing pipeline is:

```
HTTP request
    │
    ▼
JSON body parsing
    │
    ▼
ValidationPipe
    │
    ├── Transform incoming data
    │
    ├── Apply whitelist rules
    │
    ├── Reject unexpected properties
    │
    ├── Execute DTO validation decorators
    │
    ├── Invalid → HTTP 400 response
    │
    └── Valid
          │
          ▼
UrlsController.createUrl()
          │
          ▼
UrlsService.createUrl()
          │
          ▼
Response object
          │
          ▼
JSON response
```

## Current bootstrap configuration

TypeScript

```
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
);
```

## Main takeaway

`transform: true` enables NestJS to transform incoming request values according to the expected runtime types and transformation metadata.

It does not replace:

- DTO classes
    
- Validation decorators
    
- `ValidationPipe`
    
- Explicit business-level validation
    

The next practical concept is to add a real short-code generation method instead of returning the hardcoded value:

TypeScript

```
shortCode: 'abc123'
```