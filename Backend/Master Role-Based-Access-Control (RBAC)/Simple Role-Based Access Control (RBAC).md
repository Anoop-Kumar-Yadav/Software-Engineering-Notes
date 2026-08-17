Authentication answers:

> "Who are you?"

Authorization answers:

> "Can you do this?"

RBAC answers:

> "What can someone with your role do?"

## The Core RBAC Model
RBAC is built on four entities.
![[Pasted image 20260714131035.png]]

```
User
 └── Anoop

Role
 └── Admin

Permission
 ├── users:create
 ├── users:delete
 ├── users:update
 └── posts:delete
```

- The user never directly owns permissions.
- The **role owns permissions**.
- Permission = Resource + Action
- Resource = Something being protected. (Order, Invoice, Comment ...  )

#### RBAC in a Production Architecture
```
                 HTTP Request
                      │
                      ▼
          Authentication Middleware
          Verify JWT / Session / API Key
                      │
                      ▼
              req.user = { id }
                      │
                      ▼
         Authorization Middleware
                      │
          Load Roles & Permissions
         (Redis → Database fallback)
                      │
                      ▼
      Has "users:delete" permission?
               │              │
              Yes            No
               │              │
               ▼              ▼
        Controller        403 Forbidden
               │
               ▼
      Resource Ownership Check
               │
               ▼
        Business Logic
```