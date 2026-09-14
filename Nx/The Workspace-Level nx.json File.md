# Lesson 8: The Workspace-Level `nx.json` File

The `nx.json` file contains configuration that applies to the Nx workspace as a whole.

Previously, we discussed `project.json`.

- `project.json` describes one project.
    
- `nx.json` describes workspace-level behavior.
    

## Project-Level vs Workspace-Level Configuration

Consider this structure:

```
url-platform/
│
├── nx.json
│
├── apps/
│   └── url-service/
│       └── project.json
│
└── libs/
    └── logger/
        └── project.json
```

The configuration responsibilities are:

```
nx.json
   └── Configuration for the entire workspace

url-service/project.json
   └── Configuration for url-service

logger/project.json
   └── Configuration for logger
```

## What Does `nx.json` Control?

The `nx.json` file can configure workspace-wide behavior such as:

- Default task behavior
    
- Task dependencies
    
- Caching
    
- Plugins
    
- Code-generation defaults
    
- Project naming conventions
    
- Workspace-level settings
    

It helps Nx behave consistently across all projects.

For example, if you want all projects to use a common caching or task-running policy, that behavior can be configured at the workspace level.

## Simplified Example

A conceptual `nx.json` might look like this:

JSON

```
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": [
          "build",
          "test",
          "lint"
        ]
      }
    }
  }
}
```

This example expresses the idea that the results of certain operations may be cached.

The exact configuration format depends on the Nx version and the features being used. Modern Nx workspaces may configure task behavior differently, but the central idea remains the same:

> `nx.json` defines workspace-level Nx behavior.

## Why Workspace-Level Configuration Is Useful

Suppose your monorepo contains:

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

Without workspace-level configuration, every project might need to define certain common behaviors independently.

With `nx.json`, Nx can apply shared policies across the workspace.

Conceptually:

```
nx.json
   │
   ├── api-gateway
   ├── url-service
   ├── auth-service
   ├── logger
   ├── config
   └── contracts
```

The configuration is not business logic. It tells Nx how to manage the projects.

## `nx.json` Does Not Define NestJS Modules

This is an important distinction.

The NestJS root module is defined in TypeScript:

TypeScript

```
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

The `nx.json` file is not used to register NestJS controllers or providers.

Instead:

```
NestJS AppModule
    └── Defines NestJS runtime composition

Nx nx.json
    └── Defines workspace-level Nx behavior
```

## Core Mental Model

```
Nx Workspace
│
├── nx.json
│   └── Workspace-wide Nx configuration
│
├── apps/
│   └── url-service/
│       └── project.json
│           └── Project-specific configuration
│
└── libs/
    └── logger/
        └── project.json
            └── Project-specific configuration
```

Remember:

> `nx.json` configures how Nx manages the entire workspace, while `project.json` configures an individual project.

Next single concept: how Nx discovers projects and constructs the workspace’s project graph.