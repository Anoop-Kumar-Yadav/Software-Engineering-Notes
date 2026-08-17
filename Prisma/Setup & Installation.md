1. `npm init -y`
2. `npm i -D typescript tsx @types/node`
3. `npm i -D prisma @types/pg @types/express`
4. `npm i @prisma/client @prisma/adpater-pg pg express dotenv zod`
5. `npx tsc --init`
6. `npx prisma init` 
	It generate 2 configuration files for prisma  -
		1. prisma.config.ts
		2. ./prisma/schema.prisma
		3. .env (if not exist)
```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},

	datasource: {
		url: process.env["DATABASE_URL"],
	},
});
// ------------------------------------------------------------------
// schems.prisma
generator client {
	provider = "prisma-client"
	output = "../generated/prisma"
}

datasource db {
	provider = "postgresql"=
}
```
7. `docker compose up -d`
```yml
name: pg_learning

services:
  postgres:
    image: postgres:17
    container_name: pg_learning

    restart: unless-stopped

    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
      POSTGRES_DB: pg_learning

    ports:
      - "5432:5432"

    volumes:
      - postgres-data:/var/lib/postgresql/data

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d devconnect"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
    name: pg_learning_data
```

8. **Edit** :  geneated .env file - 
		`DATABASE_URL="postgresql://admin:admin123@localhost:5432/pg_learning"`

***Recommend : Edit***
- package.json - `type="module" `
- tsconfig.json -
```json
.
.
types=["node"]
"rootDir": "./src",
"outDir": "./dist",
.
.
```

- Now generate the prisma client : `npx prisma generate` 
- It creates the folder mention in prisma.schema `output = "../generated/prisma"`

Next : [[Database Modeling Concept]]