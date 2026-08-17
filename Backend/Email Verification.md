## High  Level FLow
```
POST /auth/register
        │
        ▼
Validate Request
        │
        ▼
Email Already Exists?
        │
        ▼
Hash Password (Argon2id)
        │
        ▼
Create User (isVerified=false)
        │
        ▼
Generate Random Token (32 bytes)
        │
        ▼
Hash Token (SHA-256)
        │
        ▼
Delete Old Verification Tokens (if any)
        │
        ▼
Store Verification Token
        │
        ▼
Set Redis Cooldown (60s)
        │
        ▼
Send Email
        │
        ▼
201 Created
```

### 1.  Registration
- Generate a secure random token - `1a84fd7becc912d....`
- Hash it.`SHA256  ---->  ae781bd91..... ` 
- Store : 
```
userId
tokenHash
expiresAt
```
- Email : `https://example.com/auth/verify-email?token=1a84fd7becc912d...`
### 2. User clicks email
- `GET /auth/verify-email?token=1a84fd7...`
- Flow :
```
Receive Token
        │
        ▼
SHA-256
        │
        ▼
Find VerificationToken
        │
        ▼
Not Found?
      │
     Yes
      │
Invalid Link

-------------------------[  If  found  ]------------------- 
Token Expired?
        │
      Yes
        │
Delete Token
        │
Expired

-------------------------[  If  Valid  ]------------------- 
Update User
↓
isVerified=true
↓
Delete VerificationToken
↓
Success
```
- NOTE : Delete token immediately.
- Verification tokens should be **single use**.
### 3.Resend Verification Email
- `POST /auth/resend-verification`
- FLOW
```
User Exists?
        │
        ▼
Already Verified?
        │
      Yes
        │
Return Success
-----------------------------
If Not verified
↓
Redis ------> Cooldown Exists? -----> Yes -------> 429
					↓
					No
					↓
		Delete Previous VerificationToken
					↓
			Generate New Token
					↓
				Store New Hash
					↓
				Set Redis Cooldown
					↓
				Send Email
```

## Complete Architecture

```
Client
    │
    ▼
POST /register
    │
    ▼
Validation
    │
    ▼
Create User
    │
    ▼
Generate Secure Token
    │
    ▼
Hash Token
    │
    ▼
Store Token Hash (MongoDB)
    │
    ▼
Redis Cooldown
    │
    ▼
SMTP
    │
    ▼
User Receives Email
    │
────────────────────────────────────
User Clicks Link
    │
    ▼
GET /verify-email
    │
    ▼
Hash Incoming Token
    │
    ▼
Find Token
    │
    ▼
Mark User Verified
    │
    ▼
Delete Token
    │
    ▼
Success
```

Model :
```
VerificationToken
-------------------------
_id
userId
secretHash
expiresAt
```
Email a link like: 
```
https://example.com/auth/verify-email?id=684f2...&token=1a84fd7...

```