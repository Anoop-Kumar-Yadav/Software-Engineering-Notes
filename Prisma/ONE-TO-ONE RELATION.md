One record can be related to **at most one** record on the other side.
```
User  <──────────────>  Profile

1                         1
```
A relational database **does not have a special One-to-One relationship type**.
- It is implemented using:
	- Foreign Key (`FOREIGN KEY`)
	- Unique Constraint (`UNIQUE`)
	-Without `UNIQUE`, it automatically becomes **One-to-Many**.
```JSON
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int @id @default(autoincrement())
  bio    String?

  userId Int @unique
  user   User @relation(
    fields: [userId],
    references: [id]
  )
}
```
```sql
-- SQL generated
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,

    bio TEXT,

    userId INTEGER NOT NULL UNIQUE,

    FOREIGN KEY(userId)
        REFERENCES users(id)
);
```

**NOTE** : You don't have to reference the primary key, Suppose `email`
The referenced field **must be unique** (`@id` or `@unique`).
```json
model User {
    id Int @id @default(autoincrement())

    email String @unique

    profile Profile?
}
```
```json
model Profile {

    id Int @id @default(autoincrement())

    userEmail String @unique
    user User @relation(
        fields: [userEmail],
        references: [email]
    )
}
```

#### Composite Key Example
```json
model User {

    firstName String

    lastName String

    @@id([firstName, lastName]) // Primary key
}
```

```json
model Profile {

    id Int @id @default(autoincrement())

    userFirstName String

    userLastName String

    user User @relation(fields: [userFirstName,userLastName],references: [
            firstName,lastName])

    @@unique([userFirstName,userLastName])
}
```

#### Optional vs Required Relation
```json
// Optional
model User {

    id Int @id @default(autoincrement())

    profile Profile?
}
```

```json
// Required
model User {

    id Int @id @default(autoincrement())

    profile Profile
}
```

**NOTE :** In 1-1 relations, you can choose which side holds the `@relation` attribute and foreign key. Both approaches are valid.
- General rule - The entity that **depends on the other** usually stores the foreign key.
## Prisma Query
Create User
```TS
await prisma.user.create({
    data:{
        name:"Anoop"
    }
})
```
Create Profile
```TS
await prisma.profile.create({
    data:{
        bio:"Backend Developer",
        user:{
            connect:{
                id:1
            }
        }
    }
})
```

Next : [[ONE-TO-MANY RELATIONS]]]