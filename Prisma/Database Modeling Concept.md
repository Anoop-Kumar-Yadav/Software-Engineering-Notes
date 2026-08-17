Database modeling is process of converting a business problem into database structure.

**Example** : Build Instagram
So, First we think : ![[Untitled Diagram.drawio.svg]]
These are called Entities.

**Step 1** - Identify Entities - An *Entity* is a real world object that has its own identity.
- Example - User, Post, Comment, Like, Follow, Notification

**Step 2** - Identify Attribute - Now zoom into entities one by one and find what describe its.
- **Example** : User have ---> id , name , username , email , password , bio , avatarUrl , createdAt , updatedAt
- These become the fields.

**Step 3** - Field Classification - Every field belong to one category.
- `Primary Key` , `Business Data` , `Audit Data` , `Foreign Key` , `Computed Data`
-  Example - id - `Primary Kay`
			email , name , bio - `Business`
			updatedAt , createdAt - `Audit`

**Step 4** - Constraints - A rule enforced by the database according to business logic and requirements.
	 Example - Two users cannot have the same email - Constraint(`UNIQUE`)
			- Every user must have a name. - Constraint(`NOT NULL`)
			- Every user must have an ID - Constraint(`PRIMARY KEY`)
			- A post must belong to existing user - Constraint(`FORIEGN KEY`)

###### Constraint in Prisma Modeling :
1. PRIMARY KEY - uniquely identify each row.
	`id Int @id @default(autoincrement())`
2. Requied Field - Every user must have name.
	`name String`  , Here ther is no `?`
3. Optional Field - Bio is Optional
	`bio String?`
4. Unique - Email must be unique
	`email String @unique`
5. Default Value - creation time should be automatic
	`createdAt DateTime @default(now())`
6. Auto Update - `updatedAt DateTime @updatedAt`

Next : [[Understanding Actual Process Of Modeling]]