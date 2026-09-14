# Practical Nx Setup — Starting from Zero

We will now move from theory to implementation.

We will build a small Nx workspace for your URL-shortener platform and gradually introduce:

- NestJS applications
    
- Shared libraries
    
- Project configuration
    
- Dependency relationships
    
- Task execution
    
- Caching
    
- Later, service extraction and microservice architecture
    

We will not create every service or folder in advance. We will create only what is needed at each step.

# Step 1: Decide the Initial Architecture

Instead of immediately creating multiple microservices, we will begin with a single NestJS application:

```
url-platform/
└── apps/
    └── url-service/
```

The first application will represent the URL-shortening backend.

Later, we may add:

```
apps/
├── url-service/
├── api-gateway/
├── auth-service/
└── analytics-service/
```

We will also create shared libraries only when real reuse appears, such as:

```
libs/
├── logger/
├── config/
└── contracts/
```

The initial approach is:

```
Start small
    ↓
Build the URL service
    ↓
Identify shared functionality
    ↓
Extract reusable libraries
    ↓
Add additional applications
    ↓
Introduce service-level boundaries
```

This prevents the repository from becoming an empty collection of unnecessary folders.

# Step 2: Check Required Tools

Before creating the workspace, verify that Node.js and your package manager are installed.

Run:

Bash

```
node --version
```

Then check npm:

Bash

```
npm --version
```

If you are using pnpm, also run:

Bash

```
pnpm --version
```

For an Nx workspace, we will use pnpm because it works well for monorepos and supports workspace dependency management.

If pnpm is not installed, install it using Corepack:

Bash

```
corepack enable
```

Then activate pnpm:

Bash

```
corepack prepare pnpm@latest --activate
```

Verify it:

Bash

```
pnpm --version
```

The expected result is a version number, for example:

```
10.x.x
```

The exact version may differ.

# Step 3: Create the Nx Workspace

Navigate to the directory where you keep your projects:

Bash

```
cd ~/Projects
```

Then create a new Nx workspace:

Bash

```
pnpm dlx create-nx-workspace@latest url-platform
```

Nx will ask several questions.

Choose options conceptually similar to these:

|  
Prompt

|

Choice

|  
| --- | --- |  
|

Workspace name

|

`url-platform`

|  
|

Stack

|

`Nest`

|  
|

Integrated monorepo

|

Yes

|  
|

Package manager

|

`pnpm`

|  
|

CI provider

|

Optional

|  
|

Nx Cloud

|

Optional for now

|

The exact prompts may differ depending on the Nx version.

The important choice is:

> Create a NestJS integrated monorepo named `url-platform`.

After the command completes:

Bash

```
cd url-platform
```

# Step 4: Inspect the Generated Workspace

Do not modify anything yet. First inspect the generated structure:

Bash

```
tree -L 3
```

If `tree` is not installed, use:

Bash

```
find . -maxdepth 3 -type f | sort
```

A generated NestJS Nx workspace may look conceptually similar to:

```
url-platform/
├── apps/
│   └── url-platform/
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

The exact names and files may vary.

At this point:

- `url-platform/` is the Nx workspace.
    
- `apps/` contains application projects.
    
- The generated NestJS application is the first project.
    
- `nx.json` contains workspace-level Nx configuration.
    
- `project.json` contains project-level configuration.
    
- `package.json` contains workspace package information.
    
- `pnpm-lock.yaml` locks dependency versions.
    

# Step 5: Understand the Generated Application Name

The generated application may be named after the workspace:

```
url-platform
```

But our intended backend service is:

```
url-service
```

We should eventually use the service-oriented name:

```
apps/url-service/
```

Before renaming anything manually, inspect the registered Nx projects:

Bash

```
pnpm nx show projects
```

This command lists the projects Nx currently recognizes.

You may see output similar to:

```
url-platform
```

This is important because Nx works with project names, not merely directory names.

For example:

Bash

```
pnpm nx serve url-platform
```

runs the project registered as `url-platform`.

The following command would work only if a project with that exact name exists:

Bash

```
pnpm nx serve url-service
```

Therefore, we must distinguish:

```
Directory name → Physical folder name
Project name    → Name Nx uses to identify the project
```

They are often related, but they are not conceptually identical.

# Step 6: Run the Generated NestJS Application

Use the project name returned by:

Bash

```
pnpm nx show projects
```

For example, if the project is named `url-platform`, run:

Bash

```
pnpm nx serve url-platform
```

The command means:

```
pnpm nx
    └── Invoke Nx

serve
    └── Execute the serve target

url-platform
    └── Select the project
```

Conceptually:

```
Nx workspace
    │
    ▼
Find project: url-platform
    │
    ▼
Find target: serve
    │
    ▼
Run the configured NestJS development server
```

You should see NestJS startup output similar to:

```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] AppModule dependencies initialized
[Nest] LOG [NestApplication] Nest application successfully started
```

The exact logs may differ.

Open the address shown in the terminal, commonly:

```
http://localhost:3000
```

Keep the server running while testing it.

To stop the server:

```
Ctrl + C
```

# Step 7: Inspect the Available Targets

Nx does not treat every command as an arbitrary script. Each project exposes configured targets.

To inspect the project configuration, run:

Bash

```
pnpm nx show project url-platform
```

Replace `url-platform` with the actual project name if different.

The output should show information about the project, including targets such as:

```
build
serve
test
lint
```

Conceptually:

```
Project: url-platform

Targets:
├── build
├── serve
├── test
└── lint
```

You can then execute individual targets:

Bash

```
pnpm nx build url-platform
```

Bash

```
pnpm nx test url-platform
```

Bash

```
pnpm nx lint url-platform
```

The general syntax is:

Bash

```
pnpm nx <target> <project>
```

Examples:

```
serve url-platform
build url-platform
test url-platform
lint url-platform
```

# Step 8: Run the First Build

Execute:

Bash

```
pnpm nx build url-platform
```

The build process should generate a distribution directory, often similar to:

```
dist/
└── apps/
    └── url-platform/
```

Inspect it:

Bash

```
find dist -maxdepth 4 -type f | sort
```

The exact output structure depends on the executor and Nx version.

The important relationship is:

```
Source code
    │
    ▼
nx build url-platform
    │
    ▼
Compiled application
    │
    ▼
dist/
```

This is our first practical example of an Nx task.

# Step 9: Run the Same Build Again

Run the same command a second time:

Bash

```
pnpm nx build url-platform
```

Because the task has already been executed, Nx may reuse its cached result if:

- The relevant source files have not changed.
    
- The project configuration has not changed.
    
- Relevant dependencies have not changed.
    
- The task is configured for caching.
    
- The previous execution completed successfully.
    

Conceptually:

```
First build:
pnpm nx build url-platform
        ↓
Build executes
        ↓
Result is cached

Second build:
pnpm nx build url-platform
        ↓
Nx checks the cache
        ↓
Cached result may be reused
```

This is the first practical demonstration of Nx task caching.

# Step 10: Inspect the Workspace Configuration

Now inspect the two important configuration files.

First:

Bash

```
cat nx.json
```

Then inspect the project configuration:

Bash

```
cat apps/url-platform/project.json
```

If the generated project uses a different directory or configuration style, locate it using:

Bash

```
find apps -name project.json -print
```

The conceptual separation is:

```
nx.json
└── Workspace-wide Nx configuration

apps/url-platform/project.json
└── Configuration for one application project
```

Do not change these files yet.

The purpose of this step is only to observe how the generated workspace is configured.

## Current checkpoint

At this point, you should have:

```
url-platform/
├── apps/
│   └── generated NestJS application
├── nx.json
├── package.json
├── pnpm-lock.yaml
└── tsconfig.base.json
```

And you should have practiced:

Bash

```
pnpm nx show projects
pnpm nx serve <project-name>
pnpm nx show project <project-name>
pnpm nx build <project-name>
pnpm nx test <project-name>
pnpm nx lint <project-name>
```

The next practical step will be to rename or recreate the generated application as `url-service`, so that the workspace starts using the correct URL-shortener service terminology.