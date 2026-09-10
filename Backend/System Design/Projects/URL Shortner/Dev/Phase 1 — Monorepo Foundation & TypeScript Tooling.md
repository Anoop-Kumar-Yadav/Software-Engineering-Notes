
> **Goal of this phase:** Establish the workspace structure, root development tooling, shared TypeScript configuration, and TypeScript project-reference architecture **before creating any actual service or package implementation**.

---

## 1. Initialize the Workspace

### `pnpm init` → `package.json`

`package.json` is the root manifest of the monorepo.

It defines the project metadata, package manager, and eventually the root-level development scripts.

```bash
pnpm init
```

Check the installed pnpm version:

```bash
pnpm --version
```

Expected:

```text
11.9.0
```

Add the following to the root `package.json`:

```json
{
  "private": true,
  "packageManager": "pnpm@11.9.0"
}
```

### Why?

|Configuration|Purpose|
|---|---|
|`private: true`|Prevents accidentally publishing the root monorepo package to npm|
|`packageManager`|Records the pnpm version expected by the project|

**Important:** The root package is the **workspace manager**, not an application package.

---

# 2. Define the pnpm Workspace

## Create `pnpm-workspace.yaml`

```yaml
packages:
  - "services/*"
  - "packages/*"
```

### What this means

```text
packages:
```

Tells pnpm which directories can contain workspace packages.

```text
services/*
```

Search every **immediate child directory** inside `services/`.

For example:

```text
services/
├── auth/
├── user/
└── gateway/
```

Each can become an independent workspace package.

```text
packages/*
```

Does the same for reusable internal packages:

```text
packages/
├── logger/
├── config/
├── types/
└── database/
```

### Important distinction

**pnpm understands the workspace automatically.**

TypeScript does **not** understand this dependency graph automatically.

That is why we will later introduce **TypeScript Project References**.

---

# 3. Root Development Tools

## pnpm flags

Two flags are particularly important for this architecture:

|Flag|Meaning|
|---|---|
|`-D`|`--save-dev`|
|`-w`|`--workspace-root`|

`-D` means the dependency is used for development rather than runtime application execution.

`-w` explicitly tells pnpm to install the dependency in the **workspace root**.

---

## Install the root tooling

```bash
pnpm add -D -w \
  typescript \
  @types/node \
  tsx \
  prettier \
  eslint \
  @eslint/js \
  typescript-eslint
```

### Why each package exists

|Package|Responsibility|
|---|---|
|`typescript`|TypeScript compiler and type checker|
|`@types/node`|Type definitions for Node.js APIs|
|`tsx`|Runs TypeScript directly; supports fast startup, watch mode, ESM, and source maps|
|`prettier`|Code formatting|
|`eslint`|Code-quality analysis: unused variables, dangerous patterns, bad practices, potential bugs|
|`@eslint/js`|Official JavaScript rule set/configuration from ESLint|
|`typescript-eslint`|TypeScript parser, plugin, and ESLint configurations|

### Important

With modern `typescript-eslint`, you **do not need to separately install**:

```text
@typescript-eslint/parser
@typescript-eslint/eslint-plugin
```

`typescript-eslint` provides the necessary pieces.

---

# 4. Root Workspace Scripts

Add the following to the root `package.json`:

```json
{
  "scripts": {
    "build": "pnpm -r --workspace-root=false run build",
    "dev": "pnpm -r --workspace-root=false run dev",
    "lint": "pnpm -r --workspace-root=false run lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "pnpm -r --workspace-root=false run test",
    "clean": "pnpm -r --workspace-root=false run clean"
  }
}
```

## Understanding `-r`

```text
-r
```

means:

```text
--recursive
```

It tells pnpm to execute the command across workspace packages.

---

## Understanding `--workspace-root=false`

```text
--workspace-root=false
```

means:

> Do not execute the command in the root package; execute it only in child workspace packages.

Therefore:

```bash
pnpm -r --workspace-root=false run build
```

means:

```text
Root
 │
 ├── packages/logger     → run build
 ├── packages/config     → run build
 ├── packages/types      → run build
 ├── packages/database   → run build
 │
 ├── services/auth       → run build
 ├── services/user       → run build
 └── services/gateway    → run build
```

provided those packages define a `build` script.

For example, a workspace package could eventually contain:

```json
{
  "scripts": {
    "build": "tsc -b"
  }
}
```

---

# 5. Is This Root Script Architecture Production-Grade?

### Short answer: **Good for a small/medium monorepo, but not the final optimization for a large project.**

The recursive pnpm commands are simple and useful for understanding the workspace.

For a large production monorepo, tools such as:

- **Turborepo**
    
- **Nx**
    
- **concurrently**
    

can provide better task orchestration, caching, parallel execution, dependency-aware task scheduling, and incremental builds.

The important distinction is:

> `pnpm` manages the **workspace**; a build orchestrator manages the **workflow between packages**.

---

# 6. Create the Shared TypeScript Configuration

## `tsconfig.base.json`

This file contains compiler options shared by every package.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    "strict": true,

    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    "forceConsistentCasingInFileNames": true,

    "skipLibCheck": true,

    "resolveJsonModule": true,

    "isolatedModules": true,

    "declaration": true,
    "declarationMap": true,

    "sourceMap": true,

    "incremental": true,

    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    "types": ["node"]
  },

  "exclude": ["node_modules", "dist"]
}
```

---

## Why `tsconfig.base.json` exists

Without a shared configuration, every package would have to repeat the same compiler configuration:

```text
packages/logger/tsconfig.json
packages/config/tsconfig.json
packages/types/tsconfig.json
packages/database/tsconfig.json

services/auth/tsconfig.json
services/user/tsconfig.json
services/gateway/tsconfig.json
```

That creates configuration drift.

Instead:

```text
                  tsconfig.base.json
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       logger          config         types
       tsconfig       tsconfig       tsconfig
```

Every workspace package **extends the same base rules**.

---

# 7. Understand the Important Compiler Options

|Option|Purpose|
|---|---|
|`target: ES2022`|Defines the JavaScript language level TypeScript targets|
|`module: NodeNext`|Uses modern Node.js module semantics|
|`moduleResolution: NodeNext`|Resolves imports according to Node.js ESM/CommonJS rules|
|`strict: true`|Enables TypeScript's strict type-checking family|
|`esModuleInterop`|Makes importing CommonJS packages more convenient with ESM-style imports|
|`allowSyntheticDefaultImports`|Allows default-import syntax when a package doesn't expose a true ES default export|
|`forceConsistentCasingInFileNames`|Prevents case-related failures between Windows and Linux|
|`skipLibCheck`|Avoids type-checking every declaration file inside dependencies|
|`resolveJsonModule`|Allows importing JSON files|
|`isolatedModules`|Ensures files can be transpiled independently|
|`declaration`|Generates `.d.ts` declaration files|
|`declarationMap`|Generates `.d.ts.map` files for editor navigation back to source|
|`sourceMap`|Maps generated JavaScript back to TypeScript|
|`incremental`|Stores build information so subsequent compilation can be faster|
|`noUncheckedIndexedAccess`|Forces handling of potentially missing indexed values|
|`exactOptionalPropertyTypes`|Makes optional properties distinguish between missing and explicitly `undefined`|
|`types: ["node"]`|Loads Node.js global/API type definitions|

---

## `NodeNext` vs `bundler`

For this backend architecture:

```json
"module": "NodeNext",
"moduleResolution": "NodeNext"
```

is intentional.

`NodeNext` follows Node.js's actual module-resolution rules, including modern ESM behavior and package boundaries.

`bundler` is generally more appropriate for applications whose modules are ultimately resolved by a frontend bundler.

For a Node.js backend, **NodeNext makes the runtime/module contract explicit**.

---

# 8. Create the Root `tsconfig.json`

The root `tsconfig.json` is **not another complete compiler configuration**.

Its job is to describe the **TypeScript project dependency graph**.

Create:

```text
tsconfig.json
```

```json
{
  "extends": "./tsconfig.base.json",

  "compilerOptions": {
    "composite": true,
    "noEmit": true
  },

  "files": [],

  "references": [
    { "path": "./packages/logger" },
    { "path": "./packages/config" },
    { "path": "./packages/types" },
    { "path": "./packages/database" },

    { "path": "./services/auth" },
    { "path": "./services/user" },
    { "path": "./services/gateway" }
  ]
}
```

---

# 9. Why `composite` Matters

```json
"composite": true
```

means this TypeScript project can participate in **Project References**.

TypeScript can then build projects using:

```bash
tsc -b
```

and understand their dependency relationships.

Conceptually:

```text
types
  ↓
config
  ↓
database
  ↓
services
```

TypeScript can use the generated build metadata to determine what actually needs rebuilding.

---

# 10. Why `noEmit` Is Used at the Root

```json
"noEmit": true
```

The root project is an **orchestrator/project-reference container**, not an actual application package.

Therefore, it should not generate:

```text
dist/
index.js
index.d.ts
```

The individual workspace packages are responsible for producing their own build output.

---

# 11. Why `files: []` Is Important

```json
"files": []
```

means:

> The root TypeScript project itself has no source files to compile.

It exists primarily to coordinate the referenced projects.

---

# 12. Why `references` Exists

```json
"references": [
  { "path": "./packages/logger" },
  { "path": "./packages/config" },
  { "path": "./packages/types" },
  { "path": "./packages/database" },
  { "path": "./services/auth" },
  { "path": "./services/user" },
  { "path": "./services/gateway" }
]
```

This tells **TypeScript** about the dependency graph.

This is different from:

```text
pnpm-workspace.yaml
```

because:

|Tool|Understands|
|---|---|
|pnpm|Workspace/package boundaries|
|TypeScript|TypeScript project dependency graph|

**pnpm discovering a package does not automatically mean TypeScript understands its build dependency.**

---

# 13. Package-Level TypeScript Configuration

For a package such as:

```text
packages/common/
```

create:

```text
packages/common/tsconfig.json
```

```json
{
  "extends": "../../tsconfig.base.json",

  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo",
    "composite": true
  },

  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Why this exists

The base configuration defines **global rules**.

The package configuration defines **package-specific build boundaries**:

```text
packages/common/
│
├── src/       ← TypeScript source
│
├── dist/      ← generated output
│
└── tsconfig.json
```

---

## `rootDir`

```json
"rootDir": "src"
```

tells TypeScript:

> Treat `src/` as the source root.

---

## `outDir`

```json
"outDir": "dist"
```

tells TypeScript:

> Put generated JavaScript and declaration output into `dist/`.

---

## `tsBuildInfoFile`

```json
"tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
```

stores TypeScript's incremental/project-reference build metadata.

This works with:

```bash
tsc -b
```

so TypeScript can avoid rebuilding projects unnecessarily.

---

## `composite`

```json
"composite": true
```

is required for a project to participate properly in TypeScript Project References.

For example:

```json
{
  "references": [
    {
      "path": "../../packages/common"
    }
  ]
}
```

requires the referenced project to be configured as a composite project.

---

# 14. The Resulting Architecture

After this foundation, the important relationship is:

```text
                         Root package.json
                               │
                               │
                      pnpm-workspace.yaml
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
             packages/*                 services/*
                 │                           │
        ┌────────┼────────┐          ┌───────┼───────┐
        ↓        ↓        ↓          ↓       ↓       ↓
      logger   config    types      auth    user   gateway
        │        │        │
        └────────┴────────┘
                 │
                 ↓
         tsconfig.base.json
                 │
        ┌────────┴────────┐
        ↓                 ↓
 package tsconfig    service tsconfig
        │                 │
        └────────┬────────┘
                 ↓
       TypeScript Project References
```

The key architectural separation is:

> **pnpm answers "what packages exist?" while TypeScript Project References answer "how do these TypeScript projects depend on each other?"**

This foundation is what allows the later `packages/` and `services/` layers to remain independently buildable without duplicating compiler configuration.