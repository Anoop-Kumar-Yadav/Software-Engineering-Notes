# Lesson 12: Project Graph vs Task Graph

Nx uses two important types of graphs:

1. Project Graph
    
2. Task Graph
    

They are related, but they represent different things.

## 1. Project Graph

The Project Graph describes relationships between projects in the workspace.

It answers:

> Which project depends on which other project?

Example:

```
url-service ──▶ logger
url-service ──▶ config
url-service ──▶ contracts
```

Here:

- `url-service` is an application project.
    
- `logger`, `config`, and `contracts` are library projects.
    
- The arrows represent source-code or project-level dependencies.
    

The project graph is relatively stable. It changes when you:

- Add or remove a project.
    
- Add or remove an import.
    
- Change project configuration.
    
- Change library relationships.
    

## 2. Task Graph

The Task Graph describes relationships between specific operations that Nx needs to execute.

It answers:

> Which task must run before another task?

A task is an operation such as:

```
url-service:build
url-service:test
url-service:lint
logger:build
contracts:build
```

A task is identified using this format:

```
project:target
```

For example:

```
url-service:build
```

means:

> Execute the `build` target of the `url-service` project.

# 3. Example: Building `url-service`

Assume the source-code project graph is:

```
url-service ──▶ common
common ──▶ logger
```

Now suppose you execute:

Bash

```
nx build url-service
```

Nx must determine which tasks are required.

Conceptually, it may need to execute:

```
logger:build
       │
       ▼
common:build
       │
       ▼
url-service:build
```

This forms a Task Graph:

```
logger:build
      │
      ▼
common:build
      │
      ▼
url-service:build
```

The task graph is not simply a list of projects. It contains specific operations for those projects.

## 4. Main Difference

|  
Project Graph

|

Task Graph

|  
| --- | --- |  
|

Represents projects

|

Represents tasks

|  
|

Describes project dependencies

|

Describes task execution dependencies

|  
|

Node example: `url-service`

|

Node example: `url-service:build`

|  
|

Edge example: `url-service → logger`

|

Edge example: `logger:build → url-service:build`

|  
|

Focuses on workspace structure

|

Focuses on execution order

|  
|

Helps Nx understand architecture

|

Helps Nx schedule operations

|

A simple comparison:

```
Project Graph:

url-service ──▶ logger

Task Graph:

logger:build ──▶ url-service:build
```

The first describes dependency between projects.

The second describes dependency between tasks.

# 5. One Project Can Have Many Tasks

A single project can have several targets:

JSON

```
{
  "name": "url-service",
  "targets": {
    "build": {},
    "serve": {},
    "test": {},
    "lint": {}
  }
}
```

This creates possible tasks such as:

```
url-service:build
url-service:serve
url-service:test
url-service:lint
```

These are different tasks even though they belong to the same project.

The project is:

```
url-service
```

The tasks are:

```
url-service:build
url-service:test
url-service:lint
```

Therefore:

> A project is a workspace entity, while a task is an operation performed for that project.

# 6. Task Dependencies

Suppose `url-service:build` depends on `common:build`.

The task relationship is:

```
common:build
      │
      ▼
url-service:build
```

Nx understands that it should not execute the dependent task before its prerequisite task is ready.

For example:

```
1. Build common
2. Build url-service
```

The task graph allows Nx to determine this execution order.

If two tasks do not depend on each other, Nx may be able to execute them in parallel.

Example:

```
logger:build ───────▶ url-service:build
config:build ───────▶ url-service:build
```

Conceptually:

```
logger:build ──┐
               ├──▶ url-service:build
config:build ──┘
```

The two prerequisite tasks may be executed independently before `url-service:build`, subject to their own dependencies and available resources.

# 7. Project Graph Does Not Mean Every Task Must Run

Suppose the project graph is:

```
url-service ──▶ logger
```

This does not mean that every operation on `logger` must run whenever any operation on `url-service` runs.

For example:

```
url-service:test
```

does not automatically mean that:

```
logger:lint
```

must run.

The required task relationships depend on:

- The requested target
    
- Target configuration
    
- Task dependencies
    
- Nx defaults
    
- Workspace plugins
    
- Explicit task configuration
    

The project graph provides the underlying project relationships, while the task graph determines the relevant operations.

# 8. Relationship Between Both Graphs

The two graphs are connected conceptually:

```
Project Graph
      │
      ▼
Project relationships
      │
      ▼
Task Graph construction
      │
      ▼
Execution order
```

Example:

### Project-level relationship

```
common ──▶ logger
```

### Task-level relationship

```
logger:build ──▶ common:build
```

### Application-level task relationship

```
common:build ──▶ url-service:build
```

The complete task chain becomes:

```
logger:build
      │
      ▼
common:build
      │
      ▼
url-service:build
```

## 9. Microservices Example

Suppose your monorepo contains:

```
apps/
├── api-gateway/
└── url-service/

libs/
├── contracts/
└── logger/
```

The source-code project graph may be:

```
api-gateway ──▶ contracts
api-gateway ──▶ logger

url-service ──▶ contracts
url-service ──▶ logger
```

The runtime communication may be:

```
api-gateway ──HTTP/TCP──▶ url-service
```

Now suppose you execute:

Bash

```
nx build api-gateway
```

The relevant task graph may contain:

```
contracts:build ──┐
                  ├──▶ api-gateway:build
logger:build ─────┘
```

The task graph is concerned with building the gateway and its required project dependencies.

It does not automatically mean that `url-service` must be built merely because the gateway communicates with it over HTTP.

That runtime relationship is separate from the source-code and task relationships Nx analyzes.

## Core Mental Model

```
Project Graph:
Which projects depend on which projects?

Task Graph:
Which tasks depend on which tasks?
```

A compact comparison:

```
Project Graph:
url-service ──▶ logger

Task Graph:
logger:build ──▶ url-service:build
```

### Core takeaway

> The Project Graph describes the structure of the workspace, while the Task Graph describes the operations Nx must execute and the order in which those operations can run.

Next single concept: How Nx uses the task graph to determine execution order and parallelism.