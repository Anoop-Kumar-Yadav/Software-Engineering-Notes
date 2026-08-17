One record can be related to **zero** or **many** records, but each child record belongs to **only one** parent.
```
User 1  ─────────────►  Many Posts

1                     N
```
```json
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  
  authorId Int
  author   User @relation(fields: [authorId], references: [id])
}
```
- A user can have zero or more posts
- A post must always have an author
- Why There Is No `@unique` - because a same user can have multiple post .
#### Prisma Query
Create User :
```ts
await prisma.user.create({
  data: {
    name: "Anoop"
  }
})
```
Create Post :
```ts
await prisma.post.create({
  data: {
    title: "Learning Prisma",

    author: {
      connect: {
        id: 1
      }
    }
  }
})
```
Fetch User with Posts
```ts
await prisma.user.findUnique({
  where: {
    id: 1
  },
  include: {
    posts: true
  }
})
```
Result
```json
{
  "id": 1,
  "name": "Anoop",
  "posts": [
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

Next : [[MANY-TO-MANY RELATIONS]]