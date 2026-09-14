# Practical Step 5: Convert `GET /urls` into `POST /urls`

Previously, we created a temporary `GET /urls` endpoint. Now we will make the endpoint represent the actual URL-shortener operation:

> The client sends a long URL, and the backend returns a generated short-code response.

For creating a new resource, `POST` is more appropriate than `GET`.

## 1. Why use `POST /urls`?

The HTTP methods have different purposes:

|  
Method

|

Purpose

|  
| --- | --- |  
|

`GET`

|

Retrieve existing data

|  
|

`POST`

|

Create or submit new data

|  
|

`PUT`

|

Replace an existing resource

|  
|

`PATCH`

|

Partially update an existing resource

|  
|

`DELETE`

|

Delete an existing resource

|

In our URL-shortener:

```
POST /urls
```

means:

> Create a new shortened-URL record from the submitted original URL.

The client will send data in the request body:

JSON

```
{
  "originalUrl": "https://example.com/very-long-resource"
}
```

The server will temporarily return:

JSON

```
{
  "originalUrl": "https://example.com/very-long-resource",
  "shortCode": "abc123",
  "shortUrl": "http://localhost:3000/abc123"
}
```

The `shortCode` is hardcoded for now. We will generate it dynamically and store the URL later.

# 2. Create a DTO

A DTO, or Data Transfer Object, describes the structure of data moving between application boundaries.

Here, the client sends data to the controller. We can describe the expected request body using a DTO.

Inside the `urls` directory, create this structure:

```
urls/
├── dto/
│   └── create-url.dto.ts
├── urls.controller.ts
├── urls.module.ts
└── urls.service.ts
```

Create the file:

```
apps/url-service/src/app/urls/dto/create-url.dto.ts
```

> Your generated Nx structure may place `urls` directly under `src/` instead of `src/app/`. Use the actual location shown by your project tree.

Add the following code:

TypeScript

```
export class CreateUrlDto {
  originalUrl: string;
}
```

This DTO expresses that the expected request body contains an `originalUrl` property whose TypeScript type is `string`.

Conceptually:

```
Incoming request body
        │
        ▼
CreateUrlDto
        │
        ▼
{
  originalUrl: string
}
```

## Important distinction

This DTO currently provides compile-time type information only.

It does not automatically guarantee that the client actually sends valid data at runtime.

For example, this request may still reach the controller:

JSON

```
{
  "originalUrl": 123
}
```

Runtime validation will be handled separately using NestJS validation mechanisms. For now, we are focusing only on receiving and passing the request data.

# 3. Update `urls.controller.ts`

Replace the existing controller code with:

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

Let's understand the important parts.

## `@Controller('urls')`

TypeScript

```
@Controller('urls')
```

This establishes the base route:

```
/urls
```

## `@Post()`

TypeScript

```
@Post()
```

This tells NestJS that the method handles:

```
POST /urls
```

The empty `@Post()` means that no additional path is appended to the controller's base route.

For example:

TypeScript

```
@Controller('urls')
@Post()
```

produces:

```
POST /urls
```

Whereas:

TypeScript

```
@Controller('urls')
@Post('create')
```

would produce:

```
POST /urls/create
```

## `@Body()`

TypeScript

```
createUrl(@Body() createUrlDto: CreateUrlDto)
```

`@Body()` extracts the parsed request body.

For this request:

http

```
POST /urls
Content-Type: application/json
```

JSON

```
{
  "originalUrl": "https://example.com/very-long-resource"
}
```

NestJS provides the body to the method:

TypeScript

```
{
  originalUrl: 'https://example.com/very-long-resource'
}
```

The parameter is typed as:

TypeScript

```
CreateUrlDto
```

This helps TypeScript understand the expected shape of the data.

## Delegation to the service

The controller calls:

TypeScript

```
return this.urlsService.createUrl(createUrlDto);
```

The controller is responsible for handling the HTTP request. The service is responsible for the application logic.

The controller should not generate the short code, access the database, or contain the complete URL-shortening algorithm.

# 4. Update `urls.service.ts`

Replace the service code with:

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

## What happens inside the method?

The method receives the DTO-shaped object:

TypeScript

```
{
  originalUrl: 'https://example.com/very-long-resource'
}
```

This line extracts the original URL:

TypeScript

```
const { originalUrl } = createUrlDto;
```

It is equivalent to:

TypeScript

```
const originalUrl = createUrlDto.originalUrl;
```

The service then returns an object:

TypeScript

```
return {
  originalUrl,
  shortCode: 'abc123',
  shortUrl: `http://localhost:3000/abc123`,
};
```

The shorthand property:

TypeScript

```
originalUrl
```

is equivalent to:

TypeScript

```
originalUrl: originalUrl
```

Therefore, the returned object is:

JSON

```
{
  "originalUrl": "https://example.com/very-long-resource",
  "shortCode": "abc123",
  "shortUrl": "http://localhost:3000/abc123"
}
```

# 5. Run the application

Start the NestJS application through Nx:

Bash

```
pnpm nx serve url-service
```

The application should start on the configured port, usually:

```
http://localhost:3000
```

# 6. Test the `POST /urls` endpoint

Use `curl` from another terminal:

Bash

```
curl -X POST http://localhost:3000/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://example.com/very-long-resource"}'
```

Expected response:

JSON

```
{
  "originalUrl": "https://example.com/very-long-resource",
  "shortCode": "abc123",
  "shortUrl": "http://localhost:3000/abc123"
}
```

The request contains:

http

```
POST /urls
```

The body contains:

JSON

```
{
  "originalUrl": "https://example.com/very-long-resource"
}
```

The response is generated by the service.

# 7. Complete request execution flow

```
Client
  │
  │ POST /urls
  │
  │ Body:
  │ {
  │   "originalUrl": "https://example.com/very-long-resource"
  │ }
  ▼
NestJS HTTP layer
  │
  ▼
UrlsController.createUrl()
  │
  │ @Body() extracts request body
  ▼
CreateUrlDto-shaped object
  │
  ▼
UrlsService.createUrl()
  │
  │ Generates temporary response
  ▼
Response object
  │
  ▼
NestJS serializes object as JSON
  │
  ▼
HTTP response
```

In code form:

```
POST /urls
    ↓
UrlsController.createUrl()
    ↓
@Body() createUrlDto
    ↓
UrlsService.createUrl(createUrlDto)
    ↓
Return response object
    ↓
JSON response
```

# 8. Current architecture

At this stage, the feature has the following responsibility separation:

```
urls/
├── dto/
│   └── create-url.dto.ts
├── urls.controller.ts
├── urls.module.ts
└── urls.service.ts
```

|  
File

|

Responsibility

|  
| --- | --- |  
|

`create-url.dto.ts`

|

Describes the expected input shape

|  
|

`urls.controller.ts`

|

Handles `POST /urls`

|  
|

`urls.service.ts`

|

Performs the current URL-shortening logic

|  
|

`urls.module.ts`

|

Registers the controller and service

|

The current implementation is only a prototype:

- No database is used.
    
- No URL validation is performed.
    
- No real short-code generation exists.
    
- The short code is always `abc123`.
    
- No URL redirection endpoint exists.
    
- Every request returns the same short URL.
    

The purpose of this step is to establish the correct HTTP request → controller → service flow.

## Next concept

The next step is runtime validation of `CreateUrlDto`, so that the application can reject invalid request bodies instead of merely describing their expected TypeScript shape.