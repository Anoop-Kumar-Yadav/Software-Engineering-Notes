## Step 9 — Define the reusable `Task` schema

### 1. What we're doing right now

Your API returns **Task objects**, so we're going to describe what a Task looks like in OpenAPI.

We'll add a reusable schema named `Task` under `components.schemas`. We are defining the shape **once**, rather than repeating the same fields every time an endpoint returns a task.

### 2. Why this comes at this exact point

Until now, our documentation only says:

```yaml
200:
  description: Tasks retrieved successfully
```

That tells the reader _that_ a response exists, but not **what data is inside it**.

OpenAPI's `components.schemas` provides a reusable place for data models:

```text
components
   │
   └── schemas
         │
         └── Task
               │
               ├── id
               ├── title
               ├── description
               ├── status
               ├── priority
               ├── category
               ├── tags
               ├── dueDate
               ├── createdAt
               └── updatedAt
```

This is an **OpenAPI concept**, not a `swagger-jsdoc` concept.

`swagger-jsdoc` will simply take this structure and put it into the generated OpenAPI document.

---

# 3. The actual code

Open:

```text
src/config/swagger.js
```

and change it to:

```javascript
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const routesPath = path.join(__dirname, "../routes/tasks.js");

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Task Manager API",
      version: "1.0.0",
      description: "REST API for managing tasks",
    },

    servers: [
      {
        url: "http://localhost:3000/api",
      },
    ],

    paths: {},

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
              example: "Add OpenAPI documentation to the Task Manager API",
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
              example: ["nodejs", "express", "api"],
            },

            dueDate: {
              type: "string",
              format: "date-time",
              example: "2026-09-01T18:00:00Z",
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
      },
    },
  },

  apis: [routesPath],
};

const swaggerSpec = swaggerJsdoc(options);

console.log(JSON.stringify(swaggerSpec, null, 2));

module.exports = swaggerSpec;
```

---

## 4. Understand what we just created

The important OpenAPI structure is:

```yaml
components:
  schemas:
    Task:
      type: object
      properties:
        id:
          type: integer
        title:
          type: string
        status:
          type: string
```

### `components`

`components` is OpenAPI's container for **reusable definitions**.

We're starting with schemas, but it can eventually contain other reusable things such as security schemes.

### `schemas`

`schemas` contains reusable **data structures**.

We're creating:

```yaml
Task:
```

The name `Task` is ours. It is simply the name we'll use when referring to this schema later.

### `type: object`

This says:

> A Task is represented as a JSON object.

### `properties`

`properties` describes the fields inside that object.

For example:

```yaml
status:
  type: string
  enum:
    - pending
    - in-progress
    - done
```

The `enum` is important because your API doesn't accept arbitrary status strings.

We're telling OpenAPI:

> `status` is a string, but its allowed values are only these three.

Likewise:

```yaml
priority:
  type: string
  enum:
    - low
    - medium
    - high
```

### `tags`

Your `tags` field is an array, so we describe it as:

```yaml
tags:
  type: array
  items:
    type: string
```

This means:

```json
{
  "tags": ["nodejs", "express", "postgres"]
}
```

is valid.

But:

```json
{
  "tags": [1, 2, 3]
}
```

would not match this schema.

### `format`

For dates we're using:

```yaml
type: string
format: date-time
```

The underlying JSON value is still a **string**. `date-time` gives OpenAPI additional semantic information about the expected format.

---

## 5. One important distinction: schema vs database model

Don't confuse our OpenAPI `Task` schema with your PostgreSQL model.

They describe related things, but they serve different purposes:

```text
PostgreSQL
    ↓
Database representation


Application model
    ↓
Backend representation


OpenAPI Task schema
    ↓
HTTP API representation
```

For example, your database might store a timestamp using PostgreSQL's `timestamp` type, while the API exposes it as an ISO date-time string.

OpenAPI is describing **what crosses the HTTP boundary**.

---

## 6. What to check

Restart:

```bash
npm start
```

Look at your generated JSON.

You should now have:

```json
"components": {
  "schemas": {
    "Task": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer"
        },
        "title": {
          "type": "string"
        }
      }
    }
  }
}
```

The complete output will contain all of the fields we defined.

Then open:

```text
http://localhost:3000/api-docs
```

Scroll toward the bottom.

You should now see a **Schemas** section containing:

```text
Task
```

Expand it and you should see fields such as:

```text
id
title
description
status
priority
category
tags
dueDate
createdAt
updatedAt
```

### Important

The `Task` schema isn't being displayed as the response of `GET /tasks` yet.

We've **only defined it**.

The next step will connect the two:

```text
GET /tasks
     │
     ▼
200 response
     │
     ▼
$ref
     │
     ▼
components.schemas.Task
```

That is where you'll see why reusable schemas are useful.

**Stop here and confirm that `Task` appears under the Swagger UI's `Schemas` section.**