# Practical Step 6: Add Runtime Validation to `CreateUrlDto`

Our current endpoint accepts a request body shaped like:

JSON

```
{
  "originalUrl": "https://example.com/very-long-resource"
}
```

However, the current DTO:

TypeScript

```
export class CreateUrlDto {
  originalUrl: string;
}
```

only provides TypeScript information.

It does not automatically reject invalid runtime data such as:

JSON

```
{
  "originalUrl": 123
}
```

or:

JSON

```
{}
```

To validate incoming request data at runtime, NestJS commonly uses:

1. `class-validator`
    
2. `class-transformer`
    
3. NestJS `ValidationPipe`
    

## 1. Install validation packages

From the root of the Nx workspace, run:

Bash

```
pnpm add class-validator class-transformer
```

These packages provide the validation mechanism used by NestJS.

### `class-validator`

Provides validation decorators such as:

TypeScript

```
@IsString()
@IsNotEmpty()
@IsUrl()
```

### `class-transformer`

Helps transform plain incoming objects into class instances and supports transformation-related behavior used by validation.

# 2. Add validation rules to the DTO

Update:

```
apps/url-service/src/app/urls/dto/create-url.dto.ts
```

Use the following code:

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

Now the `originalUrl` field has three validation rules.

## `@IsString()`

TypeScript

```
@IsString()
```

The value must be a string.

Valid:

JSON

```
{
  "originalUrl": "https://example.com"
}
```

Invalid:

JSON

```
{
  "originalUrl": 123
}
```

## `@IsNotEmpty()`

TypeScript

```
@IsNotEmpty()
```

The value cannot be empty.

Invalid examples:

JSON

```
{
  "originalUrl": ""
}
```

JSON

```
{
  "originalUrl": "   "
}
```

This rule ensures that the field contains a meaningful value.

## `@IsUrl()`

TypeScript

```
@IsUrl()
```

The value must have a valid URL format.

Valid example:

JSON

```
{
  "originalUrl": "https://example.com"
}
```

Invalid example:

JSON

```
{
  "originalUrl": "not-a-url"
}
```

# 3. Understand the role of decorators

The DTO now contains metadata describing the expected input:

TypeScript

```
export class CreateUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;
}
```

Conceptually:

```
CreateUrlDto
    │
    └── originalUrl
          ├── must be a string
          ├── must not be empty
          └── must be a valid URL
```

However, merely adding decorators does not execute validation.

The application needs a `ValidationPipe` to inspect the incoming data and apply these rules.

# 4. Register `ValidationPipe` globally

Open the NestJS bootstrap file:

```
apps/url-service/src/main.ts
```

The file may currently look similar to:

TypeScript

```
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
}

bootstrap();
```

Update it:

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
    }),
  );

  await app.listen(3000);
}

bootstrap();
```

# 5. Understand the `ValidationPipe` options

## `new ValidationPipe()`

TypeScript

```
new ValidationPipe()
```

This activates NestJS validation for incoming request data when DTOs contain validation decorators.

Without registering the pipe, the decorators in `CreateUrlDto` will not automatically reject invalid requests.

## `whitelist: true`

TypeScript

```
whitelist: true
```

This removes properties that do not have validation decorators.

Suppose the client sends:

JSON

```
{
  "originalUrl": "https://example.com",
  "unexpectedField": "some-value"
}
```

Only `originalUrl` is defined as a validated property in the DTO.

With `whitelist: true`, the unrecognized property is removed from the validated object.

Conceptually:

```
Incoming body:
{
  originalUrl: "https://example.com",
  unexpectedField: "some-value"
}

After whitelist:
{
  originalUrl: "https://example.com"
}
```

## `forbidNonWhitelisted: true`

TypeScript

```
forbidNonWhitelisted: true
```

This makes NestJS reject the request when the client sends an extra property that is not allowed by the DTO.

For example:

JSON

```
{
  "originalUrl": "https://example.com",
  "unexpectedField": "some-value"
}
```

Instead of silently removing `unexpectedField`, NestJS returns a validation error.

This is often useful for API contracts because clients immediately know that they sent unsupported fields.

### Important relationship

```
whitelist: true
```

removes unknown properties.

```
forbidNonWhitelisted: true
```

rejects unknown properties.

When both are enabled, unexpected properties cause a request failure.

# 6. Request execution flow with validation

The request now passes through the validation layer before reaching the controller.

```
Client
  │
  │ POST /urls
  │
  │ Request body
  ▼
NestJS route handling
  │
  ▼
ValidationPipe
  │
  ├── Check originalUrl is a string
  ├── Check originalUrl is not empty
  ├── Check originalUrl is a valid URL
  └── Check for unexpected properties
  │
  ├── Invalid → return HTTP 400
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
JSON response
```

The controller does not need to manually write code such as:

TypeScript

```
if (!body.originalUrl) {
  // return error
}
```

The validation pipe performs this responsibility before the controller method executes.

# 7. Test a valid request

Start the application:

Bash

```
pnpm nx serve url-service
```

Then send:

Bash

```
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://example.com/very-long-resource"}'
```

The request should pass validation and reach the controller.

Expected response:

JSON

```
{
  "originalUrl": "https://example.com/very-long-resource",
  "shortCode": "abc123",
  "shortUrl": "http://localhost:3000/abc123"
}
```

# 8. Test an invalid URL

Send:

Bash

```
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"not-a-valid-url"}'
```

The request should be rejected before the controller's `createUrl()` method executes.

The response will be an HTTP `400 Bad Request` containing validation information similar to:

JSON

```
{
  "message": [
    "originalUrl must be a URL"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

The exact response may vary slightly according to the NestJS version and validation configuration.

# 9. Test a missing field

Send:

Bash

```
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{}'
```

The request should fail because `originalUrl` is missing.

The response will contain a validation error similar to:

JSON

```
{
  "message": [
    "originalUrl must be a URL",
    "originalUrl should not be empty",
    "originalUrl must be a string"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

The exact order and wording of messages can vary.

# 10. Test an unexpected property

Send:

Bash

```
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://example.com","admin":true}'
```

Because we configured:

TypeScript

```
whitelist: true,
forbidNonWhitelisted: true,
```

the request should be rejected due to the unsupported `admin` property.

The error will be similar to:

JSON

```
{
  "message": [
    "property admin should not exist"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

# 11. Current implementation

## DTO

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

## Controller

TypeScript

```
import { Body, Controller, Post } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlsService } from './urls.service';

@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  createUrl(@Body() createUrlDto: CreateUrlDto) {
    return this.urlsService.createUrl(createUrlDto);
  }
}
```

## Service

TypeScript

```
import { Injectable } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';

@Injectable()
export class UrlsService {
  createUrl(createUrlDto: CreateUrlDto) {
    const { originalUrl } = createUrlDto;

    return {
      originalUrl,
      shortCode: 'abc123',
      shortUrl: `http://localhost:3000/abc123`,
    };
  }
}
```

## Bootstrap

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
    }),
  );

  await app.listen(3000);
}

bootstrap();
```

## Key takeaway

A DTO alone describes the expected structure at the TypeScript level.

The complete runtime validation chain is:

```
DTO decorators
      +
ValidationPipe
      +
class-validator
      +
class-transformer
```

Together, they allow NestJS to validate incoming request data before the request reaches the controller.

Next concept: understand the difference between `whitelist`, `forbidNonWhitelisted`, and `transform`, and then configure validation more deliberately for a production API.