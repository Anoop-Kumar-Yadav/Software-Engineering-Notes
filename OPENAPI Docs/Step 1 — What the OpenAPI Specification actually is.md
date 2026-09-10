

Before installing anything, we need to establish the **actual thing we are building**.

The **OpenAPI Specification (OAS)** is a standardized data format for describing an HTTP API. It is normally represented as JSON or YAML and describes things such as:

- what URL paths exist
    
- which HTTP operations exist on those paths
    
- what parameters they accept
    
- what request bodies look like
    
- what responses look like
    
- what authentication mechanisms are available
    
- reusable schemas for request/response data
    

The crucial distinction is:

> **OpenAPI is the API description. Swagger UI is only a UI that renders that description.**

Think of the architecture as:

```text
Your API
   │
   │  actual HTTP behavior
   ▼
Express routes/controllers
   

OpenAPI document
   │
   │  describes the API
   ▼
Swagger UI
   │
   │  renders the document
   ▼
Interactive documentation
```

Swagger UI does **not** inspect your Express routes and magically understand your application. If the OpenAPI document says nothing about `GET /links`, Swagger UI has nothing to render for that endpoint.

Later, we will introduce `swagger-jsdoc`, but it is important that you understand its role separately:

```text
JSDoc comments
      │
      ▼
swagger-jsdoc
      │
      ▼
OpenAPI JSON document
      │
      ▼
swagger-ui-express
      │
      ▼
Swagger UI
```

So there are really **two separate jobs**:

|Piece|Job|
|---|---|
|OpenAPI Specification|Defines the structured description of your API|
|`swagger-jsdoc`|Generates that description from JSDoc comments|
|`swagger-ui-express`|Gives Express a UI that renders the description|

This separation will become extremely useful when something goes wrong. For example, if an endpoint is missing from Swagger UI, we can ask: **is the OpenAPI document wrong, or is the renderer wrong?** Usually the renderer is innocent.

### Version check

As of today, the npm package versions are:

- `swagger-jsdoc` **6.3.0** — its current documentation explicitly supports OpenAPI 3.x. ([npm](https://www.npmjs.com/package/swagger-jsdoc?utm_source=chatgpt.com "swagger-jsdoc - npm"))
    
- `swagger-ui-express` **5.0.1** — the current npm `latest` release. ([npm](https://www.npmjs.com/package/swagger-ui-express?utm_source=chatgpt.com "swagger-ui-express - npm"))
    
- The underlying Swagger UI itself has current releases supporting OpenAPI 3.1 as well, but `swagger-jsdoc`'s documented examples and workflow are centered around OpenAPI 3.x. ([npm](https://www.npmjs.com/package/swagger-jsdoc?utm_source=chatgpt.com "swagger-jsdoc - npm"))
    

For this learning path, we'll deliberately target **OpenAPI 3.0.0**. That keeps the specification and tooling behavior straightforward while you learn the fundamentals. We can discuss 3.1 later rather than introducing compatibility questions before you understand the core model.

One more architectural point for later: **Scalar** (`@scalar/express-api-reference`) can be used as an alternative renderer for the same OpenAPI document. That reinforces the principle we're establishing now: _the OpenAPI document is the important artifact; Swagger UI is only one way to display it._

---
