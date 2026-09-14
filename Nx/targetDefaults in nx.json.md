# Lesson 15: `targetDefaults` in `nx.json`

In the previous lesson, we learned how `dependsOn` defines task prerequisites.

For example:

JSON

```
{
  "targets": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

This means:

> Before building a project, run the `build` target in its dependent projects.

However, if many projects use the same configuration, repeating that configuration inside every `project.json` becomes unnecessary.

Nx provides `targetDefaults` for this purpose.

## 1. The Problem: Repeating Target Configuration

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

You want every `build` target to depend on the `build` targets of its project dependencies.

Without shared configuration, you might repeat this in several project files.

### `apps/api-gateway/project.json`

JSON

```
{
  "targets": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

### `apps/url-service/project.json`

JSON

```
{
  "targets": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

### `apps/auth-service/project.json`

JSON

```
{
  "targets": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

The configuration is identical in every project.

This creates duplication and makes workspace-wide changes harder.

# 2. What Is `targetDefaults`?

`targetDefaults` is a workspace-level configuration section in `nx.json`.

It defines default behavior for targets with a particular name.

For example:

JSON

```
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

This means:

> Apply this default configuration to matching `build` targets across the workspace, unless a project-specific configuration changes the behavior.

Conceptually:

```
nx.json
   │
   ▼
Default configuration for "build"
   │
   ├── api-gateway:build
   ├── url-service:build
   └── auth-service:build
```

The target name is the key:

JSON

```
"build": {}
```

Therefore, the configuration applies to targets named:

```
project:build
```

such as:

```
api-gateway:build
url-service:build
auth-service:build
```

# 3. Example `nx.json`

A simplified `nx.json` could look like this:

JSON

```
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^test"]
    }
  }
}
```

This defines two workspace-wide defaults:

### For `build`

JSON

```
"build": {
  "dependsOn": ["^build"]
}
```

Before building a project, Nx should consider the `build` target in its dependent projects.

### For `test`

JSON

```
"test": {
  "dependsOn": ["^test"]
}
```

Before testing a project, Nx should consider the `test` target in its dependent projects.

The exact usefulness of a default depends on the project types and the way their targets are configured.

# 4. How `targetDefaults` Relates to `project.json`

There are two configuration levels.

## Workspace-Level Defaults

Defined in:

```
nx.json
```

Example:

JSON

```
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

This establishes a default for matching targets throughout the workspace.

## Project-Level Configuration

Defined in a project’s configuration:

```
apps/url-service/project.json
```

Example:

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

The project-level configuration defines the actual target and its executor.

The workspace-level configuration supplies defaults that Nx can apply to that target.

Conceptually:

```
nx.json
  └── Default build behavior

url-service/project.json
  └── Actual build target and executor
```

Together, they describe how `url-service:build` should operate.

# 5. Target Name Matching

`targetDefaults` is organized by target name, not by project name.

For example:

JSON

```
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

This applies to targets named `build`.

It can affect:

```
api-gateway:build
url-service:build
auth-service:build
logger:build
contracts:build
```

provided those projects define or receive a matching `build` target.

It does not directly apply to:

```
url-service:test
url-service:serve
url-service:lint
```

because those targets have different names.

To configure `test`, you need a separate entry:

JSON

```
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^test"]
    }
  }
}
```

# 6. `targetDefaults` and `dependsOn`

The two concepts have different roles.

## `dependsOn`

Defines a dependency for a particular target configuration.

JSON

```
{
  "targets": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

It is located inside a project’s target configuration.

## `targetDefaults`

Defines default behavior for matching targets across the workspace.

JSON

```
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

It is located in `nx.json`.

The relationship is:

```
targetDefaults
      │
      ▼
Default settings for matching targets
      │
      ▼
Project target configuration
      │
      ▼
Task execution
```

A useful comparison:

|  
Property

|

Location

|

Scope

|  
| --- | --- | --- |  
|

`dependsOn`

|

Project target configuration

|

A specific target configuration

|  
|

`targetDefaults`

|

`nx.json`

|

Matching targets across the workspace

|

# 7. Example in the URL-Shortener Monorepo

Suppose your workspace has:

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

You want a common build dependency policy:

```
Build project dependencies before building the current project.
```

You can conceptually place the default in `nx.json`:

JSON

```
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

Now the intended task relationships may look like:

```
logger:build ────────┐
                     ├──▶ api-gateway:build
contracts:build ────┘
```

For `url-service`:

```
logger:build ────────┐
config:build ────────┤
contracts:build ────┼──▶ url-service:build
                     │
```

For `auth-service`:

```
logger:build ──▶ auth-service:build
```

The same default policy can be applied consistently without repeating the same `dependsOn` configuration in every project.

# 8. Other Settings Commonly Used in `targetDefaults`

`targetDefaults` is not limited to `dependsOn`.

Depending on the Nx version and executor configuration, it may also be used for common target behavior such as:

- Cache configuration
    
- Input definitions
    
- Output definitions
    
- Runtime-related settings
    
- Shared task options
    

For example, a simplified configuration may look like:

JSON

```
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["default", "^default"],
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

This example illustrates the idea of centralizing common build behavior.

The precise supported properties depend on the Nx version and the target/executor configuration.

The important concept for now is:

> `targetDefaults` prevents repeated target configuration across many projects.

# 9. Important Distinction: Defaults Are Not New Targets

This configuration:

JSON

```
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

does not create a new `build` target by itself.

It only defines default settings for a target named `build`.

The project must still have a valid build target, usually defined through:

- Its `project.json`
    
- Plugin-generated configuration
    
- Inferred project configuration
    
- Another supported Nx configuration mechanism
    

Therefore:

```
targetDefaults
```

configures existing or recognized targets.

It does not replace the target’s executor or automatically create an application.

## Core Mental Model

```
nx.json
   │
   └── targetDefaults
          │
          ▼
   Common target behavior
          │
          ▼
Matching project targets
          │
          ▼
      Task Graph
```

For example:

JSON

```
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

means:

```
For matching build targets:
    consider build tasks in dependent projects first
```

### Core takeaway

> `targetDefaults` is a workspace-level mechanism for defining common behavior for targets with the same name. It reduces duplication by allowing policies such as `dependsOn` to be configured centrally in `nx.json`.

Next single concept: Nx task caching—what it is and why Nx can avoid repeating completed work.