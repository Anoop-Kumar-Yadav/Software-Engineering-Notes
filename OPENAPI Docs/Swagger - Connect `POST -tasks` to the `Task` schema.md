Yes. The important thing is that the **`CreateTaskInput` schema and the `POST /tasks` documentation go in two different files**.

## 1. `src/config/swagger.js` → define the schema

This is where reusable OpenAPI schemas live.

Your structure should be:

```text
src/
├── config/
│   └── swagger.js        ← CreateTaskInput goes here
├── controllers/
│   └── taskController.js
├── routes/
│   └── tasks.js           ← POST documentation goes here
└── server.js
```

In `src/config/swagger.js`, you already have:

```javascript
components: {
  schemas: {
    Task: {
      // your existing Task schema
    },
  },
},
```

Add `CreateTaskInput` **inside the same `schemas` object**, immediately after `Task`:

```javascript
components: {
  schemas: {
    Task: {
      type: "object",

      properties: {
        id: {
          type: "integer",
          example: 1,
        },

        title: {
          type: "string",
          example: "Finish API documentation",
        },

        description: {
          type: "string",
          example: "Add OpenAPI documentation",
        },

        status: {
          type: "string",
          enum: ["pending", "in-progress", "done"],
          example: "pending",
        },

        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          example: "high",
        },

        category: {
          type: "string",
          example: "backend",
        },

        tags: {
          type: "array",
          items: {
            type: "string",
          },
          example: ["nodejs", "express"],
        },

        dueDate: {
          type: "string",
          format: "date-time",
        },

        createdAt: {
          type: "string",
          format: "date-time",
        },

        updatedAt: {
          type: "string",
          format: "date-time",
        },
      },
    },

    // ADD IT HERE
    CreateTaskInput: {
      type: "object",

      required: ["title"],

      properties: {
        title: {
          type: "string",
          example: "Learn OpenAPI",
        },

        description: {
          type: "string",
          example: "Understand OpenAPI and Swagger UI",
        },

        status: {
          type: "string",
          enum: ["pending", "in-progress", "done"],
          example: "pending",
        },

        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          example: "high",
        },

        category: {
          type: "string",
          example: "backend",
        },

        tags: {
          type: "array",
          items: {
            type: "string",
          },
          example: ["nodejs", "express", "openapi"],
        },

        dueDate: {
          type: "string",
          format: "date-time",
          example: "2026-09-01T18:00:00Z",
        },
      },
    },
  },
},
```

So conceptually:

```text
swagger.js
└── components
    └── schemas
        ├── Task
        └── CreateTaskInput   ← NEW
```

---

## 2. `src/routes/tasks.js` → document the POST endpoint

Your route file already has:

```javascript
router.post("/", ctrl.createTask);
```

Put the OpenAPI comment **immediately above that route**:

```javascript
/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskInput'
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post("/", ctrl.createTask);
```

So the route file becomes conceptually:

```text
tasks.js

GET /tasks
   └── @swagger documentation

POST /tasks
   └── @swagger documentation  ← NEW

GET /tasks/:id
   └── later

PUT /tasks/:id
   └── later

...
```

---

## 3. Why are they in different files?

This is an important architectural distinction.

### `swagger.js`

Defines **reusable things**:

```text
Task
CreateTaskInput
Later:
UpdateTaskInput
Error
PaginationMeta
Security schemes
...
```

### `tasks.js`

Describes **what each HTTP endpoint does**:

```text
GET /tasks
POST /tasks
GET /tasks/{id}
PUT /tasks/{id}
...
```

The endpoint then references the reusable schema:

```text
POST /tasks
     │
     ▼
requestBody
     │
     ▼
$ref
     │
     ▼
components.schemas.CreateTaskInput
```

So you are **not putting `CreateTaskInput` inside `tasks.js`**.

You define it once in:

```text
src/config/swagger.js
```

and reference it from:

```text
src/routes/tasks.js
```

### After adding both

Restart:

```bash
npm start
```

Then open:

```text
http://localhost:3000/api-docs
```

You should see:

```text
GET  /tasks
POST /tasks
```

and under **Schemas**:

```text
CreateTaskInput
Task
```

If that works, **don't add anything else yet**. We'll then move to path parameters with your actual `GET /tasks/:id`.