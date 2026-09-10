## Step 10 — Connect `GET /tasks` to the `Task` schema

### 1. What we're doing right now

We have defined a reusable `Task` schema, but `GET /tasks` still doesn't tell Swagger what its response data looks like.

Now we'll connect the endpoint to that schema using OpenAPI's **`$ref` mechanism**.

### 2. Why this comes at this exact point

We first created:

```text
components.schemas.Task
```

Now another part of the OpenAPI document can say:

> "The data here follows the schema I already defined as `Task`."

That's exactly what `$ref` means.

Instead of repeating:

```yaml
type: object
properties:
  id:
    type: integer
  title:
    type: string
  ...
```

inside every endpoint, we reference the existing definition:

```yaml
$ref: '#/components/schemas/Task'
```

The path:

```text
#/components/schemas/Task
```

means:

```text
#                       → current OpenAPI document
  components
    schemas
      Task              → this schema
```

So `$ref` is essentially **OpenAPI's pointer to another reusable definition**.

---

## 3. But your API response has a wrapper

There's an important detail from your actual API contract.

Your API doesn't return:

```json
{
  "id": 1,
  "title": "Learn OpenAPI"
}
```

It returns:

```json
{
  "success": true,
  "data": [...]
}
```

and for the list endpoint, you also have:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

So we shouldn't incorrectly say that the entire `200` response is a `Task`.

The **`data` property** contains an array of Tasks.

Therefore we'll use `$ref` for the individual Task objects and describe the response wrapper around it.

---

## 4. The actual code

Go back to:

```text
src/routes/tasks.js
```

Change our existing OpenAPI comment to:

```javascript
/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List all tasks
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

We've introduced several new OpenAPI concepts here, so let's separate them.

### `content`

```yaml
content:
  application/json:
```

This says:

> The `200` response contains JSON.

Your API returns JSON, so we're describing the media type.

### `schema`

```yaml
schema:
  type: object
```

This describes the JSON structure of the response body.

Our response is an object:

```json
{
  "success": true,
  "data": [],
  "meta": {}
}
```

### `data`

Your `data` is an array:

```yaml
data:
  type: array
```

So we need to describe what each array element looks like.

### `items`

For an array, `items` describes **the type of each element**:

```yaml
items:
  $ref: '#/components/schemas/Task'
```

This is where our reusable schema comes in.

We're saying:

> `data` is an array, and every item in that array follows the `Task` schema.

Conceptually:

```text
data
 │
 ├── Task
 ├── Task
 ├── Task
 └── Task
```

and each `Task` is defined only once:

```text
components
   └── schemas
        └── Task
```

---

## 5. The resulting relationship

Our OpenAPI document now has two connected areas:

```text
components
   │
   └── schemas
         │
         └── Task
              ▲
              │
              │ $ref
              │
GET /tasks
   │
   └── 200 response
         │
         └── data[]
                │
                └── Task
```

This is the core reason reusable schemas matter.

If tomorrow you document:

```text
GET /tasks/:id
POST /tasks
PUT /tasks/:id
PATCH /tasks/:id
```

you don't need to redefine all ten Task fields repeatedly.

You can reuse:

```yaml
$ref: '#/components/schemas/Task'
```

wherever appropriate.

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

Expand:

```text
GET /tasks
```

Then expand the `200` response.

Swagger UI should now show a response schema roughly equivalent to:

```text
object
├── success: boolean
├── data: array
│    └── Task
└── meta: object
     ├── total: integer
     ├── page: integer
     ├── limit: integer
     └── totalPages: integer
```

And the **Schemas** section should still contain:

```text
Task
```

You should also see Swagger UI generate an example response based on the schema.

---

### One subtle but important point

We are documenting the **API contract**, not copying your controller's implementation.

Your controller might internally do:

```text
controller
   ↓
service
   ↓
repository
   ↓
PostgreSQL
```

None of that appears here.

OpenAPI only cares about:

```text
HTTP request
      ↓
GET /api/tasks
      ↓
HTTP 200
      ↓
JSON response shape
```

That's exactly where API documentation belongs.

**Stop here and confirm that the `GET /tasks` response now shows `data` as an array of `Task` objects and that the `Task` schema remains visible.**

After that, we'll document **POST `/tasks` and introduce `requestBody`**, which is the same schema-reference idea but flowing in the opposite direction: **client → API instead of API → client**.