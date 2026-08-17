Referential actions determine what happens to a record when your application deletes or updates a related record. 

They are defined in the `@relation` attribute and map to foreign key constraints in the database.

- example, `onDelete: Cascade` means that deleting a `User` record will also delete all related `Post` records.
```JSON
model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId Int
}

model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}
```
If you do not specify M Prisma ORM [uses a default](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#referential-action-defaults).

## Available referential actions

- `Cascade` - Deletes/updates cascade to related records
- `Restrict` - Prevents deletion/update if related records exist
- `NoAction` - Similar to Restrict, behavior varies by database
- `SetNull` - Sets foreign key to NULL (requires optional relation)
- `SetDefault` - Sets foreign key to default value

-Referential actions are **not** supported on `implicit many-to-many relations`.

### [`Cascade`](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#cascade)

- `onDelete: Cascade` Deleting a referenced record will trigger the deletion of referencing record.
- `onUpdate: Cascade` Updates the relation scalar fields if the referenced scalar fields of the dependent record are updated.

```
model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade, onUpdate: Cascade) 
  authorId Int
}

model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}
```

**Result:** If a `User` record is deleted, their posts are deleted too. If the user's `id` is updated, the corresponding `authorId` is also updated.

### [`Restrict`](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#restrict)

- `onDelete: Restrict` Prevents the deletion if any referencing records exist.
- `onUpdate: Restrict` Prevents the identifier of a referenced record from being changed.

```
model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Restrict, onUpdate: Restrict) 
  authorId Int
}

model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}
```

**Result:** `User`s with posts cannot be deleted. The `User`'s `id` cannot be changed.
### [`NoAction`](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#noaction)

The `NoAction` action is similar to `Restrict`, the difference between the two is dependent on the database being used:

- **PostgreSQL**: `NoAction` allows the check (if a referenced row on the table exists) to be deferred until later in the transaction. See [the PostgreSQL docs](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK) for more information.
- **MySQL**: `NoAction` behaves exactly the same as `Restrict`. See [the MySQL docs](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html#foreign-key-referential-actions) for more information.

```
model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id], onDelete: NoAction, onUpdate: NoAction) 
  authorId Int
}

model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}
```

**Result:** `User`s with posts cannot be deleted. The `User`'s `id` cannot be changed.

### [`SetNull`](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#setnull)

- `onDelete: SetNull` The scalar field of the referencing object will be set to `NULL`.
    
- `onUpdate: SetNull` When updating the identifier of a referenced object, the scalar fields of the referencing objects will be set to `NULL`.
    

`SetNull` will only work on optional relations. On required relations, a runtime error will be thrown since the scalar fields cannot be null.

```
model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User?  @relation(fields: [authorId], references: [id], onDelete: SetNull, onUpdate: SetNull) 
  authorId Int?
}

model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}
```

**Result:** When deleting or updating a `User`, the `authorId` is set to `NULL` for all their posts.

### [`SetDefault`](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#setdefault)

- `onDelete: SetDefault` The scalar field of the referencing object will be set to the fields default value.
    
- `onUpdate: SetDefault` The scalar field of the referencing object will be set to the fields default value.
    

These require setting a default for the relation scalar field with [`@default`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#default). If no defaults are provided for any of the scalar fields, a runtime error will be thrown.

```
model Post {
  id             Int     @id @default(autoincrement())
  title          String
  authorUsername String? @default("anonymous") 
  author         User?   @relation(fields: [authorUsername], references: [username], onDelete: SetDefault, onUpdate: SetDefault) 
}

model User {
  username String @id
  posts    Post[]
}
```

**Result:** When deleting or updating a `User`, their posts' `authorUsername` is set to the default value ('anonymous').

Next : [[INDEX]]