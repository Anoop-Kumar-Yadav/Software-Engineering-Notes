# Dynamic Modules — Deep Dive

Dynamic Modules are one of the most important NestJS module concepts because they move you from:

> **"This module has a fixed configuration."**

to:

> **"This module is a reusable module whose providers can be generated/configured by the application at registration time."**

The key is to understand that a **Dynamic Module is still a Nest module**. The difference is that part of its module metadata is produced **programmatically**.

---

# 1. First: Static Module vs Dynamic Module

A normal module has fixed metadata:

```typescript
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

Every time you import it:

```typescript
@Module({
  imports: [DatabaseModule],
})
export class AppModule {}
```

you get the same module definition.

Conceptually:

```text
DatabaseModule
│
├── DatabaseService
└── exports DatabaseService
```

There is no configuration being supplied by the importing application.

---

A dynamic module introduces a **module factory method**:

```typescript
export class DatabaseModule {
  static forRoot(options): DynamicModule {
    return {
      module: DatabaseModule,
      // dynamically generated metadata
    };
  }
}
```

Now the application can say:

```typescript
DatabaseModule.forRoot(options)
```

The important difference is:

```text
Static

AppModule
   │
   └── DatabaseModule


Dynamic

AppModule
   │
   └── DatabaseModule.forRoot(options)
                         │
                         ▼
                  DynamicModule metadata
```

So the importing application can influence how the module is configured.

---

# 2. What is `DynamicModule`?

Nest provides the `DynamicModule` type:

```typescript
import { DynamicModule } from '@nestjs/common';
```

A dynamic module method returns an object describing additional module metadata:

```typescript
static forRoot(...): DynamicModule {
  return {
    module: DatabaseModule,
    providers: [...],
    exports: [...],
  };
}
```

The critical property is:

```typescript
module: DatabaseModule
```

This identifies the **base module class** that the dynamic metadata belongs to.

Think of it as:

```text
DatabaseModule class
        +
runtime-generated metadata
        ↓
Dynamic module definition
```

---

# 3. The most important idea: `@Module()` + DynamicModule are combined

This is where dynamic modules are often misunderstood.

Consider:

```typescript
@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);

    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
```

There are **two sources of module metadata**.

### Static metadata

Defined by:

```typescript
@Module({
  providers: [Connection],
  exports: [Connection],
})
```

### Dynamic metadata

Returned by:

```typescript
forRoot(...)
```

```typescript
return {
  module: DatabaseModule,
  providers: providers,
  exports: providers,
};
```

Nest combines them.

Conceptually:

```text
                  DatabaseModule
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
       Static metadata     Dynamic metadata
             │                   │
             ▼                   ▼
       Connection          Repository providers
             │                   │
             └─────────┬─────────┘
                       ▼
                 Final module
```

This is why the documentation says dynamic metadata **extends rather than overrides** the base module metadata.

---

# 4. Let's trace the example completely

Suppose:

```typescript
@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);

    return {
      module: DatabaseModule,
      providers,
      exports: providers,
    };
  }
}
```

And:

```typescript
@Module({
  imports: [
    DatabaseModule.forRoot([User]),
  ],
})
export class AppModule {}
```

The important part is:

```typescript
DatabaseModule.forRoot([User])
```

This is an ordinary TypeScript method call.

It executes when Nest is constructing the module configuration.

Conceptually:

```text
AppModule
   │
   │ evaluates
   ▼
DatabaseModule.forRoot([User])
   │
   ▼
createDatabaseProviders(options, [User])
   │
   ▼
repository providers generated
   │
   ▼
DynamicModule object returned
```

Something conceptually similar to:

```typescript
{
  module: DatabaseModule,

  // from @Module()
  providers: [
    Connection,
  ],

  // generated dynamically
  // e.g. repositories
  providers: [
    /* generated providers */
  ],

  exports: [
    /* generated providers */
  ],
}
```

Nest merges the static and dynamic metadata.

The final conceptual module becomes:

```text
DatabaseModule
│
├── Connection              ← static
│
├── UserRepository          ← dynamic
├── OrderRepository         ← dynamic
├── ProductRepository       ← dynamic
│
└── exports
     ├── Connection
     ├── UserRepository
     ├── OrderRepository
     └── ProductRepository
```

---

# 5. Why are Dynamic Modules useful?

Because some modules cannot know their providers ahead of time.

Consider a database module.

You might have:

```text
entities/
├── User
├── Order
├── Product
└── Payment
```

You want the database module to create repositories for the entities supplied by the application.

Instead of hardcoding:

```typescript
@Module({
  providers: [
    UserRepository,
    OrderRepository,
    ProductRepository,
    PaymentRepository,
  ],
})
```

the module can accept:

```typescript
DatabaseModule.forRoot([
  User,
  Order,
  Product,
  Payment,
])
```

and generate providers:

```text
entities
   │
   ▼
forRoot(entities)
   │
   ▼
createDatabaseProviders()
   │
   ▼
┌─────────────────────┐
│ UserRepository      │
│ OrderRepository     │
│ ProductRepository   │
│ PaymentRepository   │
└─────────────────────┘
```

This is the core value of dynamic modules:

> **The module's provider graph can be constructed based on runtime configuration.**

---

# 6. `forRoot()` is a convention

You'll frequently see:

```typescript
DatabaseModule.forRoot(...)
```

The name `forRoot()` is a **Nest convention**, not a language requirement.

You could technically write:

```typescript
DatabaseModule.configure(...)
```

or:

```typescript
DatabaseModule.register(...)
```

or:

```typescript
DatabaseModule.initialize(...)
```

provided it returns the appropriate dynamic module metadata.

But Nest ecosystem modules commonly use conventions such as:

```text
forRoot()
forRootAsync()

register()
registerAsync()
```

The general semantic idea is:

```text
forRoot()
     ↓
initial/root configuration

forRootAsync()
     ↓
configuration requiring async dependency resolution
```

The exact method name is up to the module author.

---

# 7. `forRoot()` does not necessarily mean "global"

This is important.

Don't interpret:

```typescript
DatabaseModule.forRoot(...)
```

as:

```text
make DatabaseModule global
```

It simply means:

```text
configure DatabaseModule
```

For example:

```typescript
@Module({
  imports: [
    DatabaseModule.forRoot([User]),
  ],
})
export class AppModule {}
```

The module is dynamic.

It is **not automatically global**.

---

# 8. Making a Dynamic Module global

A dynamic module can return:

```typescript
{
  global: true,
  module: DatabaseModule,
  providers: providers,
  exports: providers,
}
```

Now:

```text
DatabaseModule.forRoot(...)
        │
        ▼
DynamicModule
        │
        ├── global: true
        │
        ├── providers
        │
        └── exports
```

Conceptually:

```text
                     AppModule
                         │
                         │ registers
                         ▼
                DatabaseModule
                  global: true
                         │
                         ▼
                 Database providers
                    /    |    \
                   ▼     ▼     ▼
                User   Order  Payment
```

Other modules don't need to explicitly import the dynamic module to access its exported providers.

But the same architectural warning applies:

> **Dynamic does not imply global, and making a dynamic module global should be an intentional design decision.**

---

# 9. Dynamic Module vs Global Module

These solve **different problems**.

### Dynamic module

Answers:

> **"How should this module be configured?"**

```text
DatabaseModule
      │
      ▼
forRoot(options)
      │
      ▼
custom providers
```

### Global module

Answers:

> **"Where should this module's exported providers be available?"**

```text
@Global()
     │
     ▼
application-wide availability
```

You can combine them:

```text
Dynamic
   +
global: true
   ↓
Configured dynamically
AND
available globally
```

---

# 10. Dynamic providers are the real power

Look at:

```typescript
const providers = createDatabaseProviders(options, entities);
```

This line is extremely important.

The dynamic module itself doesn't magically create repositories.

Your code generates provider definitions.

For example, conceptually:

```typescript
function createDatabaseProviders(entities, options) {
  return entities.map(entity => ({
    provide: `${entity.name}Repository`,
    useFactory: () => {
      // create repository
    },
  }));
}
```

If:

```typescript
entities = [User, Order]
```

the result could conceptually be:

```typescript
[
  {
    provide: 'UserRepository',
    useFactory: ...
  },
  {
    provide: 'OrderRepository',
    useFactory: ...
  },
]
```

Then:

```typescript
return {
  module: DatabaseModule,
  providers,
  exports: providers,
};
```

So the complete mechanism is:

```text
                 Configuration
                      │
                      ▼
                forRoot(...)
                      │
                      ▼
        createDatabaseProviders(...)
                      │
                      ▼
             Provider definitions
                      │
                      ▼
              DynamicModule object
                      │
                      ▼
                 Nest DI Container
                      │
                      ▼
             Actual provider instances
```

This is the core internal flow you should remember.

---

# 11. Dynamic module is configuration-time, not request-time

Another important distinction.

When you write:

```typescript
DatabaseModule.forRoot([User])
```

you are not saying:

> "Every HTTP request should execute this."

You're defining the application's module graph/configuration.

Conceptually:

```text
Application startup
       │
       ▼
Build module graph
       │
       ▼
Evaluate dynamic module configuration
       │
       ▼
Register providers
       │
       ▼
Create/resolution lifecycle begins
       │
       ▼
HTTP requests
```

So Dynamic Modules primarily participate in **application/module initialization**, not per-request processing.

---

# 12. Dynamic module is still a module

This is worth emphasizing.

A common misconception is:

> "Dynamic module is some completely different Nest concept."

No.

It's still:

```text
Nest Module
```

The difference is that part of its metadata is supplied programmatically.

Think:

```text
Normal Module

@Module({...})
class DatabaseModule {}
```

versus:

```text
Dynamic Module

@Module({...})
class DatabaseModule {
   static forRoot(...) {
      return {
         module: DatabaseModule,
         ...
      };
   }
}
```

The same module participates in Nest's application graph and DI system.

---

# 13. Dynamic module registration syntax

The consumer writes:

```typescript
@Module({
  imports: [
    DatabaseModule.forRoot([User]),
  ],
})
export class AppModule {}
```

Notice that `imports` normally contains **module classes**:

```typescript
imports: [
  DatabaseModule,
]
```

But here it contains:

```typescript
DatabaseModule.forRoot(...)
```

which returns:

```typescript
DynamicModule
```

So:

```text
imports
   │
   ├── Static module class
   │
   └── DynamicModule object
```

Both are valid module registrations.

---

# 14. What does the returned object represent?

Take:

```typescript
return {
  module: DatabaseModule,
  providers,
  exports: providers,
};
```

Read it as:

```text
module
   ↓
Which module is this configuration for?

providers
   ↓
Which additional providers should this registration add?

exports
   ↓
Which of those providers should this module expose?
```

So:

```typescript
module: DatabaseModule
```

is essential.

The dynamic metadata is associated with the `DatabaseModule` class.

---

# 15. Static providers + dynamic providers

This is probably the most important example from the documentation.

Static:

```typescript
@Module({
  providers: [Connection],
  exports: [Connection],
})
```

Dynamic:

```typescript
return {
  module: DatabaseModule,
  providers,
  exports: providers,
};
```

Final conceptual result:

```text
                  DatabaseModule
                       │
          ┌────────────┴────────────┐
          │                         │
     STATIC PART               DYNAMIC PART
          │                         │
          ▼                         ▼
     Connection              Repository providers
          │                         │
          └────────────┬────────────┘
                       ▼
                  Module API
```

Therefore, `Connection` isn't replaced.

The dynamic providers are **added alongside it**.

---

# 16. Dynamic module and dependency injection

Dynamic modules become particularly powerful when combined with DI.

Imagine:

```typescript
DatabaseModule.forRoot({
  host: 'localhost',
  port: 5432,
})
```

The dynamic module can create a provider:

```typescript
{
  provide: DATABASE_OPTIONS,
  useValue: {
    host: 'localhost',
    port: 5432,
  },
}
```

Then:

```typescript
@Injectable()
export class DatabaseConnection {
  constructor(
    @Inject(DATABASE_OPTIONS)
    private options: DatabaseOptions,
  ) {}
}
```

The architecture becomes:

```text
Application configuration
        │
        ▼
DatabaseModule.forRoot(options)
        │
        ▼
DATABASE_OPTIONS provider
        │
        ▼
DatabaseConnection
        │
        ▼
Other providers
```

This is how reusable infrastructure modules become configurable without hardcoding application-specific values.

---

# 17. Dynamic modules solve the "library configuration" problem

Suppose you build a reusable module:

```text
MyDatabaseModule
```

You don't know:

- which database host the application uses
    
- which entities it has
    
- which credentials it uses
    
- which connection options it needs
    
- which repositories need to be generated
    

You don't want consumers modifying your source code.

Instead:

```typescript
MyDatabaseModule.forRoot({
  host: process.env.DB_HOST,
  port: 5432,
  entities: [User, Order],
})
```

The library owns the implementation.

The application owns the configuration.

```text
               Reusable Module
               ┌───────────────┐
               │ implementation │
               │ providers      │
               │ factories      │
               └───────┬───────┘
                       │
                configuration
                       ▲
                       │
               Application
```

This is why dynamic modules are heavily used by infrastructure/library modules.

---

# 18. Re-exporting a Dynamic Module

Now the documentation introduces another subtle point.

Suppose:

```typescript
@Module({
  imports: [
    DatabaseModule.forRoot([User]),
  ],
  exports: [
    DatabaseModule,
  ],
})
export class AppModule {}
```

Notice:

```typescript
imports: [
  DatabaseModule.forRoot([User]),
]
```

but:

```typescript
exports: [
  DatabaseModule,
]
```

not:

```typescript
exports: [
  DatabaseModule.forRoot([User]),
]
```

Why?

Because the dynamic configuration is already associated with the imported dynamic module registration.

Conceptually:

```text
AppModule
   │
   ├── imports
   │      │
   │      ▼
   │  DatabaseModule.forRoot([User])
   │      │
   │      ▼
   │  configured DatabaseModule
   │
   └── exports
          │
          ▼
      DatabaseModule
```

The export refers to the module class.

The important distinction is:

```text
imports → configure/register the dynamic module

exports → re-export the module
```

---

# 19. Don't call `forRoot()` again just to export it

Avoid:

```typescript
@Module({
  imports: [
    DatabaseModule.forRoot([User]),
  ],
  exports: [
    DatabaseModule.forRoot([User]), // ❌
  ],
})
export class AppModule {}
```

The documentation specifically points out that you can omit the `forRoot()` call in the exports array:

```typescript
exports: [DatabaseModule]
```

This preserves the configured module registration rather than creating another configuration expression unnecessarily.

---

# 20. `forRoot()` can be asynchronous

The documentation says:

> `forRoot()` may return a dynamic module synchronously or asynchronously.

Synchronous:

```typescript
static forRoot(options): DynamicModule {
  return {
    module: DatabaseModule,
    providers: [...],
  };
}
```

Asynchronous:

```typescript
static async forRoot(options): Promise<DynamicModule> {
  const providers = await createProviders(options);

  return {
    module: DatabaseModule,
    providers,
  };
}
```

The conceptual difference:

```text
Synchronous

forRoot()
   │
   ▼
DynamicModule
```

versus:

```text
Asynchronous

forRoot()
   │
   ▼
Promise<DynamicModule>
   │
   ▼
DynamicModule
```

This is useful when module configuration itself requires asynchronous work.

However, in the broader Nest ecosystem, `forRootAsync()` is also commonly used when the configuration should be constructed through Nest's DI system.

---

# 21. Why `forRootAsync()` exists

Suppose your configuration depends on another provider:

```text
ConfigService
      │
      ▼
Database configuration
      │
      ▼
DatabaseModule
```

You may want:

```typescript
DatabaseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    host: config.get('DB_HOST'),
  }),
})
```

Now the configuration itself participates in Nest DI.

The conceptual flow is:

```text
Nest DI Container
       │
       ▼
ConfigService
       │
       ▼
configuration factory
       │
       ▼
Database options
       │
       ▼
Database providers
```

This is a major pattern in configurable Nest libraries.

---

# 22. Dynamic Module vs Factory Provider

Don't confuse these.

### Factory provider

Creates a **provider** dynamically:

```typescript
{
  provide: 'DATABASE',
  useFactory: (...) => {...},
}
```

Its concern is:

```text
"How do I create this provider?"
```

### Dynamic module

Creates/configures a **module definition** dynamically:

```typescript
DatabaseModule.forRoot(...)
```

Its concern is:

```text
"How should this entire module be configured?"
```

And dynamic modules frequently **contain factory providers**.

So:

```text
Dynamic Module
      │
      ├── providers
      │      │
      │      └── useFactory
      │
      └── exports
```

They operate at different architectural levels.

---

# 23. Dynamic Module as a module factory

A very useful mental model is:

```typescript
DatabaseModule.forRoot(options)
```

behaves conceptually like a:

```text
MODULE FACTORY
```

Input:

```text
options
entities
configuration
```

Output:

```text
DynamicModule
```

So:

```text
              Input
                │
                ▼
       DatabaseModule.forRoot()
                │
                ▼
       ┌──────────────────┐
       │ DynamicModule    │
       │                  │
       │ providers        │
       │ exports          │
       │ imports          │
       │ global           │
       └──────────────────┘
```

This is probably the cleanest way to understand the entire feature.

---

# 24. Full architecture example

Imagine your URL shortener has a reusable database module.

You could have:

```typescript
@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(
    entities: Function[],
    options: DatabaseOptions,
  ): DynamicModule {
    const providers = createDatabaseProviders(
      entities,
      options,
    );

    return {
      module: DatabaseModule,
      providers,
      exports: providers,
    };
  }
}
```

Application:

```typescript
@Module({
  imports: [
    DatabaseModule.forRoot(
      [Url],
      {
        host: 'localhost',
        port: 5432,
      },
    ),
  ],
})
export class AppModule {}
```

Flow:

```text
                 AppModule
                    │
                    │
                    ▼
          DatabaseModule.forRoot()
                    │
          ┌─────────┴──────────┐
          │                    │
       entities             options
          │                    │
          └─────────┬──────────┘
                    ▼
      createDatabaseProviders()
                    │
                    ▼
          DynamicModule object
                    │
                    ▼
             Nest Module Graph
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     Connection          UrlRepository
          │                   │
          └─────────┬─────────┘
                    ▼
               DI Container
                    │
                    ▼
              UrlService
```

That is the complete purpose of dynamic modules.

---

# 25. Static vs Dynamic vs Global vs Re-export

Now connect the module concepts you've learned.

|Concept|Main question it answers|
|---|---|
|**Normal Module**|What providers/controllers belong together?|
|**Exports**|What does this module expose?|
|**Re-export**|What imported module/API should I forward?|
|**Global Module**|Should exported providers be available application-wide?|
|**Dynamic Module**|How should this module's configuration/providers be generated?|

They can also be combined.

For example:

```text
Dynamic
   +
Global
   +
Exports
```

can produce:

```text
Configured module
       │
       ├── dynamically generated providers
       │
       ├── exported providers
       │
       └── globally available
```

---

# 26. The most important distinction

Don't think:

```text
Dynamic Module
=
module whose providers are created during every request
```

That's incorrect.

Think:

```text
Dynamic Module
=
module whose Nest module metadata
can be generated/configured programmatically
```

The lifecycle is:

```text
                Application startup
                       │
                       ▼
                Module registration
                       │
                       ▼
              forRoot(options)
                       │
                       ▼
              DynamicModule metadata
                       │
                       ▼
               Module graph built
                       │
                       ▼
                DI providers
                       │
                       ▼
                 Application
                       │
                       ▼
                   Requests
```

---

# 27. One final mental model

You can now view Nest modules at four levels:

```text
┌──────────────────────────────────────────────────────────┐
│                     MODULE                               │
│                                                          │
│  @Module()                                               │
│      │                                                   │
│      ├── providers → what module manages                 │
│      ├── controllers → HTTP/message entry points         │
│      ├── imports → dependencies                          │
│      └── exports → public API                            │
│                                                          │
│  @Global()                                                │
│      └── exported API becomes application-wide           │
│                                                          │
│  Re-export                                                │
│      └── forwards imported module's public API            │
│                                                          │
│  Dynamic Module                                           │
│      └── module metadata generated from configuration     │
└──────────────────────────────────────────────────────────┘
```

And Dynamic Modules specifically:

```text
                   Application
                       │
                       ▼
          DatabaseModule.forRoot(options)
                       │
                       ▼
                Module Factory
                       │
             ┌─────────┴──────────┐
             │                    │
             ▼                    ▼
        configuration          entities
             │                    │
             └─────────┬──────────┘
                       ▼
             generated providers
                       │
                       ▼
                 DynamicModule
                       │
                       ▼
                Nest Module Graph
                       │
                       ▼
                 IoC Container
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
          Connection  Repo     Repo
```

### The one sentence to retain

> **A Dynamic Module is a reusable Nest module whose module metadata—especially providers, exports, imports, and optionally global scope—can be generated from configuration when the application registers the module.**

That distinction is the foundation for understanding Nest's `forRoot()`, `forRootAsync()`, `register()`, `registerAsync()`, and later `ConfigurableModuleBuilder` patterns.
# Perfect Dynamic Module Example

A clean, self-contained example using a configurable `DatabaseModule` that dynamically creates repository providers.

## Folder Structure

```text
src/
│
├── app.module.ts
├── main.ts
│
├── database/
│   ├── database.module.ts
│   ├── database.constants.ts
│   ├── database.types.ts
│   ├── database.connection.ts
│   ├── database.factory.ts
│   ├── database.providers.ts
│   └── database.tokens.ts
│
└── users/
    ├── user.entity.ts
    ├── users.module.ts
    └── users.service.ts
```

---

## `database/database.types.ts`

```typescript
export interface DatabaseOptions {
  host: string;
  port: number;
  database: string;
}
```

---

## `database/database.constants.ts`

```typescript
export const DATABASE_OPTIONS = Symbol('DATABASE_OPTIONS');
```

---

## `database/database.tokens.ts`

```typescript
export function getRepositoryToken(entity: Function): symbol {
  return Symbol.for(`${entity.name}:repository`);
}
```

---

## `database/database.connection.ts`

```typescript
import { Inject, Injectable } from '@nestjs/common';

import { DATABASE_OPTIONS } from './database.constants.js';
import { DatabaseOptions } from './database.types.js';

@Injectable()
export class DatabaseConnection {
  constructor(
    @Inject(DATABASE_OPTIONS)
    private readonly options: DatabaseOptions,
  ) {}

  connect(): void {
    console.log(
      `Connected to ${this.options.host}:${this.options.port}/${this.options.database}`,
    );
  }
}
```

---

## `database/database.factory.ts`

```typescript
import { DatabaseOptions } from './database.types.js';

export function createRepository(
  entity: Function,
  options: DatabaseOptions,
) {
  return {
    findAll() {
      console.log(
        `Fetching ${entity.name} records from ${options.database}`,
      );

      return [];
    },

    findById(id: string) {
      console.log(
        `Fetching ${entity.name} with id ${id}`,
      );

      return undefined;
    },
  };
}
```

---

## `database/database.providers.ts`

```typescript
import { DATABASE_OPTIONS } from './database.constants.js';
import { createRepository } from './database.factory.js';
import { getRepositoryToken } from './database.tokens.js';
import { DatabaseOptions } from './database.types.js';

export function createDatabaseProviders(
  entities: Function[],
) {
  return entities.map((entity) => ({
    provide: getRepositoryToken(entity),

    inject: [DATABASE_OPTIONS],

    useFactory: (options: DatabaseOptions) => {
      return createRepository(entity, options);
    },
  }));
}
```

---

# `database/database.module.ts`

```typescript
import {
  DynamicModule,
  Global,
  Module,
} from '@nestjs/common';

import { DATABASE_OPTIONS } from './database.constants.js';
import { DatabaseConnection } from './database.connection.js';
import { createDatabaseProviders } from './database.providers.js';
import { DatabaseOptions } from './database.types.js';

@Global()
@Module({
  providers: [DatabaseConnection],
  exports: [DatabaseConnection],
})
export class DatabaseModule {
  static forRoot(
    entities: Function[],
    options: DatabaseOptions,
  ): DynamicModule {
    const repositoryProviders =
      createDatabaseProviders(entities);

    return {
      module: DatabaseModule,

      global: true,

      providers: [
        {
          provide: DATABASE_OPTIONS,
          useValue: options,
        },

        ...repositoryProviders,
      ],

      exports: [
        DatabaseConnection,
        ...repositoryProviders,
      ],
    };
  }
}
```

---

# `users/user.entity.ts`

```typescript
export class User {
  id!: string;
  name!: string;
  email!: string;
}
```

---

# `users/users.service.ts`

```typescript
import { Inject, Injectable } from '@nestjs/common';

import { getRepositoryToken } from '../database/database.tokens.js';
import { User } from './user.entity.js';

interface UserRepository {
  findAll(): User[];
  findById(id: string): User | undefined;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(getRepositoryToken(User))
    private readonly userRepository: UserRepository,
  ) {}

  findAll() {
    return this.userRepository.findAll();
  }

  findById(id: string) {
    return this.userRepository.findById(id);
  }
}
```

---

# `users/users.module.ts`

```typescript
import { Module } from '@nestjs/common';

import { UsersService } from './users.service.js';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

Notice that `UsersModule` does **not** import `DatabaseModule`.

That's because our example intentionally makes `DatabaseModule` global.

---

# `app.module.ts`

```typescript
import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module.js';
import { User } from './users/user.entity.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    DatabaseModule.forRoot(
      [User],
      {
        host: 'localhost',
        port: 5432,
        database: 'url_shortener',
      },
    ),

    UsersModule,
  ],
})
export class AppModule {}
```

---

# `main.ts`

```typescript
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
}

bootstrap();
```

---

# What Nest Builds

When this executes:

```typescript
DatabaseModule.forRoot(
  [User],
  {
    host: 'localhost',
    port: 5432,
    database: 'url_shortener',
  },
)
```

the dynamic module generates:

```text
DatabaseModule
│
├── DatabaseConnection
│
├── DATABASE_OPTIONS
│
└── UserRepository
```

The provider flow is:

```text
                    DatabaseModule.forRoot()
                             │
                 ┌───────────┴───────────┐
                 │                       │
              options                 entities
                 │                       │
                 ▼                       ▼
        DATABASE_OPTIONS          [User]
                                         │
                                         ▼
                              createDatabaseProviders()
                                         │
                                         ▼
                                  UserRepository
```

Then DI:

```text
DATABASE_OPTIONS
       │
       ├──────────────► DatabaseConnection
       │
       └──────────────► UserRepository
                              │
                              ▼
                         UsersService
```

And because the module is global:

```text
                 DatabaseModule
                    @Global()
                       │
                       ▼
              exported providers
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       UsersModule  OrdersModule  AuthModule
```

This is a clean representation of the **Dynamic Module pattern**: configuration enters through `forRoot()`, providers are generated in a separate provider factory, construction logic is separated into its own factory, DI tokens are isolated, and the module exposes the generated providers through `exports`.