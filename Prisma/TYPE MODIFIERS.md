1. [  ]  modifier - makes a field a list.
	-  It cannot be optional (`Post[] ?`)
```json
// Definig Scalar list
model User {
  id             Int      @id @default(autoincrement())
  favoriteColors String[]
}

// Scalar List with default value
model User {
  id             Int      @id @default(autoincrement())
  favoriteColors String[] @default(["red", "blue", "green"]) 
}
```

2. `?` modifier - Makes a field optional.
	- Cannot be used with a list field
```json
model User {
  id   Int     @id @default(autoincrement())
  name String?
}
```

Next : [[ATTRIBUTES]]