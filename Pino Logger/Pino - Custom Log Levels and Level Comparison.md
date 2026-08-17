### Why Does This Feature Exist?

By default, Pino provides six predefined log levels:

```
trace (10)
debug (20)
info  (30)
warn  (40)
error (50)
fatal (60)
```

These levels work well for most applications.

However, some organizations already have their own logging standards.

Example:

```
SECURITY
AUDIT
PAYMENT
BUSINESS
NOTICE
```

Instead of forcing developers to map these concepts to `info()` or `warn()`, Pino allows you to define **custom logging levels**.

---

# 1. `customLevels`

### Definition

`customLevels` allows you to create additional logging methods.

### Syntax

```
const logger = pino({
  customLevels: {
    foo: 35
  }
});
```

Now a new method exists.

```
logger.foo("Hello");
```

---

### How It Works

Pino dynamically creates logger methods based on the object keys.

Example

```
customLevels: {

    audit: 35,

    security: 45,

    payment: 38

}
```

Internally Pino creates methods similar to

```
logger.audit()

logger.security()

logger.payment()
```

---

### Example

```
import pino from "pino";

const logger = pino({
  customLevels: {
    audit: 35
  }
});

logger.audit("User permissions updated");
```

Output

```
{
  "level": 35,
  "msg": "User permissions updated"
}
```

---

### Production Use Cases

Instead of writing

```
logger.info("Payment completed");
```

you can express business intent directly.

```
logger.payment("Payment completed");
```

Or

```
logger.audit("Role updated");
```

This improves readability and makes log filtering more meaningful.

---

# 2. `levelComparison`

### Definition

`levelComparison` determines **how Pino decides whether a log should be written**.

By default, Pino compares levels in **ascending order (ASC)**.

Conceptually:

```
trace

↓

debug

↓

info

↓

warn

↓

error

↓

fatal
```

Higher numeric values indicate more severe events.

---

### Default

```
levelComparison: "ASC"
```

Equivalent comparison:

```
current >= configuredLevel
```

---

### Example

```
const logger = pino({
  level: "warn"
});
```

Results:

|Method|Logged|
|---|---|
|trace|❌|
|debug|❌|
|info|❌|
|warn|✅|
|error|✅|
|fatal|✅|

---

### Descending Comparison

```
const logger = pino({
  levelComparison: "DESC",

  customLevels: {

    foo: 20,

    bar: 10

  }
});
```

Now the comparison direction is reversed.

This option is mainly useful when your custom level numbering follows a different convention than Pino's default.

---

### Custom Comparison Function

Instead of `"ASC"` or `"DESC"`, you can provide your own comparison function.

```
const logger = pino({
  levelComparison(current, expected) {
    return current >= expected;
  }
});
```

The function receives:

|Parameter|Meaning|
|---|---|
|current|Incoming log level|
|expected|Configured logger level|

It must return:

- `true` → log the message
- `false` → ignore the message

---

### When Would You Use It?

Almost never.

This option exists for advanced integrations with logging systems that use a different severity model.

Most applications should use the default behavior.

---

# 3. `useOnlyCustomLevels`

### Definition

By default, custom levels are **added** to the existing Pino levels.

Example

```
const logger = pino({
  customLevels: {

    audit: 35

  }
});
```

Available methods become

```
trace()

debug()

info()

warn()

error()

fatal()

audit()
```

---

### Enabling `useOnlyCustomLevels`

```
const logger = pino({

  customLevels: {

    audit: 35

  },

  useOnlyCustomLevels: true,

  level: "audit"

});
```

Now only the custom levels remain.

Available methods

```
audit()
```

The built-in methods no longer exist.

Calling

```
logger.info("Hello");
```

throws an error because `info` is no longer part of the logger.

---

### Important Requirement

When using

```
useOnlyCustomLevels: true
```

you **must** set the logger's `level` to one of your custom levels.

Example

```
level: "audit"
```

Otherwise Pino won't know which level should act as the threshold.

---

### Production Use Cases

Rare.

This option is mainly useful when integrating with systems that have a predefined logging vocabulary.

Example

```
NOTICE

SECURITY

AUDIT

PAYMENT
```

Instead of supporting both standard and custom levels, you enforce a single logging convention across the application.

---

# Relationship Between These Options

```
customLevels
      │
      ├── Creates new log methods
      │
      ▼
levelComparison
      │
      ├── Decides how levels are compared
      │
      ▼
useOnlyCustomLevels
      │
      └── Removes Pino's built-in levels
```

---

# Production Tips

- Prefer the built-in levels (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) unless your organization has a documented logging standard.
- Use `customLevels` to represent domain-specific events (for example, `audit`, `security`, or `payment`) rather than overloading `info()`.
- Avoid changing `levelComparison` unless you're integrating with an external system that uses a different severity ordering.
- Use `useOnlyCustomLevels` only when you want to enforce a completely custom logging vocabulary across the entire application. Many downstream transports and tools expect the standard Pino levels.