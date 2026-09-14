# Lesson 17: Local Cache vs Remote Cache

Nx task caching can store task results in different places. The two important concepts are:

1. Local cache
    
2. Remote cache
    

The difference is mainly who can access the cached result.

## 1. Local Cache

A local cache is stored on the machine where the Nx task was executed.

For example, you run:

Bash

```
nx build url-service
```

on your laptop.

Nx executes the build and stores the result in its local cache.

Conceptually:

```
Your laptop
│
├── Nx workspace
├── Source code
├── Build process
└── Local Nx cache
    └── Cached result of url-service:build
```

The cached result is available to Nx executions on that same machine, provided the relevant cache information is still valid.

## 2. Local Cache Example

Suppose you run:

Bash

```
nx build url-service
```

for the first time.

```
First execution on Laptop A:

nx build url-service
        │
        ▼
    Cache miss
        │
        ▼
Build executes
        │
        ▼
Result stored in Laptop A's local cache
```

Now run the command again on the same laptop:

Bash

```
nx build url-service

Second execution on Laptop A:

nx build url-service
        │
        ▼
    Cache hit
        │
        ▼
Local cached result is reused
```

The second execution can be faster because Nx does not need to perform the complete build again.

## 3. Limitation of Local Cache

The local cache generally belongs to one machine.

Assume your team has two developers:

```
Developer A → Laptop A
Developer B → Laptop B
```

Developer A runs:

Bash

```
nx build url-service
```

and receives a cache miss:

```
Laptop A
└── Build executes
    └── Result stored locally
```

Later, Developer B runs the same command:

Bash

```
nx build url-service
```

on Laptop B.

Developer B usually cannot directly use Developer A’s local cache:

```
Laptop A                         Laptop B
────────                         ────────
Nx cache                         Nx cache
    │                                │
    └── Not automatically shared ────┘
```

Therefore, Developer B may need to execute the build independently, even if:

- The source code is identical.
    
- The configuration is identical.
    
- Developer A already built the project successfully.
    

This is the main limitation of local caching in a team environment.

## 4. Remote Cache

A remote cache stores task results in a shared location that multiple machines can access.

The shared location may be managed through an Nx-compatible remote caching provider or another supported remote caching setup.

Conceptually:

```
                    Shared Remote Cache
                   ┌───────────────────┐
                   │ Cached task result│
                   │ url-service:build │
                   └───────────────────┘
                       ▲           ▲
                       │           │
                       │           │
                 Laptop A       Laptop B
                 Developer A    Developer B
```

Instead of storing the result only on one laptop, Nx can upload and retrieve task results from a shared cache.

## 5. Remote Cache Example

### First execution by Developer A

Developer A runs:

Bash

```
nx build url-service
```

The result is not available in the local or remote cache.

```
Developer A
     │
     ▼
Cache miss
     │
     ▼
Build executes
     │
     ▼
Result stored locally
     │
     ▼
Result uploaded to remote cache
```

Conceptually:

```
Laptop A ──uploads──▶ Remote Cache
```

The remote cache now contains the result for the relevant task inputs.

### Second execution by Developer B

Developer B checks out the same code and runs:

Bash

```
nx build url-service
```

Nx checks whether a matching cached result is available.

```
Developer B
     │
     ▼
Check local cache
     │
     └── No matching result
              │
              ▼
       Check remote cache
              │
              └── Matching result found
                       │
                       ▼
                  Cache hit
                       │
                       ▼
             Download or restore result
```

Conceptually:

```
Remote Cache ──downloads──▶ Laptop B
```

Developer B may therefore avoid running the full build.

## 6. Local Cache vs Remote Cache

|  
Feature

|

Local cache

|

Remote cache

|  
| --- | --- | --- |  
|

Storage location

|

Developer’s machine

|

Shared remote location

|  
|

Accessible by

|

Usually one machine

|

Multiple authorized machines

|  
|

Useful for repeated local work

|

Yes

|

Yes

|  
|

Shared between developers

|

Not automatically

|

Yes

|  
|

Useful in CI

|

Limited to the same CI environment or preserved cache

|

Very useful

|  
|

Can reduce repeated work across machines

|

No, generally

|

Yes

|  
|

Requires shared infrastructure or provider

|

No

|

Usually yes

|

The key distinction is:

```
Local cache  → Reuse work on one machine
Remote cache → Share reusable work across machines
```

## 7. Why Remote Caching Matters in a Monorepo

Consider a team working on the URL-shortener platform:

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

Several people or systems may execute the same tasks:

- Developer laptops
    
- Pull request checks
    
- CI pipelines
    
- Staging build pipelines
    
- Release pipelines
    

Without shared caching, the same build or test task may be repeated in multiple environments.

For example:

```
Developer A builds url-service
Developer B builds url-service
CI builds url-service
Release pipeline builds url-service
```

If the relevant inputs are identical, these executions may produce the same result.

A remote cache can allow later environments to reuse a result already produced by an earlier environment.

Conceptually:

```
Developer A
    │
    ▼
Build url-service
    │
    ▼
Remote cache
    ▲
    │
    ├── Developer B
    ├── Pull request CI
    └── Release pipeline
```

This can reduce:

- Build time.
    
- Test execution time.
    
- CI duration.
    
- CPU consumption.
    
- Duplicate work across developers and pipelines.
    

## 8. Remote Cache Does Not Mean Shared Source Code

A remote cache shares task results, not the entire working directory.

For example, a remote cache does not replace:

- Git.
    
- GitHub.
    
- GitLab.
    
- A source-code repository.
    
- A package registry.
    
- A deployment system.
    

The normal workflow still requires the developer or CI system to obtain the source code:

```
Git repository
      │
      ▼
Developer or CI checks out source code
      │
      ▼
Nx calculates task inputs
      │
      ▼
Nx checks local and remote caches
      │
      ├── Cache hit → Reuse task result
      │
      └── Cache miss → Execute task
```

Therefore:

```
Git      → Shares source code and history
Nx cache → Shares reusable task results
```

These solve different problems.

## 9. Remote Cache and CI

A common CI workflow looks like this:

```
Pull Request
     │
     ▼
CI checks out repository
     │
     ▼
CI runs Nx tasks
     │
     ▼
Nx checks remote cache
     │
     ├── Cache hit
     │     └── Reuse previous result
     │
     └── Cache miss
           └── Execute task and optionally upload result
```

For example:

Bash

```
nx test url-service
nx build url-service
nx lint url-service
```

If another developer or CI job already executed the same tasks with equivalent inputs, the current CI job may reuse those results.

This is particularly valuable when:

- The repository contains many applications.
    
- Several libraries are shared by many applications.
    
- CI runs on every pull request.
    
- Multiple branches contain unchanged projects.
    
- Builds and tests are computationally expensive.
    

## 10. Important Limitation: Cache Validity Still Matters

Remote caching does not mean that Nx blindly reuses any result.

Nx still needs to determine whether the cached result corresponds to the current task inputs.

For example, if `logger` changes:

```
url-service ──depends on──▶ logger
```

then a build of `url-service` may need to be recomputed because its effective inputs may have changed.

Conceptually:

```
logger source changes
        │
        ▼
Relevant input changes
        │
        ▼
Different task identity
        │
        ▼
Previous cached result may not be reusable
        │
        ▼
Cache miss
```

Remote caching improves where results can be reused from. It does not remove the need to determine whether reuse is safe.

## 11. Security and Access Considerations

A remote cache is shared infrastructure, so access must be controlled.

Important considerations include:

- Authentication.
    
- Authorization.
    
- Workspace or organization isolation.
    
- Protection of cached artifacts.
    
- Avoiding sensitive information in task outputs.
    
- Correct handling of environment-dependent builds.
    
- Trusting only appropriate CI and developer environments.
    

For example, a task should not accidentally place secrets in:

- Build output.
    
- Terminal output.
    
- Generated files.
    
- Cacheable artifacts.
    

Caching stores task results. If those results contain sensitive data, that data may become accessible to other authorized users or systems that can access the cache.

## 12. Final Mental Model

```
                 Nx Task
             url-service:build
                     │
                     ▼
             Determine task inputs
                     │
                     ▼
              Check local cache
                     │
          ┌──────────┴──────────┐
          │                     │
      Cache hit             Cache miss
          │                     │
          ▼                     ▼
   Reuse local result     Check remote cache
                                │
                     ┌──────────┴──────────┐
                     │                     │
                 Cache hit             Cache miss
                     │                     │
                     ▼                     ▼
             Reuse remote result     Execute task
                                           │
                                           ▼
                                    Store local result
                                           │
                                           ▼
                                  Upload remote result
```

## Key takeaway

```
Local cache:
  Reuses task results on the same machine.

Remote cache:
  Allows multiple machines, developers, and CI systems
  to reuse matching task results.
```

Remote caching is especially useful in a large Nx monorepo because the same build, test, or lint tasks may otherwise be repeated across many environments.

Next single concept: Nx cache configuration—how Nx decides what inputs to track and what outputs to store.