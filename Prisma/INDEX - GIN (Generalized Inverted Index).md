Suppose we have users.
```
User
--------------------
Anoop
Rahul
John
```
Now suppose every user has multiple skills.
```json
{
    "skills": [
        "Node.js",
        "Docker",
        "Prisma"
    ]
}
```

**Question :** Find every user that knows Docker.

**Without GIN :** Iterate every user and for each user we need to explicitly check the json. This is very slow.
```
User 1 -> Read JSON -> Contains Docker? ->  **Yes** ---> User 2 ...... 
```

***NOTE :***  B-Tree works with . `One value -----> One Position` 
```
Email
↓
anoop@gmail.com
``` 

But for JSON , It sees Entire JSON Document.

#### How GIN solve this ?
Imagine :
```json
{
    "skills": [
        "Node",
        "Docker",
        "Prisma"
    ]
}
```
GIN creates something conceptually like 
`Node --> User 1`
`Docker --->  User 1 , User 3 , User 7`
`Prisma --> User 1 , User 9`

- NOTICE - The index is inverted. (No JSON scanning.)
```
User                                                     Skills
↓                                                           ↓
Skills                                                    Users  
```

#### Prisma Example
Suppose : users

| id  | preferences                   |     |
| --- | ----------------------------- | --- |
| 1   | {"theme":"dark","lang":"en"}  |     |
| 2   | {"theme":"light","lang":"hi"} |     |
| 3   | {"theme":"dark","lang":"fr"}  |     |
Find all Dark themed users
```sql
SELECT *
FROM users
WHERE preferences @> '{"theme":"dark"}';
```
```json
// with GIN 
model User {
  id          Int  @id
  preferences Json

  @@index([preferences], type: Gin)
}
```
```sql
-- Generated SQL
CREATE INDEX
ON users
USING GIN(preferences);
```
```
theme=dark ---> User 1 , 3

```

## Arrays
GIN is also excellent for arrays.
```sql
-- Query
WHERE skills @> ARRAY['Docker']
```
```json
model User {
  id Int @id

  skills String[]

  @@index([skills], type: Gin)
}
```

## Full Text Search
Suppose blogs.
```
Post - "Prisma is an ORM"

Post - "Docker Tutorial"

Post - "Node.js Guide"
```
User Search Docker .
```sql
-- Query
WHERE skills @> ARRAY['Docker']
```
```json
model User {
  id Int @id

  skills String[]

  @@index([skills], type: Gin)
}
```
```
Docker ---< Post 5, 2
```

Search engines work similarly.

**When Should You Use GIN?**
Good candidates:
- JSONB columns
- Arrays
- Tags
- User preferences
- Metadata
- Full-text search

-Don't use GIN for simple scalar fields.
- email
- username
- price
- createdAt
- id
- age

Next : [[VIEW]]