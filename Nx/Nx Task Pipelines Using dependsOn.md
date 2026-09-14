# Lesson 14: Nx Task Pipelines Using `dependsOn`

In the previous lesson, we learned that Nx uses the Task Graph to determine:

- Which tasks must run first
    
- Which tasks depend on other tasks
    
- Which tasks can run in parallel
    

Now we will learn how to explicitly define these relationships using `dependsOn`.

## 1. What Is `dependsOn`?

`dependsOn` is a target configuration property used to declare that one Nx task depends on another task.

Conceptually:

```
Task A
  │
  ▼
Task B
```

means:

> Task A must be completed before Task B can run.

In Nx configuration, this relationship can be expressed through `dependsOn`.

For example:

JSON

```
{
  "targets": {
    "build": {
      "dependsOn": [
        "build"
      ]
    }
  }
}
```

The exact meaning of a dependency depends on how the target reference is written and resolved.

The important concept is that `dependsOn` allows Nx to construct task execution relationships.

# 2. Why Do We Need `dependsOn`?

Suppose your monorepo contains:

```
apps/
├── url-service/
└── api-gateway/

libs/
├── contracts/
└── logger/
```

Assume the gateway uses the shared contracts library.

You may want this execution order:

```
contracts:build
      │
      ▼
api-gateway:build
```

Without an appropriate task dependency, Nx may not know that the gateway’s build should wait for the contracts build.

You can express the relationship using `dependsOn`.

The general idea is:

```
api-gateway:build
        │
        └── depends on ──▶ contracts:build
```

The resulting task graph becomes:

```
contracts:build ──▶ api-gateway:build
```

# 3. Common Forms of `dependsOn`

Nx supports different ways to describe task dependencies.

The most important forms are:

1. Dependency on a task in the same project
    
2. Dependency on a task in dependent projects
    
3. Dependency on a specific project and target
    

These forms express different relationships.

## 4. Same-Project Task Dependency

A target can depend on another target in the same project.

Suppose `url-service` has these targets:

```
url-service:prepare
url-service:build
```

You may want:

```
url-service:prepare
        │
        ▼
url-service:build
```

A conceptual configuration is:

JSON

```
{
  "targets": {
    "prepare": {
      "executor": "some-executor"
    },
    "build": {
      "executor": "some-build-executor",
      "dependsOn": [
        "prepare"
      ]
    }
  }
}
```

The meaning is:

> Before running `url-service:build`, Nx must run `url-service:prepare`.

The dependency is within the same project:

```
url-service:prepare
        │
        ▼
url-service:build
```

This is useful when one operation prepares something required by another operation.

# 5. Dependency on the Same Target in Dependent Projects

A common monorepo requirement is:

> Before building this project, build the same target in its dependencies.

For example:

```
url-service ──▶ common
common ──▶ logger
```

You may want:

```
logger:build
      │
      ▼
common:build
      │
      ▼
url-service:build
```

Conceptually, the `build` target of `url-service` depends on the `build` target of its dependent projects.

This relationship is commonly expressed using the caret syntax:

JSON

```
{
  "targets": {
    "build": {
      "dependsOn": [
        "^build"
      ]
    }
  }
}
```

The caret `^` means:

> Look at the projects that this project depends on, and run the specified target in those projects first.

Therefore:

JSON

```
"^build"
```

means:

```
Build dependencies first
```

For `url-service`, the conceptual result is:

```
logger:build
      │
      ▼
common:build
      │
      ▼
url-service:build
```

The caret is especially useful for libraries shared across multiple applications.

# 6. Specific Project-and-Target Dependency

You can also declare a dependency on a specific project and target.

For example:

```
api-gateway:build
```

may depend on:

```
contracts:build
```

A conceptual configuration is:

JSON

```
{
  "targets": {
    "build": {
      "dependsOn": [
        {
          "projects": ["contracts"],
          "target": "build"
        }
      ]
    }
  }
}
```

This expresses:

```
contracts:build ──▶ api-gateway:build
```

The dependency is explicit:

- Project: `contracts`
    
- Target: `build`
    

This form is useful when a task must depend on a particular project rather than every project dependency.

# 7. Comparing the Main Forms

|  
Configuration form

|

Meaning

|  
| --- | --- |  
|

`"prepare"`

|

Run another target in the same project

|  
|

`"^build"`

|

Run `build` in dependent projects

|  
|

Specific project and target

|

Run a target in a named project

|

Conceptual examples:

JSON

```
{
  "dependsOn": ["prepare"]
}
```

Means:

```
url-service:prepare
        │
        ▼
url-service:build
```

JSON

```
{
  "dependsOn": ["^build"]
}
```

Means:

```
dependency-project:build
        │
        ▼
current-project:build
```

JSON

```
{
  "dependsOn": [
    {
      "projects": ["contracts"],
      "target": "build"
    }
  ]
}
```

Means:

```
contracts:build
        │
        ▼
current-project:build
```

# 8. Example: URL-Shortener Workspace

Suppose your workspace contains:

```
apps/
├── api-gateway/
└── url-service/

libs/
├── contracts/
├── logger/
└── config/
```

The source-code relationships are:

```
api-gateway ──▶ contracts
api-gateway ──▶ logger

url-service ──▶ contracts
url-service ──▶ logger
url-service ──▶ config
```

A build task graph may be:

```
contracts:build ────────┐
                        ├──▶ api-gateway:build
logger:build ───────────┘


contracts:build ────────┐
                        ├──▶ url-service:build
logger:build ───────────┤
config:build ───────────┘
```

Here:

- `api-gateway:build` waits for `contracts:build` and `logger:build`.
    
- `url-service:build` waits for `contracts:build`, `logger:build`, and `config:build`.
    
- The shared prerequisite tasks may be reused by multiple dependent tasks.
    

The important relationship is:

```
Shared library build
        │
        ▼
Application build
```

# 9. `dependsOn` Does Not Mean Runtime Communication

Suppose:

```
api-gateway ──HTTP──▶ url-service
```

This is a runtime dependency.

It does not automatically mean that:

```
api-gateway:build
```

must depend on:

```
url-service:build
```

A `dependsOn` relationship is an Nx task-execution rule.

For example:

```
contracts:build ──▶ api-gateway:build
```

means:

> The gateway build requires the contracts build to run first.

But:

```
api-gateway ──HTTP──▶ url-service
```

means:

> At runtime, the gateway sends requests to the URL service.

These are separate relationships.

# 10. Important Caution: Avoid Unnecessary Dependencies

Do not add dependencies simply because two projects are related conceptually.

For example, this may be unnecessary:

```
url-service:build ──▶ api-gateway:build
```

If `url-service` does not consume code or build output from `api-gateway`, there may be no reason for this task dependency.

Unnecessary task dependencies can:

- Increase build time
    
- Reduce parallelism
    
- Create tightly coupled projects
    
- Make independent deployment harder
    
- Produce confusing execution chains
    

A good rule is:

> Add a task dependency only when the output or completion of one task is genuinely required by another task.

## Core Mental Model

`dependsOn` describes task prerequisites.

```
Task B
  │
  └── dependsOn ──▶ Task A
```

Nx executes:

```
Task A
  ↓
Task B
```

The most important forms are:

```
"prepare"
```

Same-project target dependency.

```
"^build"
```

Run the same target in dependent projects first.

```
Specific project + target
```

Depend on a particular project’s task.

### Core takeaway

> `dependsOn` allows Nx to explicitly define task prerequisites. It can connect targets within the same project, require tasks from dependent projects, or reference a specific project and target. These are execution relationships, not runtime HTTP or TCP communication.

Next single concept: Nx task configuration inheritance and `targetDefaults` in `nx.json`.