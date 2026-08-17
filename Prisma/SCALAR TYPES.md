1. `String` - variable length text.
	- Default type mapping (PostgreSQL) = `text`
	- Native Database type :

| Native database type | Native database type attribute | Notes                                          |
| :------------------- | :----------------------------- | :--------------------------------------------- |
| **text**             | `@db.Text`                     |                                                |
| **char(x)**          | `@db.Char(x)`                  |                                                |
| **varchar(x)**       | `@db.VarChar(x)`               |                                                |
| **bit(x)**           | `@db.Bit(x)`                   |                                                |
| **varbit**           | `@db.VarBit`                   |                                                |
| **uuid**             | `@db.Uuid`                     |                                                |
| **xml**              | `@db.Xml`                      |                                                |
| **inet**             | `@db.Inet`                     |                                                |
| **citext**           | `@db.Citext`                   | Only available if Citext extension is enabled. |
2. `Boolean` - True or false value.
	-  Default type mapping (PostgreSQL) = `boolean`

| Native Database Type | Native Database type attribute |
| -------------------- | ------------------------------ |
| boolean              | @db.Boolean                    |
3. `Int `
	- Default : `integer`

| Native database type<br>   | Native database type attribute           |
| -------------------------- | ---------------------------------------- |
| `integer` \| `int`, `int4` | `@db.Integer`                            |
| `smallint` \| `int2`       | `@db.SmallInt`                           |
| `smallserial` \| `serial2` | `@db.SmallInt @default(autoincrement())` |
| `serial` \| `serial4`      | `@db.Int @default(autoincrement())`      |
| `oid`                      | `@db.Oid`                                |
4. `BigInt`
	- Default : `bigint`
	
| Native database type     | Native database type attribute         |
| ------------------------ | -------------------------------------- |
| `bigint` \| `int8`       | `@db.BigInt`                           |
| `bigserial` \| `serial8` | `@db.BigInt @default(autoincrement())` |
4. Float - Floating point number
	- Default : `double precision`
	
| Native database type | Native database type attribute |
| -------------------- | ------------------------------ |
| `double precision`   | `@db.DoublePrecision`          |
| `real`               | `@db.Real`                     |
4. `Decimal` 
	- Default : `decimal(65,30)`
	
| Native database type   | Native database type attribute |
| ---------------------- | ------------------------------ |
| `decimal` \| `numeric` | `@db.Decimal(p, s)`†           |
| `money`                | `@db.Money`                    |
Example - `DECIMAL(10,2)` (10 total digits, 2 after the decimal point).

4. `DateTime` - Prisma Client returns all `DateTime` as native `Date` Object.
	-  `DateTime` values need to be passed as `Date `objects (i.e. `new Date('2024-12-04')` instead of `'2024-12-04'`).
	-  Default : `timestamp(3)` , here 3 represent precision **millisecond**
	
| Native database type | Native database type attribute |
| -------------------- | ------------------------------ |
| `timestamp(x)`       | `@db.Timestamp(x)`             |
| `timestamptz(x)`     | `@db.Timestamptz(x)`           |
| `date`               | `@db.Date`                     |
| `time(x)`            | `@db.Time(x)`                  |
| `timetz(x)`          | `@db.Timetz(x)`                |


4. `Json` - A JSON object.
	- Default : `jsonb`
	
| Native database type | Native database type attribute |
| -------------------- | ------------------------------ |
| `json`               | `@db.Json`                     |
| `jsonb`              | `@db.JsonB`                    |
4. `Butes` 
	- Default : `bytea`
	- Native : `bytea` ----> `@db.ByteA`

5. `Unsupported` - represent data types in the Prisma schema that are not supported by Prisma Client.

	- It can be created during Introspection with `prisma db pull` or written by hand, and created in the database with Prisma Migrate or `db push`.
	- Fields with `Unsupported` types are not available in the generated client.
	```json
	model Star {
	  id       Int                    @id @default(autoincrement())
	  position Unsupported("circle")?
	  example1 Unsupported("circle")
	  circle   Unsupported("circle")? @default(dbgenerated("'<(10,4),11>'::circle"))
}
	```

Next : [[TYPE MODIFIERS]]