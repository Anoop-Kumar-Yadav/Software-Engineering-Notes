# Lesson 3: Nx Application Projects vs Library Projects

Inside an Nx workspace, projects are generally organized into two important categories:

1. Application projects
    
2. Library projects
    

The difference is based on their responsibility.

## 1. Application Project

An application project represents a runnable or deployable application.

In your NestJS microservices monorepo, examples include:

```
apps/
├── api-gateway/
├── url-service/
├── auth-service/
└── notification-service/
```

Each application normally has its own entry point.

For example, `url-service` may contain:

```
url-service/
└── src/
    ├── main.ts
    ├── app.module.ts
    └── modules/
        └── urls/
```

Its `main.ts` starts the application:

TypeScript

```
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
}

bootstrap();
```

A microservice application may instead start with a transport:

TypeScript

```
async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 4001,
    },
  });

  await app.listen();
}

bootstrap();
```

The exact transport and configuration depend on your architecture.

### Application project responsibilities

An application usually contains:

- Its bootstrap file
    
- Its root NestJS module
    
- Application-specific configuration
    
- Controllers
    
- Transport setup
    
- Service composition
    
- Deployment-related settings
    

An application is something you may run using:

Bash

```
nx serve url-service
```

or build using:

Bash

```
nx build url-service
```

## 2. Library Project

A library project contains reusable code intended to be consumed by other projects.

Examples:

```
libs/
├── logger/
├── config/
├── contracts/
└── common/
```

A logger library could provide a reusable logging service:

TypeScript

```
export class LoggerService {
  info(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }
}
```

Multiple applications may use it:

```
api-gateway       ───┐
url-service        ───┤
auth-service       ───┼──▶ logger
notification-service ─┘
```

A library normally does not represent an independently running server. It provides code that another project imports.

For example:

TypeScript

```
import { LoggerService } from '@url-platform/logger';
```

The application uses the library’s functionality, but the library itself does not need its own HTTP port.

## Main Difference

|  
Application project

|

Library project

|  
| --- | --- |  
|

Represents a runnable application

|

Represents reusable code

|  
|

Usually has a bootstrap file

|

Usually has exported modules, classes, or functions

|  
|

Can be independently deployed

|

Usually consumed by applications or other libraries

|  
|

May expose HTTP, TCP, Redis, or gRPC endpoints

|

Usually does not expose a network endpoint

|  
|

Example: `url-service`

|

Example: `logger`

|

## Example Workspace

```
url-platform/
│
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

The roles are:

```
Applications
│
├── api-gateway
├── url-service
└── auth-service

Libraries
│
├── logger
├── config
└── contracts
```

The applications can depend on libraries:

```
url-service
   ├──▶ logger
   ├──▶ config
   └──▶ contracts
```

But the libraries should not automatically depend on application projects.

A healthy dependency direction is:

```
Application
     │
     ▼
Library
```

Avoid this type of dependency:

```
logger library
     │
     ▼
url-service application
```

A generic logger should not know about the internal implementation of `url-service`.

## Important Microservice Architecture Point

A library is not automatically a microservice.

For example:

```
libs/url-domain/
```

may contain URL-related domain logic, but it is still only a library.

A real microservice requires an independently runnable application:

```
apps/url-service/
├── src/
│   ├── main.ts
│   └── app.module.ts
```

Therefore:

```
Library     = reusable code
Application = runnable/deployable project
Microservice = independently running application with a defined service boundary
```

Next single concept: how Nx represents these projects internally through project configuration.