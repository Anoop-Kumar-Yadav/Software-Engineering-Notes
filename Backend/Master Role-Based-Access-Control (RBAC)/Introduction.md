![[Pasted image 20260714123658.png]]
## Authentication vs Authorization

|                     Authentication                      |                                 Authorization                                 |
| :-----------------------------------------------------: | :---------------------------------------------------------------------------: |
|      <span style="color:blue">Who are you?</span>       |         <span style="color:green">What are you allowed to do?</span>          |
|    <span style="color:blue">Verifies identity</span>    |             <span style="color:green">Verifies permissions</span>             |
|      <span style="color:blue">Happens first</span>      |         <span style="color:green">Happens after authentication</span>         |
| <span style="color:blue"> * Produces an identity</span> | <span style="color:green">*Uses that identity to make access decisions</span> |
|          <span style="color:blue">Login</span>          |                <span style="color:green">Access control</span>                |

![[Pasted image 20260714122542.png]]

## Authentication = Platform Level
Authentication is the process of proving your identity. It leads to creates an identity on successfull authentication.
```json
// Example - Identity
{
  id: "user_123",
  email: "anoop@example.com",
  role: "admin"
}
```

![[Pasted image 20260714123202.png|204]] ![[Pasted image 20260714123815.png|483]]
## Authorization 
#### = Kya aapke pas authority hai kisi action ko perform krne ki 
Authorization decides whether an authenticated identity has permission to perform a specific action on a specific resource.
![[Pasted image 20260714124900.png|472]]
# Where They Live in Backend Architecture
![[Pasted image 20260714125846.png]]
