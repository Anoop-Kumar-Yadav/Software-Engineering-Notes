# Practical Step 2: Create the `url-service` Application

We currently have an Nx workspace with one generated NestJS application. Now we need to make the application name match our actual project:

```
url-service
```

We will do this through Nx rather than manually renaming folders and configuration files.

## 1. Check the Existing Project

First, list all projects in the workspace:

Bash

```
pnpm nx show projects
```

You may see something similar to:

```
url-platform
```

The exact name depends on what you selected during workspace creation.

Let us assume the generated application is currently named:

```
url-platform
```

We want the final application project to be:

```
url-service
```

## 2. Generate a New NestJS Application

From the root of the Nx workspace, run:

Bash

```
pnpm nx g @nx/nest:application url-service
```

Here:

```
pnpm nx
    → Run Nx

g
    → Alias for generate

@nx/nest:application
    → Use the NestJS application generator

url-service
    → Name of the new application project
```

The generator may ask additional questions, depending on your Nx version.

For a basic setup, accept the appropriate defaults unless you specifically need another option.

## 3. Inspect the New Structure

After generation, inspect the workspace:

Bash

```
tree -L 4 apps
```

The structure should be conceptually similar to:

```
apps/
├── url-platform/
│   ├── src/
│   ├── project.json
│   └── ...
└── url-service/
    ├── src/
    │   ├── app/
    │   ├── main.ts
    │   └── ...
    ├── project.json
    ├── tsconfig.app.json
    └── ...
```

Your workspace now contains two application projects:

```
url-platform
url-service
```

At this stage, the old generated application still exists. We have not deleted it yet.

## 4. Confirm That Nx Recognizes `url-service`

Run:

Bash

```
pnpm nx show projects
```

You should now see:

```
url-platform
url-service
```

This confirms that Nx has registered the new application project.

The important distinction is:

```
Directory:
apps/url-service/

Nx project:
url-service
```

Nx will use the project name when executing commands:

Bash

```
pnpm nx serve url-service
```

## 5. Run the New Application

Start the new application:

Bash

```
pnpm nx serve url-service
```

Nx performs the following conceptual steps:

```
Find project: url-service
        │
        ▼
Find target: serve
        │
        ▼
Read the configured executor
        │
        ▼
Start the NestJS development server
```

You should see NestJS startup logs.

The application will commonly run on:

```
http://localhost:3000
```

If port `3000` is already occupied by the old application or another process, Nx may report a port conflict or use a different configured port.

Stop the server with:

```
Ctrl + C
```

## 6. Inspect the New Project Configuration

Open the generated project configuration:

Bash

```
cat apps/url-service/project.json
```

The configuration will vary depending on the Nx version, but conceptually it will contain:

JSON

```
{
  "name": "url-service",
  "projectType": "application",
  "sourceRoot": "apps/url-service/src",
  "targets": {
    "build": {},
    "serve": {},
    "test": {},
    "lint": {}
  }
}
```

The actual target configuration will contain executors and options.

The important fields are:

```
name
    → Nx project name

projectType
    → application

sourceRoot
    → Location of the application's source files

targets
    → Operations that Nx can execute for this project
```

## 7. Build the New Application

Run:

Bash

```
pnpm nx build url-service
```

Conceptually:

```
url-service:build
        │
        ▼
NestJS build executor
        │
        ▼
Compiled output
        │
        ▼
dist/apps/url-service/
```

Inspect the generated output:

Bash

```
find dist -maxdepth 4 -type f | sort
```

The exact files depend on the selected executor and build configuration.

## 8. Run the New Application’s Tests

Execute:

Bash

```
pnpm nx test url-service
```

This runs the `test` target belonging to the `url-service` project.

The command does not mean:

```
Run every test in the workspace
```

It means:

```
Run the test target of the url-service project
```

Similarly:

Bash

```
pnpm nx lint url-service
```

runs linting for only `url-service`.

## 9. Remove the Unwanted Generated Application

Once you have confirmed that `url-service` works, list the projects again:

Bash

```
pnpm nx show projects
```

If the original generated application was named `url-platform`, remove it with:

Bash

```
pnpm nx g @nx/workspace:remove url-platform
```

If your original project has another name, replace `url-platform` with that name.

The purpose of using the Nx removal generator is to remove the project through Nx-aware tooling instead of deleting only its directory.

After removal, verify:

Bash

```
pnpm nx show projects
```

The result should contain:

```
url-service
```

The old generated application should no longer be registered.

## 10. Expected Initial Workspace

After removing the unnecessary generated application, your workspace should conceptually look like:

```
url-platform/
├── apps/
│   └── url-service/
│       ├── src/
│       │   ├── app/
│       │   ├── main.ts
│       │   └── ...
│       ├── project.json
│       ├── tsconfig.app.json
│       └── ...
├── nx.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.base.json
└── ...
```

At this point:

```
Workspace name:
    url-platform

Application project:
    url-service
```

This is a clean starting point for your URL-shortener backend.

## Current Checkpoint

You should now be able to run:

Bash

```
pnpm nx show projects
pnpm nx serve url-service
pnpm nx build url-service
pnpm nx test url-service
pnpm nx lint url-service
```

The next practical concept is understanding the generated `url-service` project structure and the role of `main.ts`, `app.module.ts`, `project.json`, and TypeScript configuration together.