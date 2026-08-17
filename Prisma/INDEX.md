## What is an Index?

Imagine you have a book with **1000 pages**, You want to find the chapter **"Prisma "**.
- Now wothout an Index, You start from page 1 and goes on searching until found :
```
Page 1
Page 2
Page 3
...
Page 784
```
This is called a **Full Table Scan**.

```sql
SELECT *
FROM users
WHERE email = 'anoop@gmail.com';
```

Similarly , Databases - Without an index, PostgreSQL may scan every row.

With an Index :  You directly jump.
```
Prisma ........ Page 784
Docker ........ Page 532
Node.js ....... Page 412
```

Database works exactly the same way. (B-Tree)

## Prisma Index
```json
model User {
  id    Int    @id @default(autoincrement())
  email String

  @@index([email])
}
```

```sql
CREATE INDEX users_email_idx ON users(email);
```
#### Prisma Index Configuration
Lets understand the arguments.
```
@@index
│
├── sort
├── type
├── map
├── length (MySQL)
└── clustered (SQL Server)
```
Since we use PostgreSQL:  only care about  - sort, type, map

1. `sort` - store index entries in an order. (Default - Ascending)
```json
@@index([createdAt(sort: Desc)])
```
```sql
CREATE INDEX
ON posts(createdAt DESC);
```
Example : Need Newest posts first.
```sql
-- Manually , every query looks like
SELECT *
FROM posts
ORDER BY createdAt DESC
LIMIT 10;
```
```sql
-- with index, dont need to reverse everytime
@@index([createdAt(sort: Desc)])
```

**Compound Example -** This is much faster than sorting after filtering.
For Queries like :
```sql
SELECT *
FROM posts
WHERE authorId = 10
ORDER BY createdAt DESC;
```
```json
model Post {
  id        Int      @id
  authorId  Int
  createdAt DateTime

  @@index([
    authorId,
    createdAt(sort: Desc)
  ])
}
```
NOTE : Only the **index** is ordered, not table stored ion ordered.
- PostrgreSQL does.'t allow `email String @unique(sort: Desc)`


2. `type` - PostgreSQL specific, As PostgreSQL build different kinds of indexes. (Default:  B-Tree)
	- Each solves different problems.
```
BTree
Hash
GIN
GiST
SP-GiST
BRIN
```
	- `B-Tree` : Good for (=, <, >, <=, >=, ORDER BY)
	
	- `Hash` : Optimized for (=)
	
	- `GIN (Generalized Inverted Index)` : Used for multiple values inside one column. (- JSONB - Arrays - Full-text search)
	
	- `GiST` : Good for Geometry, Ranges, GIS, Spatial Search
	
	- `SP-GiST` : Optimized for specific data structure like trie
	
	- `BRIN` : stores summaries of page ranges instead of every value.Excellent for very large append-only tables like logs or analytics.

| Query Pattern               | Index                 |
| --------------------------- | --------------------- |
| Equality (`=`)              | BTree (default), Hash |
| Range (`>`, `<`, `BETWEEN`) | BTree                 |
| Sorting (`ORDER BY`)        | BTree                 |
| JSONB search                | GIN                   |
| Array search                | GIN                   |
| Full-text search            | GIN                   |
| Spatial queries             | GiST/SP-GiST          |
| Massive time-series tables  | BRIN                  |
3. `map` - changes only the **database object name**.
```json
	@@index(
	    [email],
	    map: "idx_users_email"
	)
```

## Database-Specific Options
1. `length` ( MYSQL only ) - Indexing the entire string can be expensive for VARCHAR(5000) column.
	- Index only first 100 characters : `@unique(length: 100)`
	- PostgreSQL doesn't support.
2. `clustered` ( SQL Server only ) - 

Next : [[INDEX - length (MySQL Only)]]