These two options belong together because both affect **how Pino serializes complex JavaScript objects into JSON**.

### Why Does This Feature Exist?

Pino is designed to log JavaScript objects.

Example:

```
logger.info(user);
```

Most of the time, this works well.

However, real-world backend applications often deal with:

- Deeply nested objects
- Circular references
- Very large arrays
- Complex ORM entities (Prisma, Mongoose, Sequelize)

Without limits, serializing these objects can:

- Consume excessive memory
- Slow down logging
- Produce huge log files
- Cause stack overflow in extreme cases

To prevent this, Pino provides:

- `depthLimit`
- `edgeLimit`

These options control **how much of an object is serialized**.

---

# Understanding the Problem

Imagine a nested object.

```
const user = {
  id: 1,
  profile: {
    address: {
      city: {
        country: {
          continent: {
            planet: "Earth"
          }
        }
      }
    }
  }
};
```

Object structure:

```
user
└── profile
    └── address
        └── city
            └── country
                └── continent
                    └── planet
```

This object has many nesting levels.

If every log fully serializes such objects, log size increases rapidly.

---

# 1. `depthLimit`

### Definition

`depthLimit` limits **how deep Pino traverses nested objects during serialization**.

Default:

```
depthLimit: 5
```

---

### Default Behavior

```
const logger = pino();
```

Equivalent to:

```
const logger = pino({
  depthLimit: 5
});
```

---

### Example

```
const logger = pino({
  depthLimit: 2
});
```

Object

```
const data = {
  level1: {
    level2: {
      level3: {
        level4: "Hello"
      }
    }
  }
};
```

Conceptually, Pino stops exploring after the configured depth.

```
level1
└── level2
    └── ...
```

Everything deeper is truncated instead of being fully serialized.

---

### Visual Example

Without limit

```
User
└── Profile
    └── Address
        └── City
            └── Country
                └── Planet
```

With

```
depthLimit: 2
```

```
User
└── Profile
    └── ...
```

Only the first levels are included.

---

### Why Is This Useful?

Suppose you're logging a Prisma result containing several nested relations.

```
const user = await prisma.user.findUnique({
  include: {
    posts: {
      include: {
        comments: {
          include: {
            author: true
          }
        }
      }
    }
  }
});
```

This object may be deeply nested.

Logging the complete structure for every request is rarely useful.

A reasonable `depthLimit` keeps logs concise and avoids unnecessary serialization work.

---

# 2. `edgeLimit`

### Definition

`edgeLimit` limits **how many properties (for objects) or elements (for arrays) are serialized**.

Default:

```
edgeLimit: 100
```

---

### Object Example

```
const logger = pino({
  edgeLimit: 3
});
```

Object

```
const user = {
  id: 1,
  name: "Anoop",
  email: "anoop@example.com",
  phone: "12345",
  city: "Delhi"
};
```

Only the configured number of properties are serialized.

Conceptually:

```
id

name

email

...
```

---

### Array Example

```
const logger = pino({
  edgeLimit: 3
});
```

```
logger.info([
  10,
  20,
  30,
  40,
  50,
  60
]);
```

Instead of processing the entire array, serialization is limited.

---

### Why Is This Useful?

Imagine logging a response containing:

```
const users = await prisma.user.findMany();
```

Suppose there are:

```
50,000 users
```

Logging every element would:

- Create huge log entries
- Increase CPU usage
- Waste storage
- Make logs difficult to read

`edgeLimit` prevents accidental serialization of excessively large collections.

---

# Circular References

The documentation specifically mentions:

> logging circular objects

A circular reference occurs when an object refers to itself.

Example:

```
const user: any = {
  name: "Anoop"
};

user.self = user;
```

Visual representation:

```
user
 │
 ├── name
 │
 └──────────────┐
                │
                ▼
               user
```

Without special handling, a serializer would recurse forever.

```
user

↓

self

↓

user

↓

self

↓

user

↓

...
```

Result:

```
Maximum call stack exceeded
```

Pino detects these structures and uses `depthLimit` and `edgeLimit` to avoid excessive traversal while safely serializing them.

---

# Relationship Between Both Options

```
Object

↓

depthLimit
│
├── Controls nesting depth

↓

edgeLimit
│
└── Controls number of properties/elements
```

Think of them as two different limits:

- `depthLimit` → **How deep**
- `edgeLimit` → **How much**

---

# Production Use Cases

### ORM Results

Avoid logging deeply nested Prisma or Sequelize entities.

---

### API Responses

Prevent accidental logging of very large payloads.

---

### Cache Objects

Redis responses can contain complex nested structures.

---

### Background Jobs

Queue payloads may include deeply nested metadata.

---

### Error Objects

Some third-party libraries attach large nested objects to errors.

---

# Production Tips

- The default values (`depthLimit: 5`, `edgeLimit: 100`) are suitable for most applications.
- Avoid logging entire ORM entities. Prefer logging identifiers and relevant metadata instead.
- If you frequently need to reduce these limits, it's often a sign that you're logging too much rather than that the defaults are wrong.
- Use these options as a safety net, not as a substitute for thoughtful logging.