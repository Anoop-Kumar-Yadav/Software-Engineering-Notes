**What is Logging?**

- Logging is the process of **recording important events that occur while your application is running**.

Every request, database query, error, authentication attempt, payment, or background job can leave a trace in the form of a log.

## Pino - Creating a Logger (`pino([options], [destination])`)
### Definition

`pino()` is a **factory function** exported by the `pino` package. It creates and returns a **logger instance**.

```
import pino from "pino";

const logger = pino();
```

`logger` is an object containing methods such as:

- `trace()`
- `debug()`
- `info()`
- `warn()`
- `error()`
- `fatal()`
- `child()`

---

## Function Signature

```
pino([options], [destination]) => logger
```

### Parameters

|Parameter|Type|Required|Purpose|
|---|---|---|---|
|options|Object|❌|Configure the logger|
|destination|Stream|❌|Specify where logs are written|

---

## Logger Instance

Calling `pino()` returns a new logger instance.

```
const logger = pino();
```

Each logger has its own independent configuration.

Example:

```
const authLogger = pino({
  name: "auth-service"
});

const paymentLogger = pino({
  name: "payment-service"
});
```

---

## `name` Option

### Syntax

```
const logger = pino({
  name: "auth-service"
});
```

### Purpose

Adds a `name` field to every log.

Without `name`

```
{
  "level": 30,
  "msg": "Server started"
}
```

With `name`

```
{
  "level": 30,
  "name": "auth-service",
  "msg": "Server started"
}
```

### Use Cases

- Microservices
- Multiple Node.js processes
- Background workers
- Job queues

---

## `level` Option

### Default

```
level: "info"
```

If omitted:

```
const logger = pino();
```

is equivalent to:

```
const logger = pino({
  level: "info"
});
```

---

### Supported Levels

|Level|Numeric Value|
|---|---|
|trace|10|
|debug|20|
|info|30|
|warn|40|
|error|50|
|fatal|60|
|silent|Disabled|

---

### Filtering Logic

Pino logs only messages whose severity is **greater than or equal to** the configured level.

Example:

```
const logger = pino({
  level: "warn"
});
```

Result:

|Method|Logged|
|---|---|
|trace|❌|
|debug|❌|
|info|❌|
|warn|✅|
|error|✅|
|fatal|✅|

---

## Why Multiple Logger Instances?

Different services often require different identities.

```
Gateway
↓

Auth Service

↓

Payment Service

↓

Notification Service
```

Example:

```
const authLogger = pino({
  name: "auth-service"
});

const paymentLogger = pino({
  name: "payment-service"
});
```

Each log entry clearly identifies its source.

---

## Internal Flow

```
pino()

↓

Read options

↓

Create logger object

↓

Attach methods

↓

Return logger instance
```

Logging a message:

```
logger.info()

↓

Check configured level

↓

Create log object

↓

Serialize to JSON

↓

Write to stdout
```

---

# Production Tips

- Create **one shared logger instance per service**, not per request.
- Always set the `name` field in microservices.
- Use `level: "debug"` or `trace` during development.
- Use `level: "info"` (or higher) in production.
- Do **not** create a new logger inside controllers or request handlers; reuse the shared instance to avoid unnecessary object creation.