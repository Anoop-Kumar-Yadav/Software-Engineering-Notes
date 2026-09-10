## Step 15 — Authentication: define a security scheme

We are now entering **Phase F**. Before adding authentication to an endpoint, we need to teach OpenAPI what authentication mechanism our API uses.

### 1. What we're doing right now

We'll define a reusable **Bearer JWT security scheme** in `components.securitySchemes`.

This describes to Swagger:

> "My API expects an HTTP `Authorization: Bearer <token>` header."

We are **not applying it to any endpoint yet**. First we define what the authentication mechanism is.

### 2. Why this comes at this exact point

We already have `components` from our `Task` and `CreateTaskInput` schemas:

```text
components
├── schemas
│   ├── Task
│   └── CreateTaskInput
│
└── securitySchemes       ← NEW
```

OpenAPI separates:

1. **Defining an authentication mechanism**
    
2. **Saying which endpoints require it**
    

This is the same reusable-definition pattern we've already learned with schemas.

The new OpenAPI concept is `securitySchemes`:

> `components.securitySchemes` defines _how_ clients authenticate with the API.

---

## 3. Add `bearerAuth` to `swagger.js`

Open:

```text
src/config/swagger.js
```

You currently have:

```javascript
components: {
  schemas: {
    Task: {
      // ...
    },

    CreateTaskInput: {
      // ...
    },
  },
},
```

Add `securitySchemes` **alongside `schemas`**, not inside a schema:

```javascript
components: {
  schemas: {
    Task: {
      // ...
    },

    CreateTaskInput: {
      // ...
    },
  },

  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
},
```

So the structure is:

```text
components
├── schemas
│   ├── Task
│   └── CreateTaskInput
│
└── securitySchemes
    └── bearerAuth
```

---

## 4. Understand each OpenAPI key

### `securitySchemes`

```yaml
securitySchemes:
```

This is where OpenAPI stores **reusable authentication definitions**.

We're naming ours:

```yaml
bearerAuth:
```

The name `bearerAuth` is arbitrary. We could call it `jwtAuth`, but `bearerAuth` clearly communicates what it represents.

### `type: http`

```yaml
type: http
```

This tells OpenAPI that we're using an HTTP authentication mechanism.

### `scheme: bearer`

```yaml
scheme: bearer
```

This means the HTTP authentication scheme is **Bearer authentication**.

The expected request header is conceptually:

```http
Authorization: Bearer eyJhbGciOi...
```

### `bearerFormat: JWT`

```yaml
bearerFormat: JWT
```

This tells documentation consumers that the bearer token is expected to be a **JWT**.

An important nuance: `bearerFormat` is primarily documentation metadata. It doesn't validate the JWT and doesn't make Express authenticate anything.

Your actual authentication middleware remains responsible for:

```text
Authorization header
        ↓
extract token
        ↓
verify JWT
        ↓
allow / reject request
```

OpenAPI is simply describing that contract.

---

# 5. Don't add `security` yet

You might be tempted to add:

```yaml
security:
  - bearerAuth: []
```

Don't do that yet.

We first defined:

```text
What authentication mechanism exists?
        ↓
components.securitySchemes
        ↓
bearerAuth
```

The next step will answer:

```text
Which endpoint requires that mechanism?
```

That's where `security` comes in.

---

# 6. What to check

Restart:

```bash
npm start
```

There should be **no startup error**.

Then open:

```text
http://localhost:3000/api-docs
```

At this point, you may not see a visible **Authorize** button yet.

That's expected.

We've only **defined** the security scheme. We haven't told any operation to use it.

The generated OpenAPI JSON should contain:

```json
"components": {
  "schemas": {
    ...
  },
  "securitySchemes": {
    "bearerAuth": {
      "type": "http",
      "scheme": "bearer",
      "bearerFormat": "JWT"
    }
  }
}
```

That's the check we're interested in.

---

## The mental model

Keep these two concepts separate:

```text
components.securitySchemes
        │
        ▼
"What authentication mechanisms exist?"
        │
        ▼
bearerAuth
```

Later:

```text
security
   │
   ▼
"Does this operation require bearerAuth?"
```

This separation is very similar to what we learned with schemas:

```text
components.schemas.Task
        │
        │ $ref
        ▼
GET /tasks response
```

and now:

```text
components.securitySchemes.bearerAuth
        │
        │ security
        ▼
protected endpoint
```

**Stop here and confirm that `bearerAuth` appears under `components.securitySchemes` in your generated OpenAPI JSON.**

Once that's confirmed, we'll apply it to one of your actual protected Task Manager routes and see Swagger UI's **Authorize** button and lock icon appear.