Instead of only roles, FGAC evaluates four categories.
```
        Authorization Decision
                 │
 ┌───────────────┼───────┐───────────┐
 │               │       │           │
 ▼               ▼       ▼           ▼
User         Resource    Action    Context
```

## Example  HR System

Requirement:

```
Managers can approve leave.
```

RBAC:

```
Manager

↓

Approve
```

FGAC:  Business logic performs

```
Manager

AND

Employee belongs to manager

AND

Leave not already approved

AND

Duration < 30 days
```

## Common Approaches to FGAC
1. Resource Ownership
```ts
return post.authorId === user.id;
```
2. Attribute-Based Access Control (ABAC)
```ts
return (
    user.department === document.department &&
    user.clearance >= document.clearance
);
```
3. Policy-Based Access Control (PBAC)
```ts
ALLOW IF

role == Manager

AND

department == resource.department

AND

resource.status == Pending
```