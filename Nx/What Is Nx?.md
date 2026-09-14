Understood. We will cover only one Nx concept at a time.

# Lesson 1: What Is Nx?

Nx is a build system and monorepo management tool.

It helps you manage multiple related projects inside one repository, such as:

```
url-platform/
├── api-gateway/
├── url-service/
├── auth-service/
└── shared-libraries/
```

Nx does not replace NestJS.

- NestJS manages the internal structure and runtime behavior of an application.
    
- Nx manages the entire repository containing multiple applications and libraries.
    

For example:

TypeScript

```
@Controller('urls')
export class UrlsController {}
```

This is a NestJS concern because it defines an HTTP controller.

Bash

```
nx build url-service
```

This is an Nx concern because it tells Nx to build a project named `url-service`.

## Simple mental model

```
Nx Workspace
│
├── NestJS Application: api-gateway
├── NestJS Application: url-service
├── NestJS Application: auth-service
└── Shared Libraries
```

Therefore:

> NestJS builds the service. Nx manages the collection of services and shared libraries.

Nx can help with:

- Creating applications and libraries
    
- Running projects
    
- Building projects
    
- Testing projects
    
- Detecting project dependencies
    
- Running tasks only for affected projects
    
- Caching build and test results
    
- Enforcing architectural boundaries
    

However, Nx itself does not provide microservice communication. Features such as TCP, Redis, RabbitMQ, Kafka, and gRPC are provided by NestJS or other infrastructure.

Next single concept: the meaning of an Nx workspace.