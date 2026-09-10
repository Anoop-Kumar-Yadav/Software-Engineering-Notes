## Step 12 — Document `GET /tasks/:id` with a path parameter

Now that `GET /tasks` and `POST /tasks` are documented, we'll move to your first **parameterized endpoint**:

```text
GET /api/tasks/:id
```

### 1. What we're doing right now

We'll document the `id` that appears in the URL:

```text
/api/tasks/42
             ↑
             id
```

In OpenAPI, a value embedded directly in the URL path is called a **path parameter**.

### 2. Why this comes at this exact point

We've already learned:

```text
paths
  ↓
operation
  ↓
responses
  ↓
schemas
  ↓
requestBody
```

Now we're adding another part of the HTTP contract: **parameters**.

OpenAPI's `parameters` field describes values supplied through the URL, query string, headers, or cookies. For this step we're specifically using `in: path`.

The important rule is:

> If a parameter appears in the OpenAPI path as `{id}`, OpenAPI requires that parameter to be explicitly declared with `in: path` and `required: true`.

---

## 3. First understand the Express route

Your existing route is:

```javascript
router.get("/:id", ctrl.getTaskById);
```

Express sees:

```text
/api/tasks/:id
```

and when the request is:

```text
/api/tasks/42
```

Express gives your controller:

```javascript
req.params.id
```

OpenAPI represents the same route differently:

```yaml
/tasks/{id}:
```

The curly braces are OpenAPI's notation for a **path parameter**.

---

## 4. Add the OpenAPI documentation

In:

```text
src/routes/tasks.js
```

add this immediately above:

```javascript
router.get("/:id", ctrl.getTaskById);
```

```javascript
/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
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

We've introduced several things, but focus specifically on:

```yaml
parameters:
  - in: path
    name: id
    required: true
    schema:
      type: integer
```

### `parameters`

This tells OpenAPI:

> This operation accepts additional input parameters.

### `in: path`

This tells OpenAPI **where the parameter comes from**.

Here:

```yaml
in: path
```

means the value is part of the URL itself.

Other locations exist:

```text
path
query
header
cookie
```

We'll use `query` later for your `/tasks` filtering and pagination.

### `name: id`

This must match the parameter name in:

```yaml
/tasks/{id}
```

and your Express route:

```javascript
router.get("/:id", ...)
```

So we have:

```text
/tasks/{id}
       │
       └── name: id
                │
                └── Express :id
```

### `required: true`

A path parameter is inherently required because the URL itself contains it.

You therefore **must** specify:

```yaml
required: true
```

### `schema`

This describes the parameter's data type:

```yaml
schema:
  type: integer
```

Your API uses numeric task IDs, so we're documenting `id` as an integer.

### `example`

```yaml
example: 1
```

This gives Swagger UI a concrete example value.

---

## 5. Notice what we did with the response

We also documented:

```yaml
data:
  $ref: '#/components/schemas/Task'
```

This is the same `$ref` mechanism we learned earlier.

For a single task:

```text
data → Task
```

For the list endpoint:

```text
data → array → Task
```

Same reusable schema, different structure.

---

## 6. What to check

Restart:

```bash
npm start
```

Open:

```text
http://localhost:3000/api-docs
```

You should now see:

```text
GET /tasks/{id}
Get a task by ID
```

Expand it.

Swagger UI should show something like:

```text
Parameters

id *
integer
1
```

Most importantly, click **Try it out**.

You should get an input field for:

```text
id
```

Enter a real task ID, for example:

```text
1
```

and execute it.

Swagger UI should construct a request equivalent to:

```text
GET http://localhost:3000/api/tasks/1
```

---

## One important thing to observe

We have now documented the difference between these two:

```text
GET /tasks
```

and:

```text
GET /tasks/{id}
```

The first has no URL parameter.

The second has:

```text
{id}
```

which requires:

```yaml
parameters:
  - in: path
    name: id
    required: true
```

This same parameter mechanism will become especially useful for your query filters next.

**Stop here and verify that `GET /tasks/{id}` appears and Swagger UI gives you an `id` input under Try it out.**

After that, we'll add the **404 response properly** and use it to understand why `responses` is a map of possible HTTP outcomes rather than just "the response."