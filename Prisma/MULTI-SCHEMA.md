The biggest confusion comes from the word **schema** because Prisma uses the word **schema** in two different contexts.

There are **three** different things called **"schema"** :

| Term            | Meaning                            |
| --------------- | ---------------------------------- |
| schema.prisma   | Prisma configuration file          |
| Database Schema | PostgreSQL namespace (like folder) |
| Table Schema    | Structure of the table             |
Here we are focusing on ***Database Schema***

PostgreSQL allow you to organize database tables into named groups called **schemas** . 

( i.e to avoid name collisions or to have clearer domain separation ) and let you define foreign key constraint across them.

**Example :** Suppose - `auth.users` and `hr.users`  both exist.
Allowed because - `auth ---> Namespace`
				`hr ---> Namespace`
```
Database

├── auth
│      └── users
│
├── hr
│      └── users
│
└── shop
       └── orders
```

## Default Schema
Every PostgreSQL database already has one schema. = public
When you create : 
```sql
CREATE TABLE users(...)
```
PostgreSQL actually creates `public.users`

**Note :** Full Table Name - Every table has a full name.
Example : `public.users` , `shop.orders` , `analytics.events`

## Prisma Support

- By default, Prisma assumes  - `public` schema only.
- suppose database has - `public` and `shop`  and needed both . If you want multiple schemas, tell Prisma.
```json
datasource db {
  provider = "postgresql"

  schemas = ["base", "shop"]
}
```
Prisma now manages tables from both PostgreSQL schemas.

## Assigning Models
Suppose `base`  contains  `users` and  `shop` contains `orders`.
```json
model User {
  id Int @id

  @@schema("base")
}

model Order {
  id Int @id

  @@schema("shop")
}
```
The model tells Prisma :
		- Create this table inside the `base` schema.
Generated SQL :
```SQL
CREATE TABLE base."User"
-- AND
CREATE TABLE shop."Order"
```

## Relations Across Schemas
Schemas did not  isolate tables completely.
```json
model User {
  id Int @id

  orders Order[]

  @@schema("base")
}

model Order {
  id Int @id

  userId Int

  user User @relation(fields: [userId], references: [id])

  @@schema("shop")
}
```
Generated SQL : PostgreSQL supports foreign keys across schemas.
```sql
shop.orders

↓

Foreign Key

↓

base.users
```

## Querying
Nothing changes.
```ts
const orders = await prisma.order.findMany({
  where: {
    user: {
      id: 42
    }
  }
});
```
How does Prisma know where the user & order is : 
		- `@@schema("base")`
		- `@@schema("shop")`

# Same Table Names
Suppose - `base.Config` and `users.Config`
Prisma cannot have - `model Config` twice.

**Solution** : 
```json
model BaseConfig {
  id Int @id

  @@map("Config")
  @@schema("base")
}

model UserConfig {
  id Int @id

  @@map("Config")
  @@schema("users")
}
```

To designate that a model or enum belongs to a specific database schema, add the `@@schema` attribute with the name of the database schema as a parameter.
```json
model User {
  id     Int     @id
  orders Order[]

  @@schema("base") 
}

model Order {
  id      Int  @id
  user    User @relation(fields: [userId], references: [id])
  userId  Int

  @@schema("shop") 
}

enum Size {
  Small
  Medium
  Large

  @@schema("shop") 
}
```

## How to apply your schema changes with Prisma Migrate

You can use Prisma Migrate (or `prisma db push`) to apply changes to a Prisma schema with multiple database schemas.

As an example, add a `Profile` model to the `base` schema above:
```json
model User {
  id      Int      @id
  orders  Order[]
  profile Profile?

  @@schema("base")
}

model Profile { 
  id     Int    @id @default(autoincrement()) 
  bio    String
  user   User   @relation(fields: [userId], references: [id]) 
  userId Int    @unique

  @@schema("base") 
} 

model Order {
  id      Int  @id
  user    User @relation(fields: [userId], references: [id])
  userId  Int

  @@schema("shop")
}

enum Size {
  Small
  Medium
  Large

  @@schema("shop")
}
```

`npx prisma migrate dev --name add_profile`

## How to introspect an existing database with multiple database schemas

`npx prisma db pull` This updates your Prisma schema to match the current state of the database.

Next : [[SCALAR TYPES]]