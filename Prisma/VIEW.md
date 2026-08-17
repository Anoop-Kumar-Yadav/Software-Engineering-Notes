A **View** is a **stored SQL query that behaves like a virtual table**. Database views allow you to name and store queries.
```sql
-- Normal SQL : Every time you want complete user information you write
SELECT u.id, u.name, u.email, p.bio
FROM users u
LEFT JOIN profiles p
ON u.id = p.userId;
```
```sql
-- Create a View to reduce repetitive queries
CREATE VIEW user_info AS
SELECT u.id, u.name, u.email, p.bio
FROM users u
LEFT JOIN profiles p
ON u.id = p.userId;
```
```sql
-- Querying a View : Looks exactly like querying a table.
SELECT *
FROM user_info;
```
But Internally it gets expand to original one.
```
SELECT *
↓
user_info
↓
Original JOIN Query
↓
Execute
```


#### **Enable the views preview feature**
- The `views` preview feature allows you to represent views in your Prisma schema.
```json
generator client {
  provider        = "prisma-client"
  output          = "./generated"
  previewFeatures = ["views"] // Now Enabled
}
```

Note : Prisma doesn't know about view , until explicitly written or present in prisma.schema.
If not present in prisma.schema , Prisma query to PostgreSQL using normal table like queries using JOIN . 
So, We Tell Prisma - The view already exists.
```json
// prisma.schema
view UserInfo {
  id    Int
  email String
  name  String
  bio   String
}
```
Normally for model : Migration creates SQL queries for table creation , then PostgreSQL create table

But For Views :  Migration does nothing , Migrate currently doesn't generate.
So , You must first create the view in the underlying database like 'CREATE VIEW user_info AS ...'
then define view inside prisma.schema . ( Not the opposite )

#### Why Doesn't Prisma Create Views?
Prisma Migrate supports :
```
Tables
Columns
Indexes
Relations
Enums
```
Not Views.

So `npx prisma migrate dev` ignore `view UserInfo { . . . }`

#### Then How Do We Create Views?
- **Option 1 — Manually** - Open DBeaver and Run
```sql
CREATE VIEW user_info AS
SELECT ...
```
- **Option 2 — Inside Migration** - Create migration `npx prisma migrate dev --create-only`
		Prisma creates - `migration.sql`
		Open - `migration.sql`
		Append - 
			```sql
			CREATE VIEW user_info AS
			SELECT u.id, u.email, u.name, p.bio
			FROM users u
			LEFT JOIN profiles p
			ON u.id = p.userId;
			```
		Save, and Run - `npx prisma migrate dev`
		- Now In Databse :  users, profiles, user_info
		- In prisma.schema : `view UserInfo {. . . }`
		
		-Now Generate Client : npx prisma generate

#### What If I Already Have Many Views?
- Run : `npx prisma db pull`
- Prisma reads - Tables, View, Indexes
- Automatically creates every block inside prisma.schema
- This is called **introspection**.

## The `views` Directory
On running: `npx prisma db pull` , Prisma does 2 things.
1. It Updates `prisma.schema` by creating blocks.
```json
view UserInfo {
  id    Int?
  email String?
  name  String?
  bio   String?
}
```
2. It creates a new folder.
```
prisma/
│
├── schema.prisma
│
└── views/
    │
    └── public/
        │
        └── UserInfo.sql
```
Because Prisma wants to preserve the SQL that defines the view.
`UserInfo.sql` contain similar to :
```sql
SELECT u.id, u.email, u.name, p.bio
FROM "User" u
LEFT JOIN "Profile" p
ON u.id = p."userId";
```
This SQL file is **not executed**. It is only a copy of the database definition for developers to see what views are available.

## Querying Views
Suppose 
```json
view UserInfo {
  id    Int
  email String
  name  String
  bio   String
}
```
Generate Client : `npx prisma generate`
	Prisma creates : `prisma.userInfo` exactly like `prisma.user`
Example:
```ts
const users = await prisma.userInfo.findMany();
```
```sql
-- Generated SQL
SELECT *
FROM "UserInfo";
```

```ts
const users = await prisma.userInfo.findMany({
  where: {
    name: "Alice"
  }
});
```
```sql
-- Generated SQL
SELECT *
FROM "UserInfo"
WHERE name = 'Alice';
```

**Available Methods** for the view :
```ts
findMany()
findFirst()
findUnique()
count()
aggregate()
```
Not Generated :
```ts
create()
createMany()
update()
updateMany()
delete()
deleteMany()
upsert()
```

## Materialized Views
Normal View - `Store SQL`
Every request executes the SQL.
```
SELECT
↓
Run Query
↓
Return Rows
```

Materialized View - `Stores Result`
Think of it as caching.
```
SELECT
↓
Run Once
↓
Store Result
↓
Read Stored Result
```

- **Refreshing Materialized** **Views**  -  Need 
```JSON
REFRESH MATERIALIZED VIEW sales_summary;
```
This recomputes the stored data. Prisma currently has no API for `refreshMaterializedView()`
Instead use :
```TS
await prisma.$executeRaw`
    REFRESH MATERIALIZED VIEW sales_summary;
`;
```

Next : [[MULTI-SCHEMA]]