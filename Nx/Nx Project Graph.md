# Lesson 9: Nx Project Graph

In the previous lessons, we learned that Nx manages multiple projects, and each project has its own configuration and targets.

However, Nx needs to understand more than just the existence of projects:

> Which project depends on which other project?

This relationship is represented through the Nx Project Graph.

## 1. Why Does Nx Need a Project Graph?

Consider a monorepo for your URL-shortener platform:

```
url-platform/
├── apps/
│   ├── api-gateway/
│   ├── url-service/
│   └── auth-service/
└── libs/
    ├── logger/
    ├── config/
    └── contracts/
```

Suppose the projects have these dependencies:

- `api-gateway` uses `logger`
    
- `api-gateway` uses `contracts`
    
- `url-service` uses `logger`
    
- `url-service` uses `config`
    
- `url-service` uses `contracts`
    
- `auth-service` uses `logger`
    

Nx must know these relationships to answer questions such as:

- Which projects are affected by a code change?
    
- Which projects need to be built?
    
- Which projects need to be tested?
    
- In what order should tasks execute?
    
- Which libraries are shared by several applications?
    
- Can tasks be cached and reused safely?
    

Without dependency information, Nx would have to treat the entire repository as one large unrelated collection of files.

The project graph gives Nx a structured view of the workspace.

# 2. What Is the Project Graph?

The Project Graph is a directed graph representing relationships between projects inside an Nx workspace.

It consists of:

1. Nodes
    
2. Edges
    

## Nodes

Each node represents one Nx project.

For example:

```
api-gateway
url-service
auth-service
logger
config
contracts
```

Both applications and libraries can be nodes in the graph.

Therefore:

> A project graph contains application projects and library projects together.

## Edges

An edge represents a dependency between two projects.

For example:

```
url-service ──depends on──▶ logger
```

This means that `url-service` uses something provided by the `logger` project.

The dependency may come from:

- An import from another library
    
- A project configuration reference
    
- A generated project relationship
    
- A plugin-specific dependency
    
- Another recognized project-level relationship
    

At the basic level, the important idea is:

> An edge tells Nx that one project relies on another project.

# 3. Example Project Graph

Assume the following dependencies:

```
api-gateway
    ├── logger
    └── contracts

url-service
    ├── logger
    ├── config
    └── contracts

auth-service
    └── logger
```

Nx can represent the relationships conceptually as:

```
                 ┌────────────┐
                 │  logger    │
                 └─────▲──────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          │            │            │
┌─────────┴──────┐ ┌───┴────────┐ ┌─┴─────────────┐
│  api-gateway   │ │ url-service│ │ auth-service  │
└─────────┬──────┘ └────┬───────┘ └───────────────┘
          │             │
          ▼             ├──────────────▶ config
      contracts         │
                        └──────────────▶ contracts
```

A simpler representation is:

```
api-gateway ──imports──▶ logger
api-gateway ──imports──▶ contracts

url-service ──imports──▶ logger
url-service ──imports──▶ config
url-service ──imports──▶ contracts

auth-service ──imports──▶ logger
```

The arrows describe project dependencies, not execution flow.

# 4. Dependency Direction

Suppose `url-service` imports a function from `logger`:

TypeScript

```
import { logger } from '@url-platform/logger';
```

Then the dependency direction is:

```
url-service ──▶ logger
```

It does not mean:

```
logger ──▶ url-service
```

The direction is determined by the project that consumes the code.

## Example

```
libs/logger/src/index.ts
```

contains:

TypeScript

```
export function createLogger() {
  return {
    info(message: string) {
      console.log(message);
    },
  };
}
```

Then `url-service` consumes it:

TypeScript

```
import { createLogger } from '@url-platform/logger';

const logger = createLogger();

logger.info('URL service started');
```

The resulting project relationship is:

```
url-service ──▶ logger
```

The `logger` library does not depend on `url-service` merely because `url-service` uses it.

# 5. Project Graph vs Runtime Communication

This distinction is extremely important for microservices.

Consider:

```
api-gateway
      │
      │ HTTP request
      ▼
url-service
```

At runtime, the API gateway may communicate with the URL service through:

- HTTP
    
- TCP
    
- gRPC
    
- Message brokers
    
- Redis streams
    
- RabbitMQ
    
- Kafka
    
- Another transport mechanism
    

This is runtime communication.

It does not automatically mean that `api-gateway` imports the implementation of `url-service`.

For example:

TypeScript

```
const response = await fetch('http://url-service:3000/urls');
```

This code communicates with `url-service` over the network.

It does not necessarily create a TypeScript project dependency on the `url-service` source code.

The graph may therefore look like:

```
api-gateway ──imports──▶ contracts
api-gateway ──imports──▶ logger

url-service ──imports──▶ contracts
url-service ──imports──▶ logger
```

While the runtime architecture may be:

```
api-gateway ──HTTP/TCP──▶ url-service
```

These are two different types of relationships.

|  
Relationship

|

Meaning

|  
| --- | --- |  
|

Project-graph dependency

|

One project uses code or configuration from another project

|  
|

Runtime communication

|

One running service communicates with another running service

|  
|

Import dependency

|

A source file consumes code from another project

|  
|

Network dependency

|

A service requires another running service to complete an operation

|

A microservice can communicate with another microservice without importing its internal source code.

This is usually desirable because it preserves service boundaries.

# 6. Shared Contracts and the Project Graph

In a microservices monorepo, you may create a shared contracts library:

```
libs/contracts/
```

It may contain DTOs, message structures, or API contracts:

TypeScript

```
export interface CreateShortUrlRequest {
  originalUrl: string;
}

export interface CreateShortUrlResponse {
  shortCode: string;
}
```

Both applications may use it:

```
api-gateway ──▶ contracts
url-service ──▶ contracts
```

The runtime flow may be:

```
Client
  │
  ▼
api-gateway
  │
  │ network request
  ▼
url-service
```

But the source-code dependency is:

```
api-gateway ──▶ contracts ◀── url-service
```

The shared contract library allows both projects to agree on data structures without sharing their internal business logic.

A healthy architecture generally avoids this:

```
api-gateway ──▶ url-service internal implementation
```

Instead, it prefers:

```
api-gateway ──▶ contracts
url-service ──▶ contracts
```

# 7. How Nx Builds the Project Graph

Nx examines the workspace and gathers project information from several sources, such as:

- Project configuration
    
- Project definitions
    
- Source-code imports
    
- Workspace plugins
    
- Recognized configuration references
    
- Other project-graph processors
    

It then constructs a graph containing:

```
Project nodes
+
Dependency edges
```

Conceptually:

```
Workspace files
      │
      ▼
Project discovery
      │
      ▼
Dependency analysis
      │
      ▼
Project Graph
```

The exact discovery and analysis process depends on the Nx version and the plugins installed in the workspace, but the fundamental result is the same:

> Nx builds a model of the projects and the relationships between them.

# 8. Why the Project Graph Matters

Suppose you modify the shared `logger` library:

```
libs/logger/src/index.ts
```

The graph tells Nx which projects depend on `logger`:

```
api-gateway ──▶ logger
url-service ──▶ logger
auth-service ──▶ logger
```

Therefore, the change may affect:

```
api-gateway
url-service
auth-service
```

But an unrelated project that does not depend on `logger` may not need to be rebuilt or tested.

The project graph is therefore the foundation for many advanced Nx capabilities, including:

- Dependency analysis
    
- Affected-project detection
    
- Task scheduling
    
- Build optimization
    
- Dependency visualization
    
- Architectural enforcement
    

These features will be studied separately.

## Core Mental Model

```
Nx Workspace
      │
      ▼
Projects
      │
      ▼
Dependencies between projects
      │
      ▼
Project Graph
```

Or:

```
Node = Project
Edge = Project dependency
```

The most important distinction for your microservices architecture is:

```
Project Graph:
api-gateway ──imports──▶ contracts

Runtime Architecture:
api-gateway ──HTTP/TCP──▶ url-service
```

The first represents source-code dependency.

The second represents service-to-service communication.

### Core takeaway

> Nx’s Project Graph is a dependency map of the workspace. It helps Nx understand which projects use which other projects, while remaining separate from the runtime network communication between independently running microservices.

Next single concept: How Nx detects dependencies between projects.