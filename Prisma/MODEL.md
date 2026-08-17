- model  =  Represent entities of your application domain
- It maps to table (PostgreSQL) and collection (MongoDB)
- generated prisma-client depends on it 

Model maps to the underlying structures of the data source.

There are 2 ways to define models :
```
                    Prisma
                       │
        ┌──────────────┴──────────────┐
        │                             │
Schema First                    Database First
(Migration)                     (Introspection)

Business Requirement                 Database
        │                               │
        ▼                               ▼
   Design Model                  npx prisma db pull 
        │                               │
        ▼                               ▼
schema.prisma (Source of truth)     schems.prisma
        │                               |
        ▼                               ▼   
prisma migrate dev              Generated Prisma Client 
        │
        ▼
Generated SQL Migration
        │
        ▼
PostgreSQL
        │
        ▼
Generated Prisma Client
```

## Defining Model
Represent by model block {. . . .} and define by a number of fields.
```prisma
model Comment {
	// Fields
}
```

###### Mapping model names to table :
- Prisma naming convention for model = singular + PascalCase
- Database naming convention for table = plural + snake_case
```prisma
model Comment {
	// Fields
	
	@@map("comments)
}
```
- Can also  @map  column name or enum value

## Defining Fields
Fields = properties of model - which consts of :
```
Field
│
├── Name
├── Type
├── Type Modifier (Optional)
└── Attributes (Optional) - starts with @
```

Prisma has only **two categories** of field types.
```
Field Types
│
├── Scalar Types
└── Model Types
```
- **Scalar Types** - These become database columns.
```json
model Post {
	id Int @id @default(autoincrement())
}

model Comment {
	id Int @id @default(autoincrement())
	title String
	content String
}

model Tag {
	name String @id
}
```
- **Model Types** (Relation Fields) - for example, a post (`Post`) can have multiple comments (`Comment[]`)
```json
model Post {
	id Int @id @default(autoincrement())
	
	comments Comment[]
}

model Comment {
	id Int @id @default(autoincrement())
	title String
	content String
	
	postId Int
	post Post @relation(fields: [postId], references: [id])
}

model Tag {
	name String @id
}
```

#### Native types mapping
It Specific to the underlying Database types.
- Preficesd with `@db` - @db.Boolean
#### Type modifiers
- `[]` Make a field a list
- `?` Make a field optional
```json
model Post {
  id       Int       @id @default(autoincrement())
  
  title   String       // Required field
  content String?      // Optional field (nullable)
  
  comments Comment[] // A list of comments
  keywords String[]  // A scalar list
}
```

#### Unsupported types
When you introspect a relational database, unsupported data types are added as `Unsupported`.
- `location    Unsupported("POLYGON")?`
- don't appear in the generated Prisma Client API

## Defining attributes
Attributes modify the behavior of fields or model.
```json
model User {
  id        Int     @id @default(autoincrement())
  firstName String
  lastName  String
  email     String  @unique
  isAdmin   Boolean @default(false)

  @@unique([firstName, lastName])
}
```
Some attributes accept arguments - for example, `@default` accepts `true` or `false`: `isAdmin   Boolean @default(false) // short form of @default(value: false)`

#### Defining IDs in relational databases
In relational databases, an ID can be defined by a single field using the `@id` attribute, or multiple fields using the `@@id` attribute.

- Single Field IDs
```json
model User {
  id      Int      @id @default(autoincrement()) 
  email   String   @unique
  name    String?
  role    Role     @default(USER)
  posts   Post[]
  profile Profile?
}
```
- Composite IDs 
```json
model User {
  firstName String
  lastName  String
  email     String  @unique
  isAdmin   Boolean @default(false)

  @@id([firstName, lastName]) 
}
```
By default, the name of this field in Prisma Client queries will be `firstName_lastName`
- You can also provide your own name for the composite ID using the `@id` attribute's `name` field:
```json
model User {
  firstName String
  lastName  String
  email     String  @unique
  isAdmin   Boolean @default(false)

  @@id(name: "fullName", fields: [firstName, lastName]) 
}
```

#### Defining a default value
Default values can be:
- **Static values**: `5` (`Int`), `"Hello"` (`String`), `false` (`Boolean`)
- **Lists**: `[5, 6, 8]` (`Int[]`), `["Hello", "Goodbye"]` (`String[]`)
- Functions: now(), uuid(), cuid()
- JSON: Use escaped strings, e.g., `@default("{ \"hello\": \"world\" }")`
```json
model Post {
  id         Int        @id @default(autoincrement())
  createdAt  DateTime   @default(now())
  title      String
  published  Boolean    @default(false)
  data       Json       @default("{ \"hello\": \"world\" }")
}
```
#### Defining Unique Field
Unique attributes can be defined on a single field using `@unique`, or on multiple fields using `@@unique` :
```json
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique      // Single field unique
  name  String?
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  authorId Int

  @@unique([authorId, title]) // Composite unique
}
```
- You can customize the constraint name with the `name` field: `@@unique(name: "authorTitle", [authorId, title])`

#### Defining Enums
Enums are defined via the `enum` block (when supported by database) :
```json
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  role  Role    @default(USER)
}

enum Role {
  USER
  ADMIN
}
```

#### Using Functions
Prisma schema supports fucntions for default functions :
```json
model Post {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  uuid      String   @default(uuid())
}
```

## Queries In Prisma Client
#### CRUD Queries
- Every model generates CRUD queries ;

`findMany()` | `findFirst()` | `findUnique()` | `create()` | `update()` | `upsert()` | `delete()` | `createMany()` | `updateMany()` | `deleteMany()`

Access via :  `prisma.user.create({ ... })`

#### Type Definitions
Prisma Client generates TypeScript types for your models:
```ts
export type User = {
  id: number;
  email: string;
  name: string | null;
};
```

#### LIMITATIONS:
Every Prisma model must have at least one unique identifier:
- `@id` or `@@id` for primary key
- `@unique` or `@@unique` for unique constraint

Next : [[RELATIONS]]