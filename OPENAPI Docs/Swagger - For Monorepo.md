Yes. This is where the distinction between **an OpenAPI document and a Swagger UI** becomes particularly important.

If your monorepo contains multiple independently deployable services, I would generally **give each service its own OpenAPI specification** rather than creating one enormous specification for the entire monorepo.

## 1. Example monorepo

Suppose your backend looks like:

```text
my-platform/
├── apps/
│   ├── task-service/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── swagger.js
│   │   │   ├── routes/
│   │   │   │   └── tasks.js
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── repositories/
│   │   └── package.json
│   │
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── swagger.js
│   │   │   ├── routes/
│   │   │   │   └── users.js
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── notification-service/
│       ├── src/
│       │   ├── config/
│       │   │   └── swagger.js
│       │   ├── routes/
│       │   └── ...
│       └── package.json
│
└── package.json
```

Each service has its own API boundary.

Therefore:

```text
Task Service
    ↓
task-service OpenAPI spec

User Service
    ↓
user-service OpenAPI spec

Notification Service
    ↓
notification-service OpenAPI spec
```

This is usually much cleaner than making one `swagger.js` scan the entire monorepo.

---

# 2. Why one spec per service?

Think about what OpenAPI describes:

> **An HTTP API boundary.**

If these are independently deployable services:

```text
task-service
user-service
notification-service
```

then each has its own API contract.

For example:

```text
Task Service
────────────────────────
GET  /tasks
POST /tasks
GET  /tasks/{id}
DELETE /tasks/{id}
```

while:

```text
User Service
────────────────────────
GET  /users
POST /users
GET  /users/{id}
```

and:

```text
Notification Service
────────────────────────
POST /notifications
GET  /notifications/{id}
```

Each specification can then have its own:

```text
info
servers
paths
components
securitySchemes
```

That gives you:

```text
                    Monorepo
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
     Task Service   User Service  Notification
          │            │            │
          ▼            ▼            ▼
      OpenAPI       OpenAPI       OpenAPI
        spec           spec          spec
```

---

# 3. Each service keeps the same setup

Your Task Service could have:

```text
apps/task-service/
└── src/
    ├── config/
    │   └── swagger.js
    ├── routes/
    │   └── tasks.js
    └── server.js
```

Its `swagger.js` scans **only its own routes**:

```javascript
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const routesPath = path.join(__dirname, "../routes/*.js");

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Task Service API",
      version: "1.0.0",
    },

    servers: [
      {
        url: "http://localhost:3001/api",
      },
    ],

    paths: {},

    components: {
      schemas: {
        // Task schemas
      },
    },
  },

  apis: [routesPath],
};

module.exports = swaggerJsdoc(options);
```

Then:

```text
http://localhost:3001/api-docs
```

is the Task Service documentation.

The User Service independently has:

```text
http://localhost:3002/api-docs
```

and Notification Service:

```text
http://localhost:3003/api-docs
```

---

# 4. What about the API Gateway?

This is where architecture gets interesting.

Suppose your production system looks like:

```text
                       Client
                         │
                         ▼
                    API Gateway
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
       Task Service  User Service  Notification
```

The client might never directly call:

```text
task-service:3001
```

Instead it calls:

```text
api.example.com/tasks
```

In that architecture, you have **two legitimate documentation strategies**.

### Strategy A — Service-level specifications

Each service owns its own spec:

```text
Task Service
    → task-openapi.json

User Service
    → user-openapi.json

Notification Service
    → notification-openapi.json
```

This is the approach I'd recommend as the foundation.

Each team/service owns its own contract.

### Strategy B — Gateway-level aggregate documentation

You can additionally create an API Gateway specification:

```text
api.example.com
│
├── /tasks
├── /users
└── /notifications
```

which presents a unified API to external clients.

Conceptually:

```text
                    Gateway OpenAPI
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
     Task OpenAPI   User OpenAPI   Notification
```

But **don't make this your starting point**.

The gateway specification is an aggregation/product concern. The individual service specs remain valuable because they describe the actual service contracts.

---

# 5. Don't make the monorepo root scan everything

I would avoid something like:

```javascript
apis: [
  "../../apps/**/src/routes/*.js"
]
```

for one giant `swagger.js`.

You'd end up with:

```text
One OpenAPI document
├── Task endpoints
├── User endpoints
├── Notification endpoints
├── Payment endpoints
├── ...
└── 500 more endpoints
```

This creates several problems:

- Service ownership becomes unclear.
    
- Different services may have conflicting schemas or authentication assumptions.
    
- The specification becomes coupled to the monorepo filesystem.
    
- Deploying one service requires understanding the documentation configuration of unrelated services.
    

The filesystem structure of your monorepo should not determine the conceptual ownership of your API contracts.

---

# 6. Shared schemas are a separate question

You may eventually have common concepts:

```text
User
Error
Pagination
ApiResponse
```

Don't immediately create one global Swagger schema package.

There are two different situations.

### Same concept, different API representation

For example, Task Service might return:

```json
{
  "id": 1,
  "title": "Learn OpenAPI"
}
```

while User Service returns:

```json
{
  "id": 10,
  "name": "Anoop"
}
```

Each service owns its schema.

### Genuine shared contract

If several services must consume exactly the same externally defined structure, then you can consider a shared schema/package or a separately versioned contract.

But that is an **API contract/versioning decision**, not merely a Swagger configuration decision.

---

# 7. A good monorepo architecture

For the kind of backend architecture you've been learning, I'd recommend:

```text
backend/
│
├── apps/
│   │
│   ├── task-service/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── db.js
│   │   │   │   └── swagger.js
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   └── tasks.js
│   │   │   │
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   └── middleware/
│   │   │
│   │   └── package.json
│   │
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── swagger.js
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── repositories/
│   │   └── package.json
│   │
│   └── notification-service/
│       ├── src/
│       │   ├── config/
│       │   │   └── swagger.js
│       │   ├── routes/
│       │   ├── controllers/
│       │   └── services/
│       └── package.json
│
├── packages/
│   ├── shared-types/
│   └── ...
│
└── package.json
```

The important part is:

```text
Each service
    │
    ├── owns its routes
    ├── owns its OpenAPI comments
    ├── owns its schemas
    └── generates its own OpenAPI document
```

---

# 8. Where Swagger UI fits

Each service can expose its own documentation during development:

```text
Task Service
http://localhost:3001/api-docs

User Service
http://localhost:3002/api-docs

Notification Service
http://localhost:3003/api-docs
```

Or you can eventually have a central documentation portal:

```text
                    API Documentation
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
         Tasks API      Users API    Notifications
```

That central portal can consume the **already-generated OpenAPI documents**.

Again, this demonstrates why OpenAPI is the important artifact:

```text
service
   ↓
OpenAPI JSON
   ↓
┌───────────────┬────────────────┐
│               │                │
▼               ▼                ▼
Swagger UI    Scalar          Postman
```

You can change the renderer without changing the underlying API contract.

---

## The rule I'd use

For a monorepo with independently deployable Node.js services:

> **One OpenAPI specification per service. One Swagger/Scalar UI per service during development. Optionally aggregate those specifications into a centralized API documentation portal for consumers.**

And importantly, **don't change the layered architecture you've been using**. OpenAPI simply attaches to the route/API boundary:

```text
Route
  │
  ├── Express behavior
  │      ↓
  │   Controller
  │      ↓
  │   Service
  │      ↓
  │   Repository
  │
  └── OpenAPI metadata
          ↓
      swagger-jsdoc
          ↓
      OpenAPI spec
```

That's the same model we just built for the Task Manager; the only difference is that in a monorepo, **each service owns its own instance of that model**.