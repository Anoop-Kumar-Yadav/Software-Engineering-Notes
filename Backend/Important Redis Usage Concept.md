# 1. Cooldown

## What?

A cooldown prevents the **same action** from being performed again for a fixed period.

Think of it as:

> "You just did this. Wait before doing it again."

The Redis value itself is usually unimportant. The **existence of the key** is what matters.

---

## Flow

```text
POST /auth/resend-verification
        │
        ▼
Build Redis Key
auth:verify-email:cooldown:anoop@example.com
        │
        ▼
Does Key Exist?
        │
   ┌────┴────┐
   │         │
 Yes         No
   │         │
429       Send Email
   │         │
   │         ▼
   │     SET key "1"
   │     TTL = 60s
   │
Return Error
```

---

## Redis

```text
auth:verify-email:cooldown:anoop@example.com

Value: 1

TTL: 60
```

After 60 seconds

```text
Key Deleted Automatically
```

---

## Uses

- Email verification
    
- Password reset email
    
- OTP resend
    
- SMS resend
    

---

# 2. Rate Limiting

## What?

Rate limiting counts **how many requests** happen during a time window.

Question:

> "How many times has this user/IP performed this action?"

Unlike cooldown, we care about the count.

---

## Flow

```text
POST /login
      │
      ▼
Redis

auth:login:attempts:192.168.1.10

      │
      ▼
INCR

      │
      ▼
Current Count

      │
 ┌────┴────┐
 │         │
<=5        >5
 │         │
Allow     Reject
```

---

## Redis

Initially

```text
Key doesn't exist
```

First request

```text
INCR

↓

1

TTL = 60
```

Second

```text
2
```

Third

```text
3
```

...

Sixth

```text
6

↓

429
```

---

## Uses

- Login attempts
    
- Public APIs
    
- Registration
    
- Search endpoints
    

---

# 3. Throttling

## What?

Throttle means **slow the user down**, but don't necessarily block them permanently.

Think

> "You're requesting too fast."

Unlike cooldown, delay changes dynamically.

---

## Flow

```text
Request

↓

Fast?

↓

Yes

↓

Increase Wait Time

↓

1 sec

↓

2 sec

↓

5 sec

↓

10 sec
```

---

## Example

```text
OTP

↓

1st request

↓

Immediate

↓

2nd request

↓

30 sec

↓

3rd request

↓

60 sec

↓

4th request

↓

120 sec
```

Notice

Cooldown stays fixed.

Throttle increases.

---

# 4. Quota

## What?

Quota limits the **total usage** over a longer period.

Question

> "How much has this user consumed?"

---

## Flow

```text
User

↓

Calls API

↓

Redis

↓

Monthly Count

↓

1000?

↓

Reject
```

---

## Redis

```text
api:quota:user123

↓

864

↓

865

↓

866
```

Eventually

```text
1001

↓

Quota Exceeded
```

---

## Uses

- SaaS plans
    
- AI tokens
    
- Storage
    
- API credits
    

---

# 5. Lockout

## What?

Lock the user after repeated failures.

Question

> "Should this account be temporarily blocked?"

---

## Flow

```text
Login

↓

Wrong Password

↓

Redis Counter

↓

5 Failures?

↓

Yes

↓

Create Lock

↓

auth:lock:userId

↓

TTL = 15 minutes
```

---

Next login

```text
Check Lock

↓

Exists?

↓

Reject Immediately
```

---

## Redis

Counter

```text
auth:login:failures:user123

5
```

Lock

```text
auth:lock:user123

TTL

900 sec
```

---

# 6. Blacklist

Used mostly with JWT logout.

Question

> "Has this token been revoked?"

---

## Flow

```text
Logout

↓

Store JWT ID

↓

Redis

↓

TTL = Token Expiry
```

Every request

```text
JWT

↓

Extract jti

↓

Redis

↓

Exists?

↓

Reject
```

---

# 7. Session Cache

Instead of hitting MongoDB every request.

---

## Flow

```text
Request

↓

Redis

↓

Session Exists?

↓

Yes

↓

Return Session

↓

No

↓

MongoDB

↓

Store In Redis

↓

Return
```

---

# 8. OTP Storage

Redis stores temporary OTPs.

---

## Flow

```text
Generate OTP

↓

482913

↓

Redis

↓

TTL = 5 min
```

Verification

```text
User

↓

482913

↓

Compare

↓

Delete OTP
```

---

# Authentication System

A real authentication system combines all of these.

```text
                    Authentication

                       Register
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
 Registration Rate Limit          Verification Cooldown

                       Login
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Rate Limit      Failed Counter      Lockout

                  Forgot Password
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      Reset Cooldown              Reset Token

                     Authenticated APIs
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Session Cache     JWT Blacklist     Quota
```

---

# Summary

|Pattern|Redis Stores|Decision Based On|Example|
|---|---|---|---|
|Cooldown|Key existence|"Has this action happened recently?"|Resend verification email|
|Rate Limiting|Counter + TTL|"How many requests in this window?"|Login attempts per minute|
|Throttling|Counter/metadata + delay|"Should I slow this client?"|Increasing OTP resend delay|
|Quota|Long-lived counter|"Has the usage limit been reached?"|10,000 API calls/month|
|Lockout|Failure counter + lock key|"Should this account be blocked?"|Lock after 5 failed logins|
|Blacklist|Revoked token IDs|"Is this token still valid?"|JWT logout|
|Session Cache|Session data|"Can I avoid a DB lookup?"|Cached user session|
|OTP Storage|OTP value + TTL|"Does this OTP match and is it still valid?"|SMS/email verification|

As we continue building the authentication system, we'll implement each of these patterns in a real feature rather than as isolated Redis examples. That way you'll see not only the Redis commands, but also the business problem each pattern is solving.