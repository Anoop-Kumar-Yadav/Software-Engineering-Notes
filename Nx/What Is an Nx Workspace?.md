# Lesson 2: What Is an Nx Workspace?

An Nx workspace is the main repository managed by Nx.

It is the container in which Nx organizes and manages multiple projects.

A project can be:

- A NestJS application
    
- A NestJS microservice
    
- An API gateway
    
- A shared TypeScript library
    
- A testing library
    
- A configuration library
    

For your URL shortener platform, one Nx workspace could contain:

```
url-platform/
├── api-gateway
├── url-service
├── auth-service
├── user-service
├── logger
├── config
└── contracts
```

Here, `url-platform` is the Nx workspace, while each item inside it is an individual project.

## Workspace vs Project

Think of it like this:

```
Nx Workspace
│
├── Project: api-gateway
├── Project: url-service
├── Project: auth-service
├── Project: user-service
│
├── Project: logger
├── Project: config
└── Project: contracts
```

The workspace provides the common environment for managing these projects.

For example, instead of maintaining separate commands and configuration systems for every service, Nx provides a unified command interface:

Bash

```
nx serve url-service
nx build url-service
nx test url-service
```

The same workspace can manage another project:

Bash

```
nx serve auth-service
nx build auth-service
nx test auth-service
```

The command structure remains consistent across projects.

## What Does the Workspace Manage?

An Nx workspace manages information such as:

- Which projects exist
    
- Where each project is located
    
- How each project is built
    
- How each project is tested
    
- Which projects depend on other projects
    
- Which tasks are available for each project
    
- Which projects are affected by a code change
    

For example:

```
url-service
   │
   ├── depends on logger
   ├── depends on config
   └── depends on database
```

Nx records and analyzes these relationships at the workspace level.

## Important Distinction

An Nx workspace is not the same thing as a NestJS application.

A NestJS application normally has its own bootstrap process:

TypeScript

```
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
```

An Nx workspace does not have one universal NestJS server or one universal `main.ts`.

Instead, the workspace may contain several independent NestJS applications:

```
Nx Workspace
│
├── api-gateway
│   └── main.ts
│
├── url-service
│   └── main.ts
│
└── auth-service
    └── main.ts
```

Each application can be started, built, tested, and deployed independently.

## One Workspace, Multiple Deployments

A single Nx workspace may contain:

```
url-platform/
├── apps/
│   ├── api-gateway/
│   ├── url-service/
│   └── auth-service/
│
└── libs/
    ├── logger/
    ├── config/
    └── contracts/
```

But deployment can still be independent:

```
api-gateway  ──▶ Deployment 1
url-service  ──▶ Deployment 2
auth-service ──▶ Deployment 3
```

Therefore:

> One repository does not mean one deployment.

This is one of the main reasons Nx is useful for a microservices monorepo.

## Core Mental Model

```
Nx Workspace
│
├── Organizes projects
├── Understands project dependencies
├── Provides common commands
├── Coordinates tasks
└── Supports independent application builds
```

For now, remember only this:

> An Nx workspace is the top-level repository that contains and manages multiple applications and libraries as Nx projects.

Next single concept: the difference between an Nx application project and an Nx library project.