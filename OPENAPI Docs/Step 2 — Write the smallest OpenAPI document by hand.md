
### 1. What we're doing right now

We are going to write an OpenAPI document **manually**, with no Express, Swagger UI, `swagger-jsdoc`, or other tooling involved.

The goal is to see the actual data structure that all those tools will eventually work with.

### 2. Why this comes at this exact point

In Step 1, we established that OpenAPI is a **data format**, not a UI or package. Before we let `swagger-jsdoc` generate anything for us, you should be able to recognize the document it is generating.

At its absolute minimum for our purposes, we need three things:

- `openapi` — which OpenAPI specification version this document follows.
    
- `info` — metadata describing the API.
    
- `paths` — where the API's HTTP endpoints are described.
    

### 3. The actual OpenAPI document

Create a temporary file anywhere you like, for example `openapi.yaml`:

```yaml
openapi: 3.0.0

info:
  title: URL Shortener API
  version: 1.0.0
  description: API for creating and resolving shortened URLs.

paths: {}
```

There are only **three top-level concepts** here.

`openapi` tells a parser: _interpret this document according to the OpenAPI 3.0 specification._

`info` describes the API itself. `title` and `version` are required pieces of the `info` object; `description` is optional but useful.

`paths` is where the interesting part eventually goes: your actual API endpoints. `{}` means **we currently have no documented endpoints**.

For example, eventually `paths` will become something conceptually like:

```yaml
paths:
  /links:
    get:
      ...
    post:
      ...
  /links/{id}:
    get:
      ...
```

But **do not add that yet**. We are deliberately starting with an empty `paths` object so you can see the structure develop one layer at a time.

Notice something important: there is **nothing about Express here**.

No:

```text
app.get(...)
router.get(...)
controller
middleware
swagger-ui-express
```

OpenAPI doesn't care how your backend is implemented. It describes the **HTTP interface exposed by your backend**.

### 4. What to check

For this step, simply inspect the YAML and verify that you can identify:

```text
openapi → specification version
info    → API metadata
paths   → API endpoints
```

There should currently be **zero endpoints**.

### Checkpoint

Before we install anything, tell me:

**If our Express application has `GET /links`, where would that information eventually live in this OpenAPI document?**

Don't worry about writing the complete endpoint yet. I want you to identify **which part of the document owns that information**.