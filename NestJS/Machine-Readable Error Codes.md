## Machine-Readable Error Codes

`status` and `message` are primarily useful for **humans**, but clients should not normally use the `message` string to determine what happened.

### Problem

Multiple different failures can have the same HTTP status:

```text
Invalid email       → 400 Bad Request
Weak password       → 400 Bad Request
Invalid URL         → 400 Bad Request
```

If the client branches on:

```typescript
if (error.message === 'Password is too weak') {
  ...
}
```

this is fragile because the human-readable message can change.

---

## `errorCode`

NestJS allows a stable, **machine-readable error identifier** through the exception `options`:

```typescript
throw new BadRequestException(
  'Password is too weak',
  {
    errorCode: 'WEAK_PASSWORD',
  },
);
```

Response:

```json
{
  "message": "Password is too weak",
  "errorCode": "WEAK_PASSWORD",
  "statusCode": 400
}
```

The client can now branch on:

```typescript
if (error.errorCode === 'WEAK_PASSWORD') {
  // show password-strength UI
}
```

instead of parsing:

```typescript
error.message
```

---

## Why `errorCode` Matters

Think of the two fields as having different contracts:

```text
message
   ↓
Human-readable
   ↓
Can change wording

errorCode
   ↓
Machine-readable
   ↓
Stable API identifier
```

For example:

```json
{
  "message": "Password is too weak",
  "errorCode": "WEAK_PASSWORD",
  "statusCode": 400
}
```

The frontend should generally use:

```text
WEAK_PASSWORD
```

for programmatic decisions, while displaying:

```text
Password is too weak
```

to the user.

---

## `errorCode` with `HttpException`

`errorCode` is not limited to `BadRequestException`.

It can be supplied directly to `HttpException`:

```typescript
throw new HttpException(
  'Forbidden',
  HttpStatus.FORBIDDEN,
  {
    errorCode: 'ACCOUNT_SUSPENDED',
  },
);
```

Response:

```json
{
  "message": "Forbidden",
  "errorCode": "ACCOUNT_SUSPENDED",
  "statusCode": 403
}
```

This also means **custom exceptions can define an `errorCode`**.

---

## `errorCode` vs `cause` vs `description`

Keep this distinction clear:

|Field|Purpose|Sent to client?|
|---|---|---|
|`message`|Human-readable error message|Yes|
|`errorCode`|Stable machine-readable identifier|**Yes**|
|`description`|Error description|Yes|
|`cause`|Underlying technical error|**No**|

Conceptually:

```text
Exception
   │
   ├── message
   │      → human
   │
   ├── errorCode
   │      → client/application logic
   │
   ├── description
   │      → response description
   │
   └── cause
          → internal debugging/logging
```

### Core rule

> **Never make client-side branching depend on human-readable `message` strings when a stable `errorCode` can represent the error.**

For your URL shortener, examples could be:

```text
INVALID_URL
SHORT_CODE_ALREADY_EXISTS
SHORT_URL_NOT_FOUND
URL_EXPIRED
INVALID_SHORT_CODE
```

with the HTTP status still communicating the broad HTTP-level category:

```text
400 + INVALID_URL
409 + SHORT_CODE_ALREADY_EXISTS
404 + SHORT_URL_NOT_FOUND
410 + URL_EXPIRED
```