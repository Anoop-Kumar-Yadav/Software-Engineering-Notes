# Lesson 4: How Nx Represents a Project

Nx needs to know that a directory is an application project or a library project.

It stores this information through project configuration.

A project configuration tells Nx things such as:

- The project’s name
    
- Its root directory
    
- Its source directory
    
- How to build it
    
- How to run it
    
- How to test it
    
- Which commands or tasks it supports
    

For example, Nx may have a project named:

```
url-service
```

Nx needs configuration that describes how `url-service` should be handled.

## Conceptual Project Configuration

A simplified project configuration may look like this:

JSON

```
{
  "name": "url-service",
  "sourceRoot": "apps/url-service/src",
  "projectType": "application"
}
```

This tells Nx:

```
Project name:
    url-service

Project type:
    application

Source code:
    apps/url-service/src
```

For a library, the configuration may look conceptually like this:

JSON

```
{
  "name": "logger",
  "sourceRoot": "libs/logger/src",
  "projectType": "library"
}
```

This tells Nx:

```
Project name:
    logger

Project type:
    library

Source code:
    libs/logger/src
```

These examples are simplified to show the idea. Actual generated Nx configurations contain additional settings.

## `projectType`

The `projectType` field identifies the kind of project.

Common values are:

```
application
library
```

### Application

JSON

```
{
  "projectType": "application"
}
```

This indicates a runnable project such as:

```
api-gateway
url-service
auth-service
```

### Library

JSON

```
{
  "projectType": "library"
}
```

This indicates reusable code such as:

```
logger
config
contracts
common
```

The project type helps Nx and its generators understand the intended role of the project.

## Where Is This Configuration Stored?

Depending on the Nx version and workspace configuration, project configuration may be stored in:

```
project.json
```

or inside another workspace configuration file.

A common structure is:

```
url-platform/
│
├── apps/
│   └── url-service/
│       ├── project.json
│       └── src/
│           ├── main.ts
│           └── app.module.ts
│
├── libs/
│   └── logger/
│       ├── project.json
│       └── src/
│           └── index.ts
│
└── nx.json
```

The important distinction is:

- `project.json` describes an individual project.
    
- `nx.json` contains workspace-level Nx configuration.
    

Do not confuse them.

## Project Configuration vs NestJS Configuration

These configurations serve different purposes.

### NestJS configuration

NestJS configuration defines the internal application structure:

TypeScript

```
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

It tells NestJS how to compose the application’s modules and providers.

### Nx project configuration

Nx project configuration describes how Nx manages the project:

JSON

```
{
  "name": "url-service",
  "projectType": "application"
}
```

It tells Nx what the project is and how workspace tasks should operate on it.

## Mental Model

```
Nx Workspace
│
├── nx.json
│   └── Workspace-level Nx configuration
│
├── url-service/
│   └── project.json
│       └── Configuration for url-service
│
└── logger/
    └── project.json
        └── Configuration for logger
```

In short:

> A project configuration is the information Nx uses to understand and operate on one project.

Next single concept: Nx targets, which define operations such as `serve`, `build`, `test`, and `lint` for a project.