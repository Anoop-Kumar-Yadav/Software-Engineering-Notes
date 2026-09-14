## Built-in HTTP Exceptions

NestJS provides a set of **standard HTTP exception classes** for common HTTP error conditions.

All of them inherit from:

```typescript
HttpException
```

and are exported from:

```typescript
@nestjs/common
```

### Exception hierarchy

```text
HttpException
│
├── BadRequestException
├── UnauthorizedException
├── NotFoundException
├── ForbiddenException
├── NotAcceptableException
├── RequestTimeoutException
├── ConflictException
├── GoneException
├── HttpVersionNotSupportedException
├── PayloadTooLargeException
├── UnsupportedMediaTypeException
├── UnprocessableEntityException
├── InternalServerErrorException
├── NotImplementedException
├── ImATeapotException
├── MethodNotAllowedException
├── BadGatewayException
├── ServiceUnavailableException
├── GatewayTimeoutException
└── PreconditionFailedException
```

Because they extend `HttpException`, Nest's built-in exception layer recognizes them automatically.

---

## Commonly Used Exceptions

|Exception|HTTP Status|Typical meaning|
|---|--:|---|
|`BadRequestException`|400|Invalid request|
|`UnauthorizedException`|401|Authentication required/failed|
|`ForbiddenException`|403|Authenticated but not allowed|
|`NotFoundException`|404|Resource doesn't exist|
|`ConflictException`|409|Resource/state conflict|
|`RequestTimeoutException`|408|Request timed out|
|`UnprocessableEntityException`|422|Request understood but cannot be processed|
|`InternalServerErrorException`|500|Unexpected server error|
|`NotImplementedException`|501|Functionality not implemented|
|`BadGatewayException`|502|Invalid upstream response|
|`ServiceUnavailableException`|503|Service temporarily unavailable|
|`GatewayTimeoutException`|504|Upstream service timed out|

For example:

```typescript
throw new NotFoundException('User not found');
```

or:

```typescript
throw new ConflictException('Short code already exists');
```

---

# `options` Parameter

Built-in HTTP exceptions can also receive an optional `options` object.

```typescript
throw new BadRequestException(
  'Something bad happened',
  {
    cause: new Error(),
    description: 'Some error description',
  },
);
```

The important properties are:

```text
options
├── cause
└── description
```

### `cause`

The underlying error that caused the exception.

```typescript
cause: new Error()
```

Useful for **internal debugging/logging**.

It is not directly serialized as part of the HTTP response.

### `description`

A human-readable description of the exception.

```typescript
description: 'Some error description'
```

This can appear in the generated response as the `error` field.

---

## Response

Given:

```typescript
throw new BadRequestException(
  'Something bad happened',
  {
    cause: new Error(),
    description: 'Some error description',
  },
);
```

the response is:

```json
{
  "message": "Something bad happened",
  "error": "Some error description",
  "statusCode": 400
}
```

So the flow is:

```text
BadRequestException
        │
        ├── message
        │      ↓
        │  "Something bad happened"
        │
        ├── description
        │      ↓
        │  "Some error description"
        │
        ├── status
        │      ↓
        │      400
        │
        └── cause
               ↓
          internal error context
```

### Important distinction

`cause` and `description` serve different purposes:

```text
cause
  → underlying technical error
  → useful internally

description
  → error description
  → can be included in client response
```

---

## Practical Usage

For your **URL shortener**, you would normally use the built-in exceptions directly:

```typescript
throw new NotFoundException('Short URL not found');
```

```typescript
throw new ConflictException('Short code already exists');
```

```typescript
throw new BadRequestException('Invalid URL');
```

```typescript
throw new UnauthorizedException('Invalid credentials');
```

Only introduce a custom exception when the built-in exception class does not adequately represent your application's error semantics.

**Core rule:**

> Use a built-in HTTP exception whenever possible; create a custom exception when you need application-specific exception semantics.