Attributes modify the behavior of a field o block .

- There are two ways to add attributes to your data model:
	- `@` for field attributes
	- `@@ `for Block attributes

- Some attributes take arguments.

1. `@id` - Define a single-field ID on model .
	- Cannot be defined on a relation field
	- Cannot be optional
	- construct : `PRIMARY KEY`
	- can use @default attribute that uses function to auto-generate an ID:
		- autoincrement()
		- cuid()
		- uuid()
		- ulid()
	- can be defined on any scalar field ( `String`, `Int`, `enum` )
	
**Arguments**

| Name          | Required | Type    | Description                                                                                                                                                 |
| :------------ | :------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **map**       | No       | String  | The name of the underlying primary key constraint in the database.<br><br>*Not supported for MySQL or MongoDB.*                                             |
| **length**    | No       | number  | Allows you to specify a maximum length for the subpart of the value to be indexed.<br><br>*MySQL only.*                                                     |
| **sort**      | No       | String  | Allows you to specify in what order the entries of the ID are stored in the database. The available options are `Asc` and `Desc`.<br><br>*SQL Server only.* |
| **clustered** | No       | Boolean | Defines whether the ID is clustered or non-clustered. Defaults to `true`.<br><br>*SQL Server only.*                                                         |
**Signature** - `@id(map: String?, length: number?, sort: String?, clustered: Boolean?)`

2. `@@id` - Defines a multi-field ID (composite ID) on the model.
	**Arguments**
	
| Name       | Required | Type               | Description                                                                                                                                          |     |
| :--------- | :------- | :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| **fields** | Yes      | `FieldReference[]` | A list of field names - for example, `["firstname", "lastname"]`                                                                                     |     |
| **name**   | No       | String             | The name that Prisma Client will expose for the argument covering all fields, e.g. `fullName` in `fullName: { firstName: "First", lastName: "Last"}` |     |
| **map**    | No       | String             | The name of the underlying primary key constraint in the database.<br><br>*Not supported for MySQL.*                                                 |     |
**Signature** - `@@id(_ fields: FieldReference[], name: String?, map: String?)`
```json
model User {
  firstName String
  lastName  String
  email     String  @unique
  isAdmin   Boolean @default(false)

  @@id([firstName, lastName])
}
```
```ts
// Creating User
const user = await prisma.user.create({
  data: {
    firstName: "Alice",
    lastName: "Smith",
  },
});

// Retrieving User using generated composite ID field (`firstName_lastName`)
const user = await prisma.user.findUnique({
  where: {
    firstName_lastName: {
      firstName: "Alice",
      lastName: "Smith",
    },
  },
});
```

### [`@default`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default) 
Defines a [default value for a field](https://www.prisma.io/docs/orm/prisma-schema/data-model/models#defining-a-default-value).

- JSON data - `@default("{ \"hello\": \"world\" }")`.

##### [Relational databases](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#relational-databases-2)

- Corresponding database construct: `DEFAULT`
- Default values can be a static value (`4`, `"hello"`) or one of the following [functions](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#attribute-functions):
    - `autoincrement()`
    - `dbgenerated(...)`
    - `cuid()`
    - `cuid(2)`
    - `uuid()`
    - `uuid(4)`
    - `uuid(7)`
    - `ulid()`
    - `nanoid()`
    - `now()`

#### Arguments

| Name    | Required | Type                                      | Description |
| ------- | -------- | ----------------------------------------- | ----------- |
| `value` | **Yes**  | An expression (e.g. `5`, `true`, `now()`) |             |

The name of the `value` argument on the `@default` attribute can be omitted:

```json
id Int @id @default(value: autoincrement())
id Int @id @default(autoincrement())
```

#### Signature

```json
@default(_ value: Expression, map: String?)
```

#### Examples

##### [Default value for an `Int`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default-value-for-an-int)

```json
model User {
  email        String @unique
  profileViews Int    @default(0)
}
```

##### [Default value for a `Float`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default-value-for-a-float)

```json
model User {
  email  String @unique
  number Float  @default(1.1)
}
```

##### [Default value for `Decimal`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default-value-for-decimal)

```json
model User {
  email  String  @unique
  number Decimal @default(22.99)
}
```

##### [Default value for `BigInt`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default-value-for-bigint)

```json
model User {
  email  String @unique
  number BigInt @default(34534535435353)
}
```

##### [Default value for a `String`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default-value-for-a-string)

```json
model User {
  email String @unique
  name  String @default("")
}
```

##### [Default value for a `Boolean`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default-value-for-a-boolean)

```json
model User {
  email   String  @unique
  isAdmin Boolean @default(false)
}
```

##### [Default value for a `DateTime`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default-value-for-a-datetime)

Note that static default values for `DateTime` are based on the [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) standard.

```json
model User {
  email String   @unique
  data  DateTime @default("2020-03-19T14:21:00+02:00")
}
```

##### [Default value for a `Bytes`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default-value-for-a-bytes)

```json
model User {
  email  String @unique
  secret Bytes  @default("SGVsbG8gd29ybGQ=")
}
```

##### [Default value for an `enum`](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default-value-for-an-enum)

```json
enum Role {
  USER
  ADMIN
}
```

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

```json
enum Role {
  USER
  ADMIN
}
```

```json
model User {
  id      String   @id @default(auto()) @map("_id") @db.ObjectId
  email   String   @unique
  name    String?
  role    Role     @default(USER) 
  posts   Post[]
  profile Profile?
}
```

##### [Default values for scalar lists](https://www.prisma.io/docs/orm/reference/prisma-schema-reference?_gl=1*1qjdpmz*_up*MQ..*_ga*MTIxODU2ODAxLjE3ODM3NDE1MjU.*_ga_4B72WBX9ET*czE3ODM3NDE1MjQkbzEkZzAkdDE3ODM3NDE1MjQkajYwJGwwJGgw#default-values-for-scalar-lists)

```json
model User {
  id             Int      @id @default(autoincrement())
  posts          Post[]
  favoriteColors String[] @default(["red", "yellow", "purple"]) 
  roles          Role[]   @default([USER, DEVELOPER])
}

enum Role {
  USER
  DEVELOPER
  ADMIN
}
```