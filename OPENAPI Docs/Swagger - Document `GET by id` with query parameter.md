## Step 14 — Document the `GET /tasks` query parameters

We need to correct one sequencing detail from the earlier plan: **authentication belongs to the later Phase F**. Right now we're continuing with the remaining HTTP input concepts around your real `GET /tasks` endpoint.

### 1. What we're doing right now

Your list endpoint supports:

```text
GET /api/tasks?status=pending&priority=high&search=meeting&page=1&limit=10
```

We'll document those query-string values in OpenAPI.

### 2. Why this comes at this exact point

We've just learned a **path parameter**:

```text
/tasks/{id}
```

A query parameter is different. It comes **after `?` in the URL** and is used to modify the request without changing the resource path.

For example:

```text
/tasks/{id}
```

means:

> Which specific task?

while:

```text
/tasks?status=pending
```

means:

> Which tasks should I include in the list?

OpenAPI represents query parameters using:

```yaml
parameters:
  - in: query
```

The important new key is **`in: query`**: it tells OpenAPI where the parameter comes from.

---

# 3. Add the parameters

Open:

```text
src/routes/tasks.js
```

Find your existing `GET /tasks` documentation.

Replace it with:

```javascript
/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List all tasks
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, done]
 *
 *       - in: query
 *         name: priority
 *         required: false
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           default: createdAt
 *
 *       - in: query
 *         name: order
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 */
router.get("/", ctrl.getTasks);
```

---

# 4. Understand one parameter before looking at the others

Take:

```yaml
- in: query
  name: status
  required: false
  schema:
    type: string
    enum: [pending, in-progress, done]
```

This represents:

```text
/api/tasks?status=pending
                 │
                 └── status
```

### `in: query`

The value comes from the query string.

### `name: status`

This is the actual parameter name:

```text
?status=pending
```

### `required: false`

The user can omit it:

```text
/api/tasks
```

is valid.

### `schema`

The schema describes the parameter's value:

```yaml
type: string
```

### `enum`

We're restricting it to your application's valid statuses:

```yaml
enum: [pending, in-progress, done]
```

So Swagger UI knows these are the valid choices rather than arbitrary text.

---

# 5. Query parameters are independent

Notice this:

```text
/tasks?status=pending&priority=high&page=1
```

contains **three separate parameters**:

```text
status   → pending
priority → high
page     → 1
```

That's why OpenAPI represents them as multiple entries:

```yaml
parameters:
  - in: query
    name: status
    ...

  - in: query
    name: priority
    ...

  - in: query
    name: page
    ...
```

They aren't part of the path:

```yaml
/tasks:
```

They are additional inputs to the `GET` operation.

---

# 6. Why `default` isn't the same as `required`

For example:

```yaml
name: page
required: false
schema:
  type: integer
  default: 1
```

means:

> The client doesn't have to provide `page`; if omitted, the API's documented default is `1`.

So:

```text
/api/tasks
```

and:

```text
/api/tasks?page=1
```

are both valid.

Your backend still needs to implement that default. OpenAPI is documenting the behavior; it isn't executing the pagination logic.

---

# 7. What to check

Restart:

```bash
npm start
```

Open:

```text
http://localhost:3000/api-docs
```

Expand:

```text
GET /tasks
```

Click:

```text
Try it out
```

You should now see interactive fields for:

```text
status
priority
category
search
sortBy
order
page
limit
```

Swagger UI should allow you to enter something like:

```text
status = pending
priority = high
page = 1
limit = 5
```

and generate a request equivalent to:

```text
/api/tasks?status=pending&priority=high&page=1&limit=5
```

---

## One thing to notice

We now have **two different kinds of parameters** in our API:

|Parameter type|Example|OpenAPI|
|---|---|---|
|Path parameter|`/tasks/42`|`in: path`|
|Query parameter|`/tasks?page=1`|`in: query`|

That distinction is fundamental to API documentation.

**Stop here and verify that the eight query parameters appear in Swagger UI under `GET /tasks → Try it out`.**

After that, we'll move to the authentication phase and introduce **`components.securitySchemes`**, then apply a bearer/JWT security requirement to a protected operation.