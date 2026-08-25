For your situation (single dev/small team, early-stage, real intent to split later), the **modular monolith with strict folder-boundary discipline** — what we've been building — is still the right default. But there are a few stronger and weaker variants worth knowing, since "modular monolith" itself has a spectrum.

## Recommendation: Modular Monolith + npm/pnpm Workspaces

The one upgrade worth making to what we have: turn each `services/*` folder into an actual **workspace package**, not just a folder convention.

```
url-shortener/
  packages/
    link/           # its own package.json
    redirect/
    analytics/
    auth/
    shared/
  package.json      # workspace root
  pnpm-workspace.yaml
```

**Why this is strictly better than folder-only separation:** right now, nothing _technically_ stops `analytics` from importing `link/services/whatever.js` directly — you're relying on discipline. With workspaces, each package only sees what it explicitly declares as a dependency (`"@app/shared": "workspace:*"`), so an accidental cross-import is a build error, not a code-review catch. When you extract `redirect` later, it's already got its own `package.json`, its own dependency list, its own `Dockerfile` context — you're not even copying, you're just deploying a folder that was already independent.

Tools: **pnpm workspaces** (lightest) or **Turborepo/Nx** (add build caching, task orchestration, dependency-graph visualization — worth it once you have 4+ packages).

## Other Strategies, Compared

|Strategy|Structure principle|Best when|Cost|
|---|---|---|---|
|**Modular monolith (folders only)** — what we built|Feature-based folders, discipline-enforced boundaries|Solo dev, fast iteration, small team|Boundary violations are only caught by code review, not tooling|
|**Modular monolith + workspaces**|Same, but boundaries enforced by package.json|Same as above, but you want the boundary _technically_ real|Slightly more setup (workspace config, per-package builds)|
|**Hexagonal / Ports & Adapters**|Core business logic depends only on interfaces; DB/HTTP/queue are "adapters" plugged in|You expect to swap infra (DB, message broker) independent of business logic, or want business logic unit-testable with zero mocks|More upfront abstraction (interfaces for everything) — overkill for a URL shortener's actual complexity|
|**Vertical slice architecture**|Each _endpoint_ (not each service) is fully self-contained top-to-bottom|Feature set changes fast and features rarely share logic|Some duplication across slices; less natural fit once modules genuinely share models (your `Link`/`User`/`Click` relations are pretty coupled)|
|**DDD bounded contexts**|Structure by business domain language, not technical layer; each context has its own model even if entities share a name elsewhere|Complex business domains with real domain experts, multiple teams|Heavy for a project this size — real payoff shows up at enterprise scale|
|**In-process event bus (mimics pub/sub before you have one)**|Modules communicate via `eventBus.emit('link.created', ...)`, never direct function calls|You want to prove out async decoupling logic before adding real infrastructure (Kafka/BullMQ)|Adds indirection even locally; but this is _exactly_ what made your Phase 9 analytics extraction trivial — worth doing intentionally from earlier on|

## The One Combination Actually Worth Adopting Now

**Modular monolith + workspaces + in-process event bus for cross-module writes.**

Concretely: instead of `link`'s controller directly calling something in `analytics`, it does `eventBus.emit('link.created', { linkId, ownerId })`, and `analytics` (and anything else that cares later — say, a future `billing` module counting links per plan) subscribes locally. In-process, this costs nothing — it's just an `EventEmitter`. But it means the _code shape_ of "module reacts to an event it doesn't own" is already true before you ever touch BullMQ or Kafka. When you extract `analytics`, you swap the local `eventBus.on(...)` for a queue consumer — the _calling_ side (`link`) doesn't change at all, because it was never calling `analytics` directly in the first place.

This is a stronger version of what Phase 9 already did for you with BullMQ specifically for analytics — generalizing it to _all_ cross-module communication, not just the one place you happened to need async writes, means every future extraction gets the same free ride.

Want me to restructure the current folder layout into the workspace + event-bus version concretely (actual `pnpm-workspace.yaml`, package.json per module, and the event bus wiring)?