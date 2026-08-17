## Why Does This Feature Exist?

In the previous chapter we learned that `mixin()` automatically injects metadata into every log.

```
mixin() {
    return {
        tag: "k8s"
    }
}
```

Now imagine a log call like this:

```
logger.info({
    tag: "local"
}, "Server started");
```

Both objects contain the same key.

```
mixin()
↓

{
    tag: "k8s"
}

+

logger.info()

↓

{
    tag: "local"
}
```

Question:

> Which value should appear in the final log?

This is exactly the problem `mixinMergeStrategy` solves.

---

## What is `mixinMergeStrategy`?

### Definition

`mixinMergeStrategy` controls **how Pino merges**:

- the object returned from `mixin()`
- the object passed to `logger.info({...})`

---

## Merge Process

Without thinking about implementation, every log goes through this pipeline.

```
logger.info({...})

        │

        ▼

mixin()

        │

        ▼

Merge Both Objects

        │

        ▼

Serialize

        │

        ▼

stdout
```

The merge strategy determines **which object wins** when duplicate keys exist.

---

# Default Strategy

The documentation says the default behavior is equivalent to:

```
Object.assign(mixinObject, mergeObject);
```

Conceptually:

```
mixinObject

↓

{
   tag: "docker"
}

mergeObject

↓

{
   tag: "local"
}

↓

Result

↓

{
   tag: "local"
}
```

The object passed to `logger.info()` has higher priority.

---

## Example

```
const logger = pino({
    mixin() {
        return {
            tag: "docker"
        };
    }
});

logger.info({
    tag: "local"
}, "Message");
```

Output

```
{
    "tag":"local"
}
```

The application explicitly supplied `tag`, so it overrides the default.

---

# Custom Strategy

Suppose you always want infrastructure metadata to win.

Example:

```
mixin() {
    return {
        tag: "k8s"
    };
}
```

Application

```
logger.info({
    tag: "local"
});
```

Custom strategy

```
mixinMergeStrategy(mergeObject, mixinObject) {
    return Object.assign(
        mergeObject,
        mixinObject
    );
}
```

Result

```
{
    "tag":"k8s"
}
```

Now the mixin overrides application data.

---

# Mutable vs Immutable Merge

The documentation shows two implementations.

## Mutable

```
Object.assign(
    mergeObject,
    mixinObject
);
```

Mutates

```
mergeObject
```

Pros

- Faster
- Less memory allocation

Cons

- Original object changes

---

## Immutable

```
Object.assign(
    {},
    mergeObject,
    mixinObject
);
```

Creates a completely new object.

Pros

- Safer
- No mutation

Cons

- Allocates more memory

---

# When Would You Change This?

Almost never.

The default strategy is correct for most applications because explicit log metadata should override automatically injected metadata.

Override it only if your organization requires system-generated metadata to always take precedence.

---

# Production Tips

- Keep the default merge strategy unless you have a clear business requirement.
- Prefer immutable merges if you are manipulating objects that may be reused elsewhere.
- Avoid complex merge logic. This function runs for every log call.