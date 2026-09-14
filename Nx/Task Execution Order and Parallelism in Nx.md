# Lesson 13: Task Execution Order and Parallelism in Nx

In the previous lesson, we learned that the Task Graph represents relationships between specific tasks, such as:

```
logger:build ──▶ common:build ──▶ url-service:build
```

Now we will understand how Nx uses these relationships to decide:

1. Which task runs first
    
2. Which tasks can run simultaneously
    
3. Which tasks must wait for other tasks
    

## 1. Why Execution Order Matters

Suppose `url-service` depends on a shared `common` library:

```
url-service ──▶ common
```

And `common` depends on `logger`:

```
common ──▶ logger
```

The dependency chain becomes:

```
url-service → common → logger
```

If Nx needs to build all three projects, building them in an incorrect order could cause problems.

For example, this order may be incorrect:

```
1. Build url-service
2. Build common
3. Build logger
```

The application may require the output of `common`, while `common` may require the output of `logger`.

A dependency-aware order is:

```
1. Build logger
2. Build common
3. Build url-service
```

This is called dependency-aware task execution.

# 2. Prerequisite Tasks

A task that must finish before another task begins is called a prerequisite task.

Consider:

```
logger:build
      │
      ▼
common:build
      │
      ▼
url-service:build
```

Here:

- `logger:build` is a prerequisite for `common:build`.
    
- `common:build` is a prerequisite for `url-service:build`.
    
- `logger:build` indirectly becomes a prerequisite for `url-service:build`.
    

The execution order is therefore:

```
logger:build
      ↓
common:build
      ↓
url-service:build
```

Nx uses the task graph to understand these prerequisites.

## 3. Topological Execution Order

A dependency graph can be executed using a valid ordering in which every prerequisite runs before the task that depends on it.

This type of ordering is commonly called a topological order.

For the graph:

```
logger:build ──▶ common:build ──▶ url-service:build
```

A valid execution order is:

```
logger:build
common:build
url-service:build
```

An invalid order would be:

```
url-service:build
common:build
logger:build
```

because `url-service:build` appears before its prerequisites.

Nx does not simply execute tasks in the order they appear in a file. It uses dependency information to determine a valid execution plan.

# 4. Independent Tasks

Not every task depends on every other task.

Suppose the workspace contains:

```
api-gateway
url-service
auth-service
```

Assume that these applications do not share a build dependency for the current operation.

Their build tasks may be represented as:

```
api-gateway:build

url-service:build

auth-service:build
```

There are no edges between them:

```
api-gateway:build     url-service:build     auth-service:build
       │                     │                     │
       └─────────────── no dependency ─────────────┘
```

Because these tasks are independent, Nx may execute them in parallel.

Conceptually:

```
api-gateway:build ─────┐
                      │
url-service:build ────┼──▶ Complete
                      │
auth-service:build ───┘
```

Parallel execution can reduce the total time required to complete a group of tasks.

# 5. Sequential vs Parallel Execution

## Sequential Execution

In sequential execution, tasks run one after another:

```
Task A
  ↓
Task B
  ↓
Task C
```

If the tasks take:

- Task A → 4 seconds
    
- Task B → 3 seconds
    
- Task C → 5 seconds
    

Then the total execution time is approximately:

```
4 + 3 + 5 = 12 seconds
```

## Parallel Execution

If the tasks are independent, they may run simultaneously:

```
Task A ──┐
         │
Task B ──┼──▶ Completion
         │
Task C ──┘
```

The total time is approximately determined by the longest task:

```
max(4, 3, 5) = 5 seconds
```

This is a simplified example. Actual execution time depends on:

- CPU resources
    
- Disk performance
    
- Memory
    
- Process startup overhead
    
- Number of available workers
    
- Task implementation
    
- Cache availability
    

The key principle remains:

> Independent tasks can potentially run concurrently.

# 6. Example: Building Multiple Services

Suppose your URL-shortener monorepo contains:

```
apps/
├── api-gateway/
├── url-service/
└── auth-service/

libs/
├── logger/
├── config/
└── contracts/
```

Assume these dependencies:

```
api-gateway ──▶ contracts
api-gateway ──▶ logger

url-service ──▶ contracts
url-service ──▶ logger
url-service ──▶ config

auth-service ──▶ logger
```

A possible task graph for building all applications is:

```
contracts:build ────────┐
                        ├──▶ api-gateway:build
logger:build ───────────┘


contracts:build ────────┐
                        ├──▶ url-service:build
logger:build ───────────┤
config:build ───────────┘


logger:build ───────────▶ auth-service:build
```

Nx can identify that:

- `contracts:build` is shared by multiple application builds.
    
- `logger:build` is shared by multiple application builds.
    
- `config:build` is required by `url-service:build`.
    
- The application builds must wait for their required prerequisites.
    

A conceptual execution plan could be:

```
Phase 1:
contracts:build
logger:build
config:build

Phase 2:
api-gateway:build
url-service:build
auth-service:build
```

Within Phase 1, independent tasks may run in parallel.

Within Phase 2, the three application builds may also run in parallel if they do not depend on one another.

# 7. Shared Prerequisite Tasks

A single task may be required by several other tasks.

Example:

```
             ┌──▶ api-gateway:build
             │
logger:build ├──▶ url-service:build
             │
             └──▶ auth-service:build
```

The important point is that `logger:build` is a shared prerequisite.

Nx should not unnecessarily build the same task repeatedly for each dependent application.

Conceptually:

```
Run logger:build once
       │
       ├──▶ api-gateway:build
       ├──▶ url-service:build
       └──▶ auth-service:build
```

This is one of the benefits of having a centralized task graph.

Nx can reason about the task relationships rather than treating every application build as an isolated operation.

# 8. Parallelism Does Not Ignore Dependencies

Parallelism does not mean that Nx executes every task at the same time.

Consider:

```
logger:build ──▶ common:build ──▶ url-service:build
```

These tasks cannot all run freely in parallel if each task requires the output of the previous task.

The valid execution behavior is:

```
logger:build
      │
      ▼
common:build
      │
      ▼
url-service:build
```

However, another independent task may run alongside them:

```
logger:build ──▶ common:build ──▶ url-service:build
      │
      └──────────────────────────────┐
                                     │
                              auth-service:build
```

A possible schedule is:

```
Time ──────────────────────────────────────────▶

logger:build
auth-service:build
      │
      ▼
common:build
      │
      ▼
url-service:build
```

The exact schedule depends on task dependencies and available execution capacity.

The rule is:

> Nx may parallelize independent tasks, but it must respect dependency edges.

# 9. Task Graph and Runtime Microservices

Suppose your runtime architecture is:

```
api-gateway ──HTTP/TCP──▶ url-service
```

This runtime communication does not automatically force:

```
api-gateway:build
```

to wait for:

The two applications may be independently built and deployed.

The task dependency exists only if Nx configuration or project relationships establish one.

For example, this is a possible task dependency:

```
contracts:build ──▶ api-gateway:build
```

But this is not automatically required:

```
url-service:build ──▶ api-gateway:build
```

The gateway may communicate with the URL service at runtime while remaining independently buildable.

This is important for independent microservice deployment.

## Core Mental Model

```
Task Graph
    │
    ├── Determines prerequisites
    ├── Determines valid execution order
    └── Identifies independent tasks for parallel execution
```

Example:

```
logger:build ──▶ common:build ──▶ url-service:build
```

means:

```
logger:build must complete first
common:build must complete next
url-service:build can run afterward
```

While:

```
api-gateway:build
url-service:build
auth-service:build
```

may run in parallel if they have no relevant dependencies between them.

### Core takeaway

> Nx uses the Task Graph to respect prerequisites and execute tasks in a valid order. Tasks connected by dependency edges must follow those relationships, while independent tasks can potentially run in parallel.

Next single concept: Nx task pipelines using `dependsOn`.