## Why Does `redact` Exist?

Imagine your login endpoint.

```
logger.info(req.body);
```

Request

```
{
    "email":"anoop@example.com",
    "password":"super-secret"
}
```

Log

```
{
    "email":"anoop@example.com",
    "password":"super-secret"
}
```

Congratulations.

You have just leaked user passwords into your logs.

Logs often live for months and are accessible to developers, DevOps engineers, support staff, and log aggregation systems.

This is a serious security issue.

---

## What is `redact`?

`redact` automatically hides or removes sensitive values before they are written.

---

## Basic Example

```
const logger = pino({
    redact: [
        "password"
    ]
});
```

Input

```
logger.info({
    email: "anoop@example.com",
    password: "123456"
});
```

Output

```
{
    "email":"anoop@example.com",
    "password":"[Redacted]"
}
```

---

# Nested Paths

Pino understands JavaScript object paths.

```
redact: [
    "user.password",
    "headers.authorization"
]
```

Example

```
logger.info({
    user: {
        password: "secret"
    }
});
```

Result

```
{
    "user":{
        "password":"[Redacted]"
    }
}
```

---

# Custom Censor

Instead of

```
[Redacted]
```

you can provide your own value.

```
redact: {
    paths: [
        "password"
    ],
    censor: "***"
}
```

Output

```
{
    "password":"***"
}
```

---

# Remove Instead of Replace

```
redact: {
    paths: [
        "password"
    ],
    remove: true
}
```

Output

```
{
    "email":"anoop@example.com"
}
```

The key disappears completely.

---

# Custom Censor Function

```
redact: {
    paths: [
        "creditCard"
    ],
    censor(value) {
        return value.slice(-4);
    }
}
```

Input

```
4111111111111111
```

Output

```
1111
```

Useful when partial information is needed for debugging.

---

# Never Do This

The documentation contains an important warning.

❌

```
const field = req.body.field;

redact: [
    field
];
```

Why?

Because user-controlled paths can alter the redaction behavior and create unexpected or unsafe logging.

Always define redacted paths in code, not from user input.

---

# What Should Be Redacted?

Typical production list:

```
password

confirmPassword

authorization

cookie

refreshToken

accessToken

jwt

secret

apiKey

creditCard.number

cvv

otp

sessionId
```

If you're unsure whether a field is sensitive, it's safer to redact it.

---

# Production Tips

- Configure redaction once in your shared logger.
- Review new request payloads and headers whenever APIs evolve.
- Redaction protects logs, but it does not replace proper application security.
- Prefer `remove: true` when the value has no debugging value.