# Lesson 16: Nx Task Caching

In a monorepo, many tasks are executed repeatedly:

Bash

```
nx build url-service
nx test url-service
nx lint url-service
```

The problem is that the same task may produce the same result multiple times, even when nothing relevant has changed.

Nx task caching is designed to avoid this unnecessary work.

## 1. The Problem Caching Solves

Consider your URL-shortener monorepo:

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

Suppose you run:

Bash

```
nx build url-service
```

The build process may need to:

1. Read TypeScript files.
    
2. Resolve imports.
    
3. Compile the application.
    
4. Bundle or package the application.
    
5. Generate output files.
    
6. Copy assets.
    
7. Write the final build into `dist/`.
    

This process consumes time and CPU resources.

Now suppose you run the exact same command again without changing anything:

Bash

```
nx build url-service
```

The build tool may perform the entire build again, even though:

- The source code has not changed.
    
- The configuration has not changed.
    
- The dependencies have not changed.
    
- The expected output would be identical.
    

This is repetitive work.

Nx task caching allows Nx to reuse the result of a previous task execution when the relevant inputs have not changed.

## 2. What Is a Cached Task?

A task is an operation associated with a project and target.

For example:

```
url-service:build
```

This means:

```
Project: url-service
Target:  build
```

When Nx executes:

Bash

```
nx build url-service
```

it is executing the `build` task for the `url-service` project.

Nx can remember the result of that execution.

Conceptually, the cached information may include:

- Whether the task completed successfully.
    
- The task’s generated output files.
    
- Relevant terminal output.
    
- Information needed to restore or reproduce the task result.
    

The exact internal representation depends on Nx’s implementation and configuration, but the central idea is:

> Nx stores the result of a task so that it can reuse that result later.

## 3. First Execution: Cache Miss

Assume you have just created the `url-service` application and run:

Bash

```
nx build url-service
```

Since Nx has no valid previous result for this exact task state, it cannot reuse anything.

This is called a cache miss.

The conceptual flow is:

```
nx build url-service
        │
        ▼
Does a valid cached result exist?
        │
        └── No
             │
             ▼
       Cache miss
             │
             ▼
       Execute build
             │
             ▼
       Generate dist/
             │
             ▼
       Store task result in cache
```

Example:

```
First execution:

nx build url-service
        │
        ▼
    Cache miss
        │
        ▼
Build executor runs
        │
        ▼
dist/apps/url-service/ is generated
        │
        ▼
Result is saved in the cache
```

The important point is that the build actually runs during a cache miss.

## 4. Second Identical Execution: Cache Hit

Now assume you run the same command again:

Bash

```
nx build url-service
```

If the relevant inputs are unchanged, Nx can identify that the task should produce the same result.

This is called a cache hit.

The conceptual flow is:

```
nx build url-service
        │
        ▼
Does a valid cached result exist?
        │
        └── Yes
             │
             ▼
        Cache hit
             │
             ▼
  Restore or reuse cached result
             │
             ▼
  Build executor need not run again
```

Example:

```
Second execution:

nx build url-service
        │
        ▼
    Cache hit
        │
        ▼
Cached result is reused
        │
        ▼
No complete rebuild is necessary
```

The second execution can therefore be much faster.

## 5. Cache Miss vs Cache Hit

|  
Situation

|

Result

|  
| --- | --- |  
|

No matching cached result exists

|

Cache miss

|  
|

A valid cached result exists

|

Cache hit

|  
|

Task executes normally

|

Usually a cache miss

|  
|

Previous result is reused

|

Cache hit

|  
|

Source or relevant configuration changes

|

May cause a cache miss

|  
|

Inputs remain unchanged

|

May produce a cache hit

|

The important word is valid.

Nx does not simply reuse any old result. It determines whether the cached result corresponds to the current task inputs.

## 6. How Does Nx Know Whether the Result Is Reusable?

Nx conceptually calculates a task identity using a hash or cache key.

The key represents the relevant state of the task.

A simplified model is:

```
Task Cache Key =
    Source Files
  + Project Configuration
  + Task Configuration
  + Relevant Dependencies
  + Relevant Environment Inputs
  + Other Declared Inputs
```

This is a conceptual explanation rather than an exact description of every internal hashing rule.

For example, the cache identity for:

```
url-service:build
```

may be affected by:

- Files inside `apps/url-service/src`.
    
- TypeScript configuration.
    
- Build configuration.
    
- Files imported from relevant libraries.
    
- Workspace configuration.
    
- Dependency versions or lockfile state, depending on configuration.
    
- Declared task inputs.
    
- Relevant environment values, when included in the task’s input configuration.
    

Nx uses this information to determine whether the current task state matches a previously cached task state.

## 7. Example: Source Code Has Not Changed

Assume the following code exists:

TypeScript

```
// apps/url-service/src/main.ts

async function bootstrap() {
  console.log('URL service started');
}

bootstrap();
```

You execute:

Bash

```
nx build url-service
```

Nx runs the build and stores the result.

Now execute the same command again without modifying anything:

Bash

```
nx build url-service
```

Conceptually:

```
Current inputs
      │
      ▼
Same as previous task inputs
      │
      ▼
Same cache key
      │
      ▼
Cache hit
      │
      ▼
Reuse previous result
```

The build does not need to repeat all compilation and packaging work.

## 8. Example: Source Code Changes

Now modify the source:

TypeScript

```
// apps/url-service/src/main.ts

async function bootstrap() {
  console.log('URL service started on port 3000');
}

bootstrap();
```

The relevant source file has changed.

When you execute:

Bash

```
nx build url-service
```

Nx detects that the task’s inputs are different from the previous execution.

Conceptually:

```
Previous source code
        │
        ▼
Previous cache key
```

After the modification:

```
Updated source code
        │
        ▼
Different cache key
        │
        ▼
Previous result is not reusable
        │
        ▼
Cache miss
        │
        ▼
Build executes again
```

Therefore:

> A cache hit generally requires the relevant task inputs to match the inputs used when the cached result was created.

## 9. Task Output vs Cached Result

These two concepts are related but not identical.

### Task output

The output is what the task produces.

For a build task, the output may be:

```
dist/apps/url-service/
```

Example:

```
dist/apps/url-service/
├── main.js
├── package.json
└── assets/
```

This is the actual build artifact.

### Cached result

The cached result is Nx’s stored record of the task execution.

It may include:

- The generated output.
    
- Terminal output.
    
- Task completion information.
    
- Metadata used to identify and restore the result.
    

Conceptually:

```
Task execution
      │
      ├── Generated files
      │      └── dist/apps/url-service/
      │
      ├── Terminal output
      │
      └── Execution result
             │
             ▼
        Cached by Nx
```

So:

```
Output = What the task generated
Cache   = Stored reusable result of the task execution
```

The cache allows Nx to restore or reuse the task result later.

## 10. Caching in a Monorepo

Caching becomes especially useful when many projects exist.

Suppose your workspace contains:

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

You may run:

Bash

```
nx build api-gateway
nx build url-service
nx build auth-service
```

Each build can have its own cache entry:

```
api-gateway:build  → Cache entry A
url-service:build  → Cache entry B
auth-service:build  → Cache entry C
```

If only `url-service` changes, Nx may be able to reuse the cached results for unaffected projects.

Conceptually:

```
api-gateway:build  → Cache hit
url-service:build  → Cache miss
auth-service:build → Cache hit
```

This is one of the major advantages of Nx in a large repository: repeated work can be avoided at the individual project-task level.

## 11. Why Caching Must Be Used Carefully

Caching works best for tasks that are:

- Deterministic.
    
- Reproducible.
    
- Based on clearly defined inputs.
    
- Expected to produce the same result for the same inputs.
    

For example, these tasks are commonly suitable for caching:

```
build
test
lint
type-check
```

However, not every task should automatically be cached.

A task may be unsuitable for caching if it:

- Depends on the current time.
    
- Produces random output.
    
- Reads changing external data.
    
- Sends an email.
    
- Deploys an application.
    
- Publishes a package.
    
- Modifies an external system.
    
- Performs a non-repeatable side effect.
    

For example:

```
deploy-production
```

should not be treated like a normal deterministic build task.

Running a deployment task may change an external environment. Reusing an old deployment result would not necessarily perform the required deployment action.

Therefore:

> Caching is appropriate for reusable computation, not for arbitrary side-effect-producing operations.

## 12. Build Tasks and Long-Running Tasks

A build task usually has a clear completion point:

Bash

```
nx build url-service
```

It starts, produces output, and finishes.

A development server behaves differently:

Bash

```
nx serve url-service
```

The development server may:

- Continue running.
    
- Watch files.
    
- Rebuild after changes.
    
- Listen for HTTP requests.
    
- Keep the process alive.
    

Therefore, `serve` is generally not treated like a normal completed build artifact that can simply be reused from a cache.

The practical distinction is:

```
Build:
  Execute → Produce output → Finish

Serve:
  Start process → Keep running → Watch or handle requests
```

Caching is most naturally useful for completed tasks such as builds, tests, and linting.

## 13. Complete Mental Model

```
nx build url-service
        │
        ▼
Nx identifies the task:
url-service:build
        │
        ▼
Nx determines the relevant task inputs
        │
        ▼
Nx calculates or checks a cache identity
        │
        ├── Matching cached result exists
        │        │
        │        ▼
        │    Cache hit
        │        │
        │        ▼
        │    Reuse cached result
        │
        └── No matching cached result
                 │
                 ▼
             Cache miss
                 │
                 ▼
          Execute build task
                 │
                 ▼
          Generate build output
                 │
                 ▼
          Store result in cache
```

## Key takeaway

Nx task caching prevents repeated execution of tasks whose relevant inputs have not changed.

For the URL-shortener monorepo:

```
First run:
nx build url-service
→ Cache miss
→ Build executes
→ Output is generated
→ Result is cached

Second identical run:
nx build url-service
→ Cache hit
→ Cached result is reused
→ Build does not need to execute again
```

The next concept is local cache vs remote cache—where cached task results are stored and how that affects individual developers and CI systems.