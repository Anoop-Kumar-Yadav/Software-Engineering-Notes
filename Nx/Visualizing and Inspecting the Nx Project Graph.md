# Lesson 11: Visualizing and Inspecting the Nx Project Graph

In the previous lessons, we learned:

- Nx maintains a list of projects.
    
- Projects can depend on other projects.
    
- Nx detects these relationships and constructs a Project Graph.
    

Now we will learn how to inspect and visualize that graph.

## 1. Why Visualize the Project Graph?

In a small workspace, dependencies are easy to understand:

```
url-service ──▶ logger
```

But a real monorepo may contain:

```
api-gateway
url-service
auth-service
user-service
notification-service
logger
config
database
contracts
testing
common
```

A project may depend on several libraries, and those libraries may depend on other libraries.

For example:

```
url-service ──▶ common ──▶ logger
     │            │
     │            └──────▶ config
     │
     └──────────────▶ database
```

As the workspace grows, manually tracking these relationships becomes difficult.

The project graph visualization helps you answer:

- Which projects exist in the workspace?
    
- Which libraries does a project depend on?
    
- Which applications use a particular library?
    
- Are there unexpected dependencies?
    
- Is a project depending on another project in an undesirable direction?
    
- Which projects are highly shared?
    

# 2. Opening the Project Graph

Nx provides a graph visualization command:

Bash

```
nx graph
```

Depending on the Nx version and workspace setup, this opens an interactive graph in a browser or displays the graph through the Nx interface.

The graph generally represents:

- Applications
    
- Libraries
    
- Project dependencies
    
- Relationships between projects
    

A conceptual graph may look like this:

```
┌──────────────┐
│ api-gateway  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  contracts   │
└──────────────┘


┌──────────────┐
│ url-service  │
└───┬────┬─────┘
    │    │
    ▼    ▼
┌──────┐ ┌────────┐
│logger│ │ config │
└──────┘ └────────┘
```

The actual interface may provide additional controls for filtering and exploring the graph.

## 3. Project Graph Example

Assume your URL-shortener monorepo contains these projects:

```
apps/
├── api-gateway/
├── url-service/
└── auth-service/

libs/
├── logger/
├── config/
├── contracts/
└── common/
```

Suppose the dependencies are:

```
api-gateway ──▶ logger
api-gateway ──▶ contracts

url-service ──▶ common
url-service ──▶ config
url-service ──▶ contracts

auth-service ──▶ logger

common ──▶ logger
common ──▶ config
```

The graph can be represented as:

```
                         ┌─────────────┐
                         │   logger    │
                         └──────▲──────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
                 │              │              │
          ┌──────┴─────┐ ┌──────┴─────┐ ┌──────┴──────┐
          │ api-gateway│ │   common   │ │ auth-service│
          └──────┬─────┘ └──────▲─────┘ └─────────────┘
                 │              │
                 ▼              │
          ┌─────────────┐       │
          │  contracts  │◀──────┘
          └──────▲──────┘
                 │
          ┌──────┴─────┐
          │ url-service│
          └──────┬─────┘
                 │
                 ▼
             ┌────────┐
             │ config │
             └────────┘
```

The graph is not primarily showing which service calls another service over the network.

It is showing how the source code and project configuration are related.

# 4. Selecting a Project

When inspecting the graph, you can conceptually start from a particular project, such as:

```
url-service
```

You may want to inspect its dependencies:

```
url-service
    ├── common
    ├── config
    └── contracts
```

This tells you what `url-service` consumes directly.

You can then inspect the dependencies of `common`:

```
common
    ├── logger
    └── config
```

This reveals an indirect relationship:

```
url-service
    │
    ▼
  common
    │
    ▼
  logger
```

Therefore, even though `url-service` may not directly import `logger`, it may still rely on `logger` through `common`.

# 5. Direct Dependencies in the Graph

A direct dependency is represented by a direct edge.

Example:

```
url-service ──▶ contracts
```

This means that `url-service` directly consumes something from `contracts`.

Possible source code:

TypeScript

```
import type {
  CreateShortUrlRequest,
} from '@url-platform/contracts';
```

The direct relationship is:

```
url-service → contracts
```

# 6. Indirect Dependencies in the Graph

Suppose:

```
url-service ──▶ common
common ──▶ logger
```

Then the dependency chain is:

```
url-service → common → logger
```

Here:

- `common` is a direct dependency of `url-service`.
    
- `logger` is an indirect or transitive dependency of `url-service`.
    

This distinction matters when investigating changes.

If `logger` changes, the impact may travel through `common` and reach `url-service`.

# 7. Identifying Unexpected Dependencies

A graph is also useful for identifying architectural problems.

Consider this dependency:

```
logger ──▶ url-service
```

This would be suspicious if `logger` is intended to be a generic shared library.

A more appropriate direction is:

```
url-service ──▶ logger
```

The generic library should not depend on the application that consumes it.

Another problematic structure could be:

```
common ──▶ api-gateway
```

If `common` is intended to be reusable by multiple applications, depending on `api-gateway` makes it tightly coupled to one application.

A healthier direction would be:

```
api-gateway ──▶ common
```

The graph helps expose such relationships visually.

# 8. Project Graph and Microservice Boundaries

Suppose your runtime architecture is:

```
Client
  │
  ▼
api-gateway
  │
  │ HTTP/TCP
  ▼
url-service
```

The runtime communication is:

```
api-gateway ──network request──▶ url-service
```

But the Nx graph may contain:

```
api-gateway ──▶ contracts
url-service ──▶ contracts
```

This is a healthy arrangement when both applications share only communication contracts.

The graph should not necessarily contain:

```
api-gateway ──▶ url-service internal code
```

because that would couple the gateway to the implementation of the URL service.

A useful separation is:

```
Source-code dependency:

api-gateway ──▶ contracts ◀── url-service

Runtime communication:

api-gateway ──HTTP/TCP──▶ url-service
```

The project graph helps inspect repository-level coupling, while the runtime architecture describes service-level communication.

## Core Takeaway

> The `nx graph` command allows you to inspect the relationships between projects in an Nx workspace. It helps identify direct dependencies, transitive dependencies, shared libraries, and potentially incorrect architectural relationships.

The graph is especially useful in a microservices monorepo because it lets you distinguish:

```
Shared source-code dependency
```

from:

```
Runtime service-to-service communication
```

Next single concept: The difference between the Project Graph and the Task Graph in Nx.