# Lesson 5: Nx Targets

A target is an operation that Nx knows how to execute for a project.

For example, a NestJS application may have targets such as:

```
serve
build
test
lint
```

These targets represent actions that can be performed on the project.

## Example

Suppose your workspace contains:

```
apps/
└── url-service/
```

You may execute:

Bash

```
nx serve url-service
```

Here:

```
nx          → Nx command-line interface
serve       → target
url-service → project name
```

The command means:

> Run the `serve` target for the `url-service` project.

Similarly:

Bash

```
nx build url-service
```

means:

> Run the `build` target for `url-service`.

And:

Bash

```
nx test url-service
```

means:

> Run the `test` target for `url-service`.

## Common Targets

|  
Target

|

Purpose

|  
| --- | --- |  
|

`serve`

|

Starts the application in development mode

|  
|

`build`

|

Compiles or bundles the project

|  
|

`test`

|

Runs the project’s tests

|  
|

`lint`

|

Checks code against linting rules

|  
|

`e2e`

|

Runs end-to-end tests, if configured

|

The exact targets available depend on how the project was generated and configured.

For example, a library may have:

```
build
test
lint
```

but may not have a `serve` target because it is not a standalone server.

## Target Syntax

The general command structure is:

Bash

```
nx <target> <project>
```

Examples:

Bash

```
nx serve api-gateway
nx build url-service
nx test auth-service
nx lint notification-service
```

You can think of it as:

```
Target + Project
```

For example:

```
build + url-service
```

## Targets Are Project-Specific

Each project can have its own target configuration.

For example:

```
api-gateway
├── serve
├── build
├── test
└── lint

url-service
├── serve
├── build
├── test
└── lint

logger
├── build
├── test
└── lint
```

The target name may be the same across projects, but the actual operation can differ.

For example:

Bash

```
nx build url-service
```

may compile a NestJS application, while:

Bash

```
nx build logger
```

may compile a reusable TypeScript library.

Thus:

> A target describes an operation, while the project determines where and how that operation is applied.

## Target Configuration

Targets are commonly described in a project’s `project.json`.

A simplified example:

JSON

```
{
  "name": "url-service",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack"
    },
    "serve": {
      "executor": "@nx/webpack:dev-server"
    }
  }
}
```

This example shows that:

- `url-service` is an application.
    
- It has a `build` target.
    
- It has a `serve` target.
    
- Each target is associated with an executor.
    

The configuration shown is simplified. A real NestJS project may contain additional options such as:

- Entry file
    
- Output directory
    
- TypeScript configuration
    
- Build mode
    
- Environment settings
    
- Dependencies
    
- Development configuration
    

## Target vs Script

A normal `package.json` script might look like this:

JSON

```
{
  "scripts": {
    "build": "nest build"
  }
}
```

This script belongs to the package where it is defined.

Nx targets are workspace-aware. Nx knows:

- Which project owns the target
    
- Which other projects it depends on
    
- How to execute it
    
- Whether its result can be cached
    
- Whether it needs to run because of a code change
    

For example:

Bash

```
nx build url-service
```

is not simply an arbitrary shell command. It refers to the `build` target registered for the `url-service` project.

## Core Mental Model

```
Nx Workspace
│
├── url-service
│   ├── serve target
│   ├── build target
│   ├── test target
│   └── lint target
│
└── logger
    ├── build target
    ├── test target
    └── lint target
```

Remember:

> A target is a named task that Nx can execute for a specific project.

Next single concept: executors—the mechanism that actually performs a target’s operation.