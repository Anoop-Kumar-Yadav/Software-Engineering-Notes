Imagine prisma model : 
```json
model User {
  id String @id @db.VarChar(3000)
}
```
```sql
-- Generated SQL
CREATE TABLE User (
    id VARCHAR(3000) PRIMARY KEY
);
```
A Primary Key automatically creates an index.
As length of each value can be 5000 character long for millions of rows- If MySQL indexes the **entire string**, the index becomes enormous.
- More RAM
- More disk
- Slower inserts
- Slower updates

NOTE : PostgreSQL handles large values differently.

**SOLUTION :**  Index only part of string. (EX- First 100 Characters)
```json
model User {
  id String @id(length: 100) @db.VarChar(3000)
}
```
- The column still stores 3000 characters, but index only store first 100 characters.

**Compound Example -** composite primary key (first 100 character of  sku & first 20 characters of batchNo)
```json
model Product {
  sku      String @db.VarChar(3000)
  batchNo  String @db.VarChar(3000)

  @@id([
    sku(length: 100),
    batchNo(length: 20)
  ])
}
```

Next : [[INDEX - GIN (Generalized Inverted Index)]]