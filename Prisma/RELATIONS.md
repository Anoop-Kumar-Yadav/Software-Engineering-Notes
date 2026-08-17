- relation  =  connection between two models in the Prisma schema
- Example -
```json
model User {
  id    Int    @id @default(autoincrement())
  
  posts Post[]
}

// ---------------------------------------------------------
model Post {
  id       Int  @id @default(autoincrement())
  
  author   User @relation(fields: [authorId], references: [id])
  
  authorId Int  // Foreign key connecting Post to User
  title    String
}
```

- **Relation fields** (`author` and `posts`): Define connections at Prisma ORM level, do not exist in the database
- **Relation scalar field** (`authorId`): The foreign key that exists in the database

## Relations in a Database
#### Relational Database
In SQL, use a _foreign key_ to create a relation between two tables:

```author     User        @relation(fields: [authorId], references: [id]) ```
- A foreign key column (`authorId`) in `Post` references the primary key (`id`) in `User`

#### Relations in Prisma Client

1. Create Record with nested relations
```ts
const userAndPosts = await prisma.user.create({
  data: {
    posts: {
      create: [
	      { title: "Prisma Day 2020" }, 
	      { title: "How to write a Prisma schema" }
      ],
    },
  },
});
```
2. Retrieve Record with related data
```ts
const getAuthor = await prisma.user.findUnique({
  where: { id: "20" },
  include: { posts: true },
});
```
3. Connect Existing records
```ts
await prisma.user.update({
  where: { id: 20 },
  data: {
    posts: { connect: { id: 4 } },
  },
});
```
## Types of Relations
- **One-to-one** (1-1)
- **One-to-many** (1-n)
- **Many-to-many** (m-n)
```json
model User {
  id      Int      @id @default(autoincrement())
  
  posts   Post[]   // User --> Post[] (1 - n) 
  
  profile Profile?
}

//-----------------------------------------------------------------------------
model Profile {
  id     Int  @id @default(autoincrement())
  
  user   User @relation(fields: [userId], references: [id]) // Profile --> User (1 - 1)
  
  userId Int  @unique // relation scalar field (used in the `@relation` attribute above)
}

//-----------------------------------------------------------------------------
model Post {
  id         Int        @id @default(autoincrement())
  
  author     User       @relation(fields: [authorId], references: [id]) // Post --> User (1 - 1)
  
  authorId   Int // relation scalar field  (used in the `@relation` attribute above)
  categories Category[]    // Post --> Category[] (1 - n) 
}

//-----------------------------------------------------------------------------
model Category {
  id    Int    @id @default(autoincrement())
  posts Post[]   // Category --> Post[] (1 - n) 
}
```
![[Pasted image 20260711105749.png]]
The many-to-many relationship became two one-to-many relationships.

**Prisma Gives You Two Choices :**
The difference is **who manages the junction table**.
```
Many-to-Many
│
├── Implicit
└── Explicit
```
1. **Implicit Many-to-Many** : Prisma manages the junction table .
```json
model User {
  id    Int    @id @default(autoincrement())
  name  String

  likedPosts Post[]
}

model Post {
  id    Int    @id @default(autoincrement())
  title String

  likedBy User[]
}
```
There is **no Like model**. Yet PostgreSQL still creates a relation table automatically.
```
users
posts
_usersToPosts
```
**Querying** :
```ts
await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    likedPosts: true
  }
});
```
```json
// Response
{
  "id": 1,
  "likedPosts": [
    {
      "id": 1,
      "title": "Prisma"
    },
    {
      "id": 2,
      "title": "Docker"
    }
  ]
}
```
**Nested Write : 
```ts
await prisma.user.update({
  where: {
    id: 1
  },
  data: {
    likedPosts: {
      connect: {
        id: 2
      }
    }
  }
});
```

2. **Explicit Many-to-Many :** 
Suppose we a;so need to store data about likes -
```
when?
Reaction Type?
Device?
IP Address?
```
	- Can implicit relation store these?  -------> No (The hidden table only stores foreign keys)
	- we create the relation table ourselves.
```json
model User {
  id    Int    @id @default(autoincrement())
  name  String

  likes Like[]
}

model Post {
  id    Int    @id @default(autoincrement())
  title String

  likes Like[]
}

model Like {
  userId    Int
  postId    Int
  
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  post Post @relation(fields: [postId], references: [id])

  @@id([userId, postId])
}
```
![[Screenshot from 2026-07-11 11-16-12.png]]
**Querying**
```ts
await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    likes: {
      include: {
        post: true
      }
    }
  }
});
```

## Relational Fields
Fields whose type is another model (not a scalar type).
- Every relation needs exactly two relation fields, one on each model.
```json
model User {
  id    Int    @id @default(autoincrement())
  posts Post[] // relation field
}

model Post {
  id       Int    @id @default(autoincrement())
  
  author   User   @relation(fields: [authorId], references: [id]) // annotated relation field
  authorId Int    // relation scalar field (foreign key)
}
```
#### Annotated relation fields
annotated with `@relation` attribute represent the side that stores the foreign key:
```json
author     User    @relation(fields: [authorId], references: [id])
authorId   Int     // relation scalar field
```

## Disambiguating Relation
```json
model User {
  id Int @id @default(autoincrement())

  posts Post[]
  post  Post?
}

model Post {
  id Int @id @default(autoincrement())

  authorId Int
  author User @relation(fields: [authorId], references: [id])

  pinnedById Int?
  pinnedBy User? @relation(fields: [pinnedById], references: [id])
}
```
```
User
 │
 ├────────writes────────► Post
 │
 └────────pins──────────► Post
```
- There are now **two different relationships** between the same two models.
- Prisma doesn't know - Which one belongs to posts
- This is called an **ambiguous relation**.

**Solution** — Give Every Relation a **Name**
```json
model User {
  id Int @id @default(autoincrement())

  // Posts written by this user
  writtenPosts Post[] @relation("WrittenPosts")

  // The single post pinned by this user
  pinnedPost Post? @relation("PinnedPost")
}
```

```json
model Post {
  id Int @id @default(autoincrement())

  title String

  // Author Relation
  authorId Int author User @relation("WrittenPosts",
    fields: [authorId],
    references: [id]
  )

  // Pinned Relation
  pinnedById Int? @unique
  pinnedBy User? @relation("PinnedPost",
    fields: [pinnedById],
    references: [id]
  )
}
```
The `name` must be the same on both sides of the relation.

Next : [[ONE-TO-ONE RELATION]]