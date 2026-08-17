This chapter is about **automatically adding dynamic information to every log entry**.

## Why Does `mixin()` Exist?

Suppose every log in your application should contain a **request ID**.

Without `mixin()`:

```
logger.info({
  requestId,
  userId
}, "User logged in");

logger.error({
  requestId,
  error
}, "Payment failed");

logger.warn({
  requestId
}, "Retrying request");
```

Notice the repetition.

Every log repeats:

```
requestId
```

This violates the **DRY (Don't Repeat Yourself)** principle.

`mixin()` solves this by automatically injecting metadata into **every log entry**.

---

# What is `mixin()`?

### Definition

`mixin` is a function executed **every time** a logging method is called.

Examples:

```
logger.info()
logger.warn()
logger.error()
logger.debug()
logger.trace()
logger.fatal()
```

Every call executes:

```
logger.info()

↓

mixin()

↓

Returned object

↓

Merged into log

↓

JSON output
```

---

## Function Signature

```
mixin(context, level, logger)
```

It must synchronously return an object.

```
mixin() {
    return {
        requestId: "abc123"
    };
}
```

That returned object is merged into every log.

---

# Basic Example

```
import pino from "pino";

let counter = 0;

const logger = pino({
    mixin() {
        return {
            line: ++counter
        };
    }
});
```

Usage

```
logger.info("Hello");
logger.info("World");
```

Output

```
{
  "line":1,
  "msg":"Hello"
}

{
  "line":2,
  "msg":"World"
}
```

Notice something important.

You never passed

```
line
```

to `logger.info()`.

Pino added it automatically.

---

# Internal Flow

```
logger.info()

↓

Execute mixin()

↓

Return

{
   line: 1
}

↓

Merge with log object

↓

Serialize

↓

stdout
```

The mixin runs **for every log call**.

---

# Understanding the Parameters

## First Parameter

```
mixin(context)
```

The first parameter contains the object passed to the logger.

Example

```
logger.info({
    userId: 10
}, "Login");
```

Now

```
mixin(context)
```

receives

```
{
    userId: 10
}
```

If you don't pass an object,

```
logger.info("Hello");
```

then

```
context
```

is simply

```
{}
```

---

## Second Parameter

```
mixin(context, level)
```

This is the numeric log level.

Example

```
logger.info()
```

receives

```
30
```

```
logger.error()
```

receives

```
50
```

This allows level-aware metadata.

Example

```
const logger = pino({
    mixin(_, level) {
        return {
            levelName: logger.levels.labels[level]
        };
    }
});
```

Output

```
{
  "level":30,
  "levelName":"info"
}
```

---

## Third Parameter

```
mixin(context, level, logger)
```

This is the current logger instance.

Why is this useful?

Suppose your logger contains custom state.

```
logger.tags = {
    service: "auth"
};
```

Inside mixin,

```
logger.tags
```

can be read.

Example

```
mixin(_, __, logger) {
    return {
        tags: logger.tags
    };
}
```

Every log now includes those tags.

---

# Real Backend Example

Imagine an Express application.

Every request gets a unique ID.

```
GET /users

↓

Request ID

↓

4f3d1aa9
```

Without mixin

```
logger.info({
    requestId
}, "Request started");

logger.info({
    requestId
}, "Database queried");

logger.info({
    requestId
}, "Response sent");
```

With mixin

```
const logger = pino({
    mixin() {
        return {
            requestId: requestContext.id
        };
    }
});
```

Now

```
logger.info("Request started");
```

already contains

```
{
  "requestId":"4f3d1aa9"
}
```

No repetition.

---

# Important Warning — Object Mutation

This is one of the easiest mistakes to make.

Consider:

```
const metadata = {
    appName: "My App"
};

const logger = pino({
    mixin() {
        return metadata;
    }
});
```

First log

```
logger.info({
    description: "OK"
});
```

Pino internally merges

```
metadata

+

description
```

Result

```
metadata = {

    appName: "My App",

    description: "OK"

}
```

Second log

```
logger.info("Hello");
```

Unexpected output

```
{
  "appName":"My App",
  "description":"OK"
}
```

The previous description leaked into the next log.

Why?

Because Pino **mutates** the returned object for performance.

---

# Correct Approach

Always return a **new object**.

Good

```
mixin
```

- only when the metadata is dynamic and changes between log calls.