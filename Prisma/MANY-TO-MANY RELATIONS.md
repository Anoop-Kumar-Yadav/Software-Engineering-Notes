One record can be related to many records on the other side, and vice versa.
```
Users  ◄──────────────►  Categories

N                         N
```

**For Relational Databases** : Use Implicit m-n unless you need to store additional metadata.
```
Post
  │
  │ 1
  ▼
CategoriesOnPosts
  ▲
  │ 1
  │
Category
```
Many-to-Many is actually implemented as **two One-to-Many relationships**.

#### Prisma Supports Two Approaches
```
Many-to-Many
│
├── Explicit
└── Implicit
```
The difference is **who manages the junction table**.
1. **Explicit Many-to-Many** - You create the junction table yourself.
```json
model Post {
  id         Int                 @id @default(autoincrement())
  title      String

  categories CategoriesOnPosts[]
}

model Category {
  id    Int                 @id @default(autoincrement())
  name  String

  posts CategoriesOnPosts[]
}

model CategoriesOnPosts {
  postId     Int
  categoryId Int

  assignedAt DateTime @default(now())
  assignedBy String

  post Post @relation(
    fields: [postId],
    references: [id]
  )

  category Category @relation(
    fields: [categoryId],
    references: [id]
  )

  @@id([postId, categoryId])
}
```

**Querying explicit many-to-many**
```ts
// Create post with new category
const post = await prisma.post.create({
  data: {
    title: "How to be Bob",
    categories: {
      create: [
        {
          assignedBy: "Bob",
          category: { create: { name: "New category" } },
        },
      ],
    },
  },
});

// Connect to existing categories
await prisma.post.create({
  data: {
    title: "My Post",
    categories: {
      create: [
        { assignedBy: "Bob", category: { connect: { id: 9 } } },
        { assignedBy: "Bob", category: { connect: { id: 22 } } },
      ],
    },
  },
});

// Query posts by category
const posts = await prisma.post.findMany({
  where: { categories: { some: { category: { name: "New Category" } } } },
});
```

1. **Implicit many-to-many relations** - Prisma manages the relation table automatically.
```json
model Post {
  id         Int        @id @default(autoincrement())
  title      String
  categories Category[]
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}
```

**Querying implicit many-to-many**
```ts
// Create post with categories
const post = await prisma.post.create({
  data: {
    title: "How to become a butterfly",
    categories: {
      create: [{ name: "Magic" }, { name: "Butterflies" }],
    },
  },
});

// Get posts with categories
const posts = await prisma.post.findMany({
  include: { categories: true },
});
```

## Rules for Implicit Many-to-Many

**-Rule 1** : Each model must have single primary key. `@id `
```json
@@id([id1,id2]) // Not Allowed
```

```json
id Int @id // Allowed
```

**-Rule 2** : Cannot use following attributes, Prisma manages them.
```
fields
references
onDelete
onUpdate
```


**-Rule 3** : Relation field only, No foreign keys.
```
categories Category[]

posts Post[]
```

## Relation table conventions
For `prisma db pull` to recognize implicit m-n tables:
- Table name: `_CategoryToPost` (underscore + model names alphabetically + `To`) - because **Category** comes before **Post** alphabetically.
- Columns: `A` (FK to first model alphabetically) and `B` (FK to second)
- Unique index on both columns, non-unique index on `B`

#### **Customize Table Name**
```json
model Post {
  categories Category[] @relation("PostCategories")
}

model Category {
  posts Post[] @relation("PostCategories")
}
```

Next : [[SELF-RELATIONS]]