# Lesson 7: Configuring Targets and Executors with `project.json`

The `project.json` file describes how Nx should manage one specific project.

It can define:

- The project name
    
- The project type
    
- The source directory
    
- The available targets
    
- The executor for each target
    
- The options passed to each executor
    

For example, a simplified `project.json` for `url-service` may look like this:

JSON

```
{
  "name": "url-service",
  "projectType": "application",
  "sourceRoot": "apps/url-service/src",
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "options": {
        "outputPath": "dist/apps/url-service",
        "main": "apps/url-service/src/main.ts",
        "tsConfig": "apps/url-service/tsconfig.app.json"
      }
    },
    "serve": {
      "executor": "@nx/webpack:dev-server",
      "options": {
        "buildTarget": "url-service:build"
      }
    }
  }
}
```

This configuration describes one project:

```
Project:
    url-service

Type:
    application

Source:
    apps/url-service/src
```

It also defines two targets:

```
build
serve
```

## Understanding the `build` Target

Consider this section:

JSON

```
{
  "build": {
    "executor": "@nx/webpack:webpack",
    "options": {
      "outputPath": "dist/apps/url-service",
      "main": "apps/url-service/src/main.ts",
      "tsConfig": "apps/url-service/tsconfig.app.json"
    }
  }
}
```

It contains three important parts.

### 1. Target name

JSON

```
"build"
```

This is the name used in the Nx command:

Bash

```
nx build url-service
```

### 2. Executor

JSON

```
"executor": "@nx/webpack:webpack"
```

This identifies the implementation that performs the build.

### 3. Options

JSON

```
"options": {
  "outputPath": "dist/apps/url-service",
  "main": "apps/url-service/src/main.ts",
  "tsConfig": "apps/url-service/tsconfig.app.json"
}
```

These values configure the executor.

For example:

- `outputPath` specifies where build output should go.
    
- `main` identifies the application entry file.
    
- `tsConfig` identifies the TypeScript configuration used during the build.
    

The available options depend on the selected executor.

## Understanding the `serve` Target

Consider:

JSON

```
{
  "serve": {
    "executor": "@nx/webpack:dev-server",
    "options": {
      "buildTarget": "url-service:build"
    }
  }
}
```

The `serve` target uses a development-server executor.

Its option is:

JSON

```
"buildTarget": "url-service:build"
```

This means that the development server should use the `build` target of the `url-service` project.

The reference has this structure:

```
project:target
```

Therefore:

```
url-service:build
```

means:

```
Project:
    url-service

Target:
    build
```

When you execute:

Bash

```
nx serve url-service
```

Nx uses the `serve` target, which in turn refers to the project’s `build` target.

Conceptually:

```
nx serve url-service
        │
        ▼
Find url-service:serve
        │
        ▼
Run development-server executor
        │
        ▼
Use url-service:build
        │
        ▼
Build and serve the application
```

## Target Configuration Is Project-Specific

Two projects may both have a `build` target, but their configurations can differ.

For example:

```
url-service:build
    └── Builds a NestJS application

logger:build
    └── Builds a reusable TypeScript library
```

Their target configurations may use different executors or different options.

The command remains consistent:

Bash

```
nx build url-service
nx build logger
```

Nx determines the correct configuration based on the project name.

## Important Distinction

The following concepts are different:

```
Project
    What is being managed?

Target
    What operation should be performed?

Executor
    Which implementation performs the operation?

Options
    How should that implementation behave?
```

A complete conceptual structure is:

```
url-service
   │
   └── build target
         │
         ├── executor
         │     └── @nx/webpack:webpack
         │
         └── options
               ├── main
               ├── outputPath
               └── tsConfig
```

Remember:

> `project.json` connects a project’s targets with their executors and configuration options.

Next single concept: the purpose of the workspace-level `nx.json` file.