# Part 1: Project Initialization and Architecture

**Reference:** [YouTube Tutorial](https://www.youtube.com/watch?v=WdsGkXyRI5o)

## Project Configuration

### Initialize the Project

```bash
# Initialize a new Node.js project
pnpm init

# Install production dependencies
pnpm add express morgan dotenv

# Install development dependencies
pnpm add -D typescript @types/express @types/morgan ts-node-dev tsconfig-paths

# Initialize TypeScript configuration
pnpm tsc --init
```

## Project Structure

```plaintext
src
  ├── app.ts
  ├── models/
  ├── repositories/
  ├── services/
  ├── server/
    ── server.ts
  ├── routes/
  └── controllers/
  ├── types/
```

## TypeScript Configuration

Configure the `tsconfig.json` file with path aliases for cleaner imports:

```json
{
  "compilerOptions": {
    "target": "ES6",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@controllers/*": ["controllers/*"],
      "@services/*": ["services/*"],
      "@repositories/*": ["repositories/*"],
      "@models/*": ["models/*"],
      "@routes/*": ["routes/*"],
      "@server/*": ["server/*"],
      "@config/*": ["config/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"],
  "ts-node": {
    "require": ["tsconfig-paths/register"]
  }
}
```

## Package Configuration

Update the `package.json` file with the development script:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only -r tsconfig-paths/register src/app.ts",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### Development Script Explanation

The `dev` script uses several important flags:

| Flag                      | Description                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `ts-node-dev`             | Combines ts-node (TypeScript execution) with node-dev (auto-restart on file changes) |
| `--respawn`               | Keeps the process alive after failures; restarts automatically when files are saved  |
| `--transpile-only`        | Speeds up compilation by skipping type checking during development                   |
| `-r`                      | Short for `--require`; loads modules before the application starts                   |
| `tsconfig-paths/register` | Enables path aliases (e.g., `@controllers/*`) defined in tsconfig.json               |
| `src/app.ts`              | Entry point of the application                                                       |

## Entry Point Files

### app.ts

This file is responsible for starting the application and configuring environment variables:

```typescript
import app from "@server/server";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const PORT: string | number = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

### server.ts

This file contains the server configuration and middleware setup:

```typescript
import express, { Application } from "express";
import morgan from "morgan";

const app: Application = express();

// Middlewares
app.use(express.json()); // Parse incoming JSON requests
app.use(morgan("dev")); // Log HTTP requests to the console

export default app;
```

## Running the Server

Execute the development script to start the server:

```bash
pnpm run dev
```

Expected output:

```
[INFO] 19:50:46 ts-node-dev ver. 2.0.0 (using ts-node ver. 10.9.2, typescript ver. 5.9.3)
[dotenv@17.2.3] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
Server is running on http://localhost:4000
```

## Configuring Routes

### Setting Up the Routes Module

Create a `routes.ts` file in the `routes` folder:

```typescript
import { Router, Request, Response } from "express";

const router: Router = Router();

export default () => {
  router.get("/healthy", (req: Request, res: Response) => {
    res.json({ status: "API is healthy" });
  });

  return router;
};
```

### Importing Routes into the Application

Update `app.ts` to integrate the routes module:

```typescript
import routes from "@routes/routes";

app.use("/api/v1", routes());
```

This configuration registers all routes under the `/api/v1` prefix. The health check endpoint will be accessible at `GET http://localhost:4000/api/v1/healthy`.
