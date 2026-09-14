# Lesson 6: Nx Executors

An executor is the mechanism that performs a target’s actual work.

Previously, we learned that a target represents an operation:

```
build
serve
test
lint
```

But a target itself does not perform the operation. It needs an executor.

## Target and Executor Relationship

The relationship is:

```
Project
   │
   └── Target
         │
         └── Executor
               │
               └── Performs the actual task
```

For example:

```
url-service
   │
   └── build target
          │
          └── Executor
                 │
                 └── Compiles the application
```

Therefore:

> A target describes what should be done; an executor defines how it is done.

## Example

A simplified `project.json` may look like this:

JSON

```
{
  "name": "url-service",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack"
    }
  }
}
```

Here:

```
Target:
    build

Executor:
    @nx/webpack:webpack
```

When you run:

Bash

```
nx build url-service
```

Nx performs the following conceptual process:

```
1. Find the project named url-service
2. Find its build target
3. Read the executor configured for that target
4. Pass the target options to the executor
5. Execute the build operation
```

## Common Executor Examples

Different executors perform different types of work.

|  
Executor

|

Typical responsibility

|  
| --- | --- |  
|

Webpack executor

|

Builds or bundles an application using Webpack

|  
|

TypeScript executor

|

Compiles TypeScript code

|  
|

Jest executor

|

Runs Jest tests

|  
|

ESLint executor

|

Runs linting

|  
|

Development-server executor

|

Starts a development server

|

The executor is usually identified using a string such as:

```
@nx/webpack:webpack
```

This generally follows the structure:

```
@nx/webpack
    │
    └── webpack
        │
        └── Executor name
```

The first part identifies the Nx plugin or package. The second part identifies the executor provided by that plugin.

## Executor Options

An executor may require configuration.

For example, a build executor may need to know:

- The entry file
    
- The output directory
    
- The TypeScript configuration
    
- Whether source maps should be generated
    
- Whether the build is for development or production
    

A simplified configuration could look like this:

JSON

```
{
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "options": {
        "outputPath": "dist/apps/url-service",
        "main": "apps/url-service/src/main.ts",
        "tsConfig": "apps/url-service/tsconfig.app.json"
      }
    }
  }
}
```

The exact options depend on the executor being used.

The executor reads these options and uses them while performing the task.

## Target, Executor, and Options

These three concepts should be understood together:

```
Target
  │
  ├── Name: build
  │
  ├── Executor: @nx/webpack:webpack
  │
  └── Options
       ├── Entry file
       ├── Output path
       └── TypeScript configuration
```

For example:

JSON

```
{
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "options": {
        "outputPath": "dist/apps/url-service"
      }
    }
  }
}
```

This means:

- `build` is the operation’s name.
    
- `@nx/webpack:webpack` is responsible for performing it.
    
- `outputPath` configures where the result should be written.
    

## Important Distinction

An executor is not the same as a target.

```
Target:
    build

Executor:
    The implementation that performs the build
```

Similarly:

```
Target:
    test

Executor:
    The implementation that runs the tests
```

The same target name can use different executors in different projects.

For example:

```
url-service
└── build
    └── Webpack executor

logger
└── build
    └── TypeScript executor
```

Both projects have a `build` target, but the underlying build mechanism may differ.

## Core Mental Model

```
nx build url-service
        │
        ▼
Find project: url-service
        │
        ▼
Find target: build
        │
        ▼
Find executor
        │
        ▼
Read executor options
        │
        ▼
Execute the build
```

Remember:

> An Nx executor is the implementation that carries out a target’s operation.

Next single concept: how Nx uses `project.json` to configure targets and executors together.