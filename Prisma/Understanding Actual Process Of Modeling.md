#### Step 1 — Gather Business Requirements
```
Build a developer social platform.

Users should be able to:
- Register
- Login
- Update profile
- Create posts
- Comment
- Like posts
- Follow other users
```
#### Step 2 — Identify Entities
- `Register ---> Entity? ---> User`
- `Create Post ---> Entity? ---> Post`
- `Comment ----> Entity? ----> Comment`
- `Like ---> Like`
- `Follow User ---> Follow`

Finally we get following entities from requirements :
```
User , Post , Comment , Like , Follow
```

#### Step 3 — Choose One Entity 
- Always model one entity at a time.
- Choose `User` first for modeling

#### Step 4 — Attribute Discovery
`id` , `firstName` , `lastName` , `fullName` , `username` , `email` , `password` , `bio` , `avatar` , `coverPhoto` , `website` , `location` , `phone` , `isVerified` , `isActive`, `createdAt` ,  `updatedAt`

#### Step 5 — Remove Bad Attribute
`id` ---> Yes
`firstName` , `lastName` ----> should be combine as `name`
`fullName` ----> No (duplicate)
`password` ----> No (we always store `passwordHash`)
`avater` ----> No (we never store images instead `avaterUrl`)

Final Attributes :
```
User
id
name
username
email
passwordHash
bio
avatarUrl
createdAt
updatedAt
```

#### Step 6 — Categories Fields
```
- IDENTITY
id

 - PROFILE
name
username
bio
avatarUrl

 - AUTHENTICATION
email
passwordHash

 - AUDIT
createdAt
updatedAt
```

#### Step 7 — Apply Constraints
```
- IDENTITY
id = PRIMARY KEY (@id)

 - PROFILE
name
username = UNIQUE (@unique)
bio = NULLABLE (String?)
avatarUrl = NULLABLE (String?)

 - AUTHENTICATION
email = UNIQUE (@unique)
passwordHash

 - AUDIT
createdAt = DEFAULT NOW() (@default(now()))
updatedAt = prisma handle it (@updatedAt)
```

#### Step 9 — Think About  Relations
- Can one user create many posts? ---> Yes
	`USER ----> MANY POSTS[]`
- Can one user write many comments? ---> Yes
	`USER ----> MANY COMMENTS[]`
- Can one user like many posts? ---> Yes
	`USER ----> MANY LIKES[]`
- Can one user follow many users? ---> Yes
	`USER ----> MANY FOLLOWS[]`

#### Step 10 — Finally Write Prisma
```
model User {
  id           Int      @id @default(autoincrement())

  name         String   @db.VarChar(100)

  username     String   @unique @db.VarChar(30)

  email        String   @unique @db.VarChar(255)

  passwordHash String   @db.VarChar(255)

  bio          String?  @db.Text

  avatarUrl    String?  @db.Text

  createdAt    DateTime @default(now())

  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

Next : [[MODEL]]