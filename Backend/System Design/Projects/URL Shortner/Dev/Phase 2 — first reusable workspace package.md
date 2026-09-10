# Phase 2 — `@metriclink/common`

Now we start building the **first reusable workspace package** for `MetricLink.io`, our URL-shortening platform.

The purpose of `packages/common` is different from a service such as `services/url`: it contains **cross-service infrastructure and utilities** that multiple MetricLink services can safely consume. We will therefore build it independently and make it buildable before any service depends on it.

We will again proceed **one step at a time**.

---

## Step 2.1 — Create `packages/common`

### 1. What we're doing right now

We are creating the `common` workspace package and initializing its own `package.json`.

### 2. Why this has to happen at this exact point

The root workspace already knows that `packages/*` contains workspace packages. Before we can put logging, environment validation, or other shared infrastructure into `common`, `common` itself must become a real pnpm package.

This package will eventually be consumed by services such as:

```text
services/
├── gateway
├── url
├── analytics
└── auth

        ↓

packages/common
```

We are **not installing Zod or Pino yet**. First we establish the package itself; then we add each dependency when the first file requires it.

### 3. Actual command

From the **MetricLink.io repository root**:

```bash
mkdir -p packages/common
cd packages/common
pnpm init
```

Now set the package name:

```json
{
  "name": "@metriclink/common",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@11.9.0"
}
```

Then return to the repository root:

```bash
cd ../..
```

### 4. What to check

From the repository root:

```bash
pnpm list --depth 0 --filter @metriclink/common
```

The package should be recognized as:

```text
@metriclink/common
```

Also verify:

```bash
ls packages/common
```

You should see:

```text
package.json
```

**Stop here.** Confirm that pnpm recognizes `@metriclink/common`. Then we'll install **Zod**, because the first shared utility we're going to build needs it.