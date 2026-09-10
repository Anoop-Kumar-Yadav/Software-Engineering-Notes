
Let's establish the complete **initial setup** in one place. We will still learn it step-by-step, but this gives you the entire Phase B flow so you can see how the pieces connect.

Our stack is:

```text
Express
  │
  ├── Task Manager API
  │
  └── Swagger Documentation
          │
          ├── swagger-jsdoc
          │       ↓
          │   OpenAPI document
          │
          └── swagger-ui-express
                  ↓
              Swagger UI
```

---

## 1. Install the packages

### What we're doing

Install the two packages responsible for generating and displaying our API documentation.

### Why

They have **different responsibilities**:

|Package|Responsibility|
|---|---|
|`swagger-jsdoc`|Generates an OpenAPI document from configuration/JSDoc|
|`swagger-ui-express`|Renders an OpenAPI document as an interactive Swagger UI|

So:

```text
JSDoc/config
     ↓
swagger-jsdoc
     ↓
OpenAPI JSON
     ↓
swagger-ui-express
     ↓
Swagger UI
```

### Code

From the project root:

```bash
npm install swagger-jsdoc swagger-ui-express
```

Verify:

```bash
npm list swagger-jsdoc swagger-ui-express
```

You should see both packages installed.

---

# 2. Create `config/swagger.js`

### What we're doing

Now we create the configuration that represents the **OpenAPI document**.

### Why

Before connecting anything to Express, we want to establish the document itself.

The important idea is:

```text
swagger.js
    ↓
OpenAPI document
```

It isn't Express configuration yet.

### Code

Assuming:

```text
src/
├── config/
│   ├── db.js
│   └── swagger.js
├── controllers/
├── services/
├── repositories/
├── routes/
├── app.js
└── server.js
```

Create:

```text
src/config/swagger.js
```

```javascript
const path = require("path");

const swaggerJsdoc = require("swagger-jsdoc");

  

const routesPath = path.join(__dirname, "../routes/tasks.js");

  

console.log("Swagger scanning:", routesPath);

  

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

},

  

apis: [routesPath],

};

  

const swaggerSpec = swaggerJsdoc(options);

  

console.log(JSON.stringify(swaggerSpec, null, 2));

  

module.exports = swaggerSpec;
```

### Understand the important part

This:

```javascript
definition: {
  openapi: "3.0.0",
  info: { ... },
  servers: [ ... ],
  paths: {},
}
```

is the OpenAPI document.

Conceptually, it produces:

```yaml
openapi: 3.0.0

info:
  title: Task Manager API
  version: 1.0.0
  description: REST API for managing tasks

servers:
  - url: http://localhost:3000/api

paths: {}
```

We have deliberately left:

```javascript
paths: {}
```

empty.

That means:

> "This API currently has no documented endpoints."

Your real Express routes still exist. We simply haven't described them to OpenAPI yet.

---

# 3. Understand `apis: []`

### What we're doing

For now, we tell `swagger-jsdoc` that it has **no JSDoc files to scan**.

```javascript
apis: [],
```

### Why

We're deliberately separating two concepts:

```text
definition
    ↓
What the OpenAPI document contains


apis
    ↓
Where swagger-jsdoc should look for
additional OpenAPI definitions
```

Later we'll change:

```javascript
apis: [],
```

to something like:

```javascript
apis: ["./src/routes/*.js"],
```

Then `swagger-jsdoc` will inspect your route files for OpenAPI JSDoc comments.

But **don't do that yet**.

---

# 4. Connect `swagger.js` to Express

### What we're doing

Now we make Express actually load the Swagger configuration.

### Why

Creating this file:

```text
src/config/swagger.js
```

doesn't automatically execute it.

Node only executes it when something imports it.

So in `app.js`:

```text
app.js
   │
   └── imports swagger.js
             │
             ▼
       swagger-jsdoc
             │
             ▼
        swaggerSpec
```

### Code

Your `app.js` will look approximately like this:

```javascript
const express = require("express");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");

const taskRoutes = require("./routes/task.routes");

const app = express();

app.use(express.json());

app.use("/api/tasks", taskRoutes);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

module.exports = app;
```

The important connection is:

```javascript
const swaggerSpec = require("./config/swagger");
```

and then:

```javascript
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);
```

---

# 5. Understand what Express is doing

This is the part I want you to really understand.

Your application now has two different HTTP areas:

```text
                    Express
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
       /api/tasks            /api-docs
             │                   │
             ▼                   ▼
       Task Manager         Swagger UI
          routes
```

Your actual API:

```text
GET /api/tasks
POST /api/tasks
GET /api/tasks/:id
...
```

is completely separate from:

```text
GET /api-docs
```

The `/api-docs` endpoint doesn't execute your task controller.

Instead:

```text
GET /api-docs
      │
      ▼
swagger-ui-express
      │
      ▼
swaggerSpec
      │
      ▼
HTML + JavaScript Swagger UI
```

And that Swagger UI then uses the OpenAPI document to know what endpoints to display.

---

# 6. The complete initial pipeline

At this point, the architecture is:

```text
                         Your Application
                              │
                              ▼
                            app.js
                              │
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
        /api/tasks                       /api-docs
               │                             │
               ▼                             ▼
        Task Routes                  swagger-ui-express
                                             │
                                             │
                                     swaggerSpec
                                             ▲
                                             │
                                      swagger-jsdoc
                                             ▲
                                             │
                                      swagger.js
                                             │
                                      OpenAPI definition
```

Or, more simply:

```text
swagger.js
    │
    │ OpenAPI definition
    ▼
swagger-jsdoc
    │
    │ generates
    ▼
swaggerSpec
    │
    │ passed to
    ▼
swagger-ui-express
    │
    ▼
/api-docs
```

---

# 7. Test the setup

Start your application:

```bash
npm start
```

Then open:

```text
http://localhost:3000/api-docs
```

You should see the Swagger UI page.

It should show something like:

```text
Task Manager API

REST API for managing tasks

No operations defined in spec!
```

That **is a successful result** at this stage.

Why?

Because we currently have:

```javascript
paths: {}
```

and:

```javascript
apis: []
```

So Swagger UI has been given a perfectly valid OpenAPI document that contains **zero API operations**.

---

# 8. What we've accomplished

We now have the first working documentation pipeline:

```text
                  STEP 1
             OpenAPI concept
                    │
                    ▼
                  STEP 2
          Hand-written OpenAPI
                    │
                    ▼
                  STEP 3
              Install packages
                    │
                    ▼
                  STEP 4
             swagger.js
                    │
                    ▼
              swagger-jsdoc
                    │
                    ▼
              swaggerSpec
                    │
                    ▼
                  app.js
                    │
                    ▼
          swagger-ui-express
                    │
                    ▼
              /api-docs
                    │
                    ▼
             Swagger UI
```

**Nothing about your Task Manager endpoints has been documented yet.** That's intentional.

The next conceptual jump is much more interesting:

```text
Your actual route:

GET /api/tasks
```

needs to become an OpenAPI description:

```yaml
paths:
  /tasks:
    get:
      summary: List tasks
      responses:
        "200":
          description: Tasks retrieved successfully
```

And then we'll make `swagger-jsdoc` discover that description from your actual `task.routes.js`.

**Before we move there, confirm that `/api-docs` loads successfully.** Once it does, we'll begin Phase C with your real `GET /api/tasks` route, one OpenAPI key at a time.