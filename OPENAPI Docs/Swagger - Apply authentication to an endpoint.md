## Step 16 — Apply authentication to an endpoint

One correction before we proceed: your reference API doesn't show authentication middleware, so I won't pretend a specific Task Manager route is actually protected. We'll learn the OpenAPI mechanism using `GET /tasks/{id}` as the example, and you can apply it only if your real application has authentication on that route.

### 1. What we're doing right now

We already defined:

```text
components.securitySchemes.bearerAuth
```

Now we'll tell OpenAPI that a **specific operation requires that authentication scheme**.

The new OpenAPI key is `security`.

### 2. Why this comes at this exact point

`securitySchemes` answers:

> **How can the client authenticate?**

`security` answers:

> **Which authentication mechanism does this operation require?**

So:

```text
components.securitySchemes
        │
        │ defines
        ▼
    bearerAuth
        │
        │ referenced by
        ▼
     security
        │
        ▼
GET /tasks/{id}
```

This distinction is important because defining a security scheme **does not automatically protect every endpoint**.

---

## 3. Add `security` to the endpoint

In:

```text
src/routes/tasks.js
```

take your existing `GET /tasks/{id}` documentation.

Add:

```yaml
security:
  - bearerAuth: []
```

So the endpoint becomes:

```javascript
/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
router.get("/:id", ctrl.getTaskById);
```

The new part is:

```yaml
security:
  - bearerAuth: []
```

### Why the array?

OpenAPI's `security` structure is designed to represent security requirements and combinations of security schemes.

For our simple case:

```yaml
security:
  - bearerAuth: []
```

means:

> This operation requires the `bearerAuth` security scheme.

The empty array is correct for this HTTP bearer scheme; it is not a missing value.

---

# 4. What Swagger UI should now do

Restart:

```bash
npm start
```

Open:

```text
http://localhost:3000/api-docs
```

You should now see an **Authorize** button near the top of Swagger UI.

You should also see a **lock icon** associated with the protected `GET /tasks/{id}` operation.

That's Swagger UI interpreting:

```yaml
security:
  - bearerAuth: []
```

from your OpenAPI document.

---

## 5. Try the authorization flow

Click:

```text
Authorize
```

Swagger UI should show your:

```text
bearerAuth
```

security scheme.

You can enter a real token if your application actually has JWT authentication configured.

Swagger UI will then construct requests with:

```http
Authorization: Bearer <your-token>
```

when you use **Try it out** on the protected operation.

---

## 6. Important distinction: Swagger doesn't protect your API

This is one of the most important things to understand.

Adding:

```yaml
security:
  - bearerAuth: []
```

does **not** make your Express route secure.

It only tells API consumers:

> "This endpoint expects bearer authentication."

Your real protection still has to exist in Express:

```text
HTTP Request
     │
     ▼
authentication middleware
     │
     ├── valid token ──► controller
     │
     └── invalid token ─► 401
```

OpenAPI describes that contract:

```text
GET /tasks/{id}
       │
       └── security: bearerAuth
```

Swagger UI then uses that description to construct the appropriate request.

---

## 7. One subtle point for your actual project

If your application currently has **no JWT authentication middleware**, don't leave this security requirement in your documentation merely because Swagger supports it.

Documentation should describe **reality**.

If your actual route is:

```javascript
router.get("/:id", ctrl.getTaskById);
```

with no authentication middleware, then documenting it as requiring JWT would be an incorrect API contract.

In that case, we can remove the `security` block for now and introduce authentication later when your application actually has it.

---

### What to check

Verify all three:

1. Swagger UI shows the **Authorize** button.
    
2. `GET /tasks/{id}` has a **lock icon**.
    
3. The generated OpenAPI JSON contains:
    

```json
"security": [
  {
    "bearerAuth": []
  }
]
```

If your application genuinely has JWT authentication, use a real token with **Try it out** and verify the request contains the `Authorization` header.

**Stop here.** Once this works, we've completed the core OpenAPI concepts: paths, operations, schemas, `$ref`, request bodies, parameters, responses, and security. The next step is **Phase G: how to scale this documentation across all your Task Manager routes without turning `tasks.js` into an unmaintainable file.**