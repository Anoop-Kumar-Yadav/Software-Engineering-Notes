# Route Conflicts and Resolution Order

This topic answers an important question:

> **What happens when multiple NestJS routes can match the same incoming request?**

The issue is mainly about **route registration order**.

---

## 1. The Basic Problem

Consider:

```typescript
@Controller('users')
export class UsersController {
  @Get(':id')
  findOne() {
    return 'user by id';
  }

  @Get('me')
  findMe() {
    return 'current user';
  }
}
```

At first glance, you might expect:

```text
GET /users/me
        ↓
findMe()
```

But with the default **Express adapter**, Nest registers routes in declaration order:

```text
1. /users/:id
2. /users/me
```

Now request:

```text
GET /users/me
```

The first route is:

```text
/users/:id
```

`me` can be used as the value of `:id`:

```text
:id = "me"
```

Therefore, Express matches:

```text
/users/:id
```

before it ever reaches:

```text
/users/me
```

So:

```text
GET /users/me
        ↓
/users/:id
        ↓
findOne()
```

`findMe()` is never reached.

---

# 2. Why Is This Called "Shadowing"?

The more general route:

```text
/users/:id
```

**shadows** the more specific route:

```text
/users/me
```

because `:id` is capable of matching `"me"`.

Think of the matching sets:

```text
/users/:id
    ↓
/users/123
/users/456
/users/me
/users/abc
...
```

while:

```text
/users/me
    ↓
/users/me
```

The first route includes the second route's request.

So:

```text
/users/:id
      └────────────── can also match /users/me
```

This is a **route shadow conflict**.

---

# 3. Declaration Order Matters

With the default Express behavior:

```typescript
@Get(':id')
findOne() {}

@Get('me')
findMe() {}
```

means:

```text
First registered
      ↓
/users/:id
      ↓
/users/me
```

But if you reverse them:

```typescript
@Get('me')
findMe() {}

@Get(':id')
findOne() {}
```

then:

```text
GET /users/me
      ↓
/users/me
      ↓
findMe()
```

works correctly.

### General rule

Put **specific/static routes before parameterized routes**:

```typescript
@Get('me')
@Get('profile')
@Get(':id')
```

rather than:

```typescript
@Get(':id')
@Get('me')
@Get('profile')
```

---

# 4. Why Pipes Cannot Solve This

This is a very important point.

Suppose you have:

```typescript
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number,
) {
  return `User ${id}`;
}

@Get('me')
findMe() {
  return 'Current user';
}
```

You might think:

> "`me` isn't a number, so `ParseIntPipe` will reject it and Nest will then try `/users/me`."

**No.**

Routing happens **before pipes**.

The actual sequence is approximately:

```text
HTTP Request
     ↓
Route Matching
     ↓
Select Controller Handler
     ↓
Pipes
     ↓
Controller Method
```

For:

```text
GET /users/me
```

the router first decides:

```text
/users/:id
```

matches.

Only then does Nest execute:

```text
ParseIntPipe
```

So the pipe cannot make Nest go back and search for another route.

### Key principle

> **Pipes transform/validate arguments after a route has already been selected. They are not part of route matching.**

---

# 5. Duplicate vs Shadow Conflict

NestJS v12 distinguishes two types of route conflicts.

## Duplicate

Two routes are effectively identical.

For example:

```text
GET /users/:id
GET /users/:id
```

Same:

- HTTP method
    
- path
    
- host
    
- version
    

This is a **duplicate**.

---

## Shadow

Two different route patterns can match the same request.

For example:

```text
GET /users/me
GET /users/:id
```

These aren't identical routes.

But:

```text
/users/:id
```

can match:

```text
/users/me
```

Therefore:

```text
shadow conflict
```

### Difference

|Conflict|Meaning|
|---|---|
|`duplicate`|Same route definition|
|`shadow`|Different routes can match the same request|

---

# 6. `routeConflictPolicy`

NestJS v12 provides:

```typescript
routeConflictPolicy
```

to detect these conflicts during application startup.

Example:

```typescript
const app = await NestFactory.create(AppModule, {
  routeConflictPolicy: {
    duplicate: 'error',
    shadow: 'warn',
  },
});
```

There are three severity levels:

```text
'off'
'warn'
'error'
```

So:

```typescript
{
  duplicate: 'error',
  shadow: 'warn',
}
```

means:

```text
Duplicate conflict
      ↓
Application treats it as an error

Shadow conflict
      ↓
Application reports a warning
```

---

# 7. What Does `error` Do?

Suppose you have multiple conflicts:

```text
Conflict 1 → shadow
Conflict 2 → duplicate
Conflict 3 → shadow
```

and configure:

```typescript
routeConflictPolicy: {
  duplicate: 'error',
  shadow: 'error',
}
```

Nest aggregates the offending route pairs and throws a:

```text
RouteConflictException
```

during:

```typescript
app.listen()
```

The benefit is that you can see **all detected conflicts together**, rather than fixing one conflict, restarting, discovering another, and repeating the process.

---

# 8. `routeResolutionStrategy`

`routeConflictPolicy` **detects** conflicts.

`routeResolutionStrategy` changes **how routes are ordered for matching**.

There are two strategies:

```text
declaration
specificity
```

### Default: `declaration`

```typescript
routeResolutionStrategy: 'declaration'
```

Routes are matched according to their declaration/registration order.

This preserves the previous behavior.

---

# 9. Specificity Strategy

You can instead configure:

```typescript
const app = await NestFactory.create(AppModule, {
  routeResolutionStrategy: 'specificity',
});
```

Now Nest orders routes according to their specificity.

The basic ranking is:

```text
Literal
   ↓
Parametric
   ↓
Wildcard
```

For example:

```text
/users/me
/users/:id
/users/*
```

The router considers:

```text
/users/me
      ↑
   most specific

/users/:id
      ↑
   less specific

/users/*
      ↑
   least specific
```

Therefore, even if you declare:

```typescript
@Get('*')
@Get(':id')
@Get('me')
```

specificity-based resolution can arrange them conceptually as:

```text
/users/me
/users/:id
/users/*
```

So:

```text
GET /users/me
```

goes to:

```text
/users/me
```

instead of being captured by:

```text
/users/:id
```

---

# 10. Conflict Detection vs Resolution

These two options solve **different problems**.

### `routeConflictPolicy`

Asks:

> **"Should Nest tell me that conflicting routes exist?"**

```typescript
routeConflictPolicy: {
  duplicate: 'error',
  shadow: 'warn',
}
```

### `routeResolutionStrategy`

Asks:

> **"How should Nest order routes when resolving a request?"**

```typescript
routeResolutionStrategy: 'specificity'
```

Therefore:

```text
routeConflictPolicy
       ↓
Detection / diagnostics

routeResolutionStrategy
       ↓
Route matching order
```

They can be used independently or together.

---

# 11. Express vs Fastify

This distinction is important.

### Express

Express's routing behavior is **order-sensitive**.

So:

```text
@Get(':id')
@Get('me')
```

can cause:

```text
/users/me
      ↓
/users/:id
```

depending on registration order.

Therefore, these Nest options are particularly relevant.

---

### Fastify

Fastify uses its `find-my-way` router, which already performs specificity-based route matching.

Therefore:

```text
/users/me
```

is already preferred over:

```text
/users/:id
```

when both can match.

Consequently:

```text
routeResolutionStrategy: 'specificity'
```

has no effect on Fastify.

Likewise:

```text
shadow
```

conflict detection is a no-op on Fastify because its routing mechanism already resolves such overlaps by specificity.

However:

```text
duplicate
```

conflict detection is still honored.

---

# 12. The Complete Mental Model

For **Express + default declaration strategy**:

```text
                    HTTP Request
                         │
                         ▼
                 Route Registration
                    /users/:id
                    /users/me
                         │
                         ▼
                Check in registered order
                         │
                         ▼
                  /users/:id matches
                         │
                         ▼
                  Handler selected
                         │
                         ▼
                      Pipes
                         │
                         ▼
                  Controller method
```

With **specificity strategy**:

```text
                    HTTP Request
                         │
                         ▼
                Routes ranked by
                   specificity
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        /users/me              /users/:id
        literal                parameter
             │
             ▼
       More specific
             │
             ▼
        Handler selected
```

---

## The Core Concept

There are **three things to remember**:

1. **Declaration order** can determine which route wins on Express.
    
2. **A parameter route can shadow a static route** because `:id` can match values such as `"me"`.
    
3. **Pipes cannot affect route selection** because route matching happens before pipes execute.
    

NestJS v12 gives you two controls:

```text
routeConflictPolicy
        ↓
Detect duplicate/shadow conflicts

routeResolutionStrategy
        ↓
Control whether matching follows
declaration order or specificity
```

And the safest conventional route ordering remains:

```typescript
@Get('me')
@Get('profile')
@Get(':id')
@Get('*')
```

**specific → parameterized → wildcard**.