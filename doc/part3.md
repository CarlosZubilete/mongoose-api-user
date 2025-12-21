# Part 3: MongoDB Integration and Complete CRUD Operations

**Branch:** `branch3`

## Overview

This document details the integration of MongoDB using Mongoose ODM (Object Document Mapper), implementation of complete CRUD (Create, Read, Update, Delete) operations, and MongoDB connection configuration. This branch transforms the application from in-memory storage to a persistent database solution.

---

## Changes Summary

### Files Modified

| File                                   | Change Type | Description                                                 |
| -------------------------------------- | ----------- | ----------------------------------------------------------- |
| `package.json`                         | Modified    | Added Mongoose dependency (v9.0.2)                          |
| `src/app.ts`                           | Modified    | Added MongoDB configuration import                          |
| `src/types/RepositoryTypes.ts`         | Modified    | Extended interface with full CRUD methods                   |
| `src/types/UserTypes.ts`               | Modified    | Added service methods for CRUD operations                   |
| `src/repositories/userRepositories.ts` | Modified    | Replaced in-memory storage with Mongoose operations         |
| `src/services/userServices.ts`         | Modified    | Implemented full CRUD service methods                       |
| `src/routes/routes.ts`                 | Modified    | Added endpoints for GET (by ID), PUT, and DELETE operations |
| `tsconfig.json`                        | Modified    | Configuration updates                                       |
| `request.http`                         | Modified    | Updated test requests for new endpoints                     |

### Files Created

| File                    | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| `src/config/mongodb.ts` | MongoDB connection configuration and initialization |
| `src/models/Users.ts`   | Mongoose schema and User model definition           |
| `doc/part3.md`          | Technical documentation for MongoDB integration     |

---

## Detailed Changes

### 1. MongoDB Connection Configuration

#### src/config/mongodb.ts

Establishes the connection to MongoDB Atlas using environment variables:

```typescript
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI: string = process.env.MONGODB_URL_STRING as string;

export default (async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB successfully.");
  } catch (error) {
    console.error("Error connecting to MongoDB: >> ", error);
    process.exit(1);
  }
})();
```

**Key Features:**

- Asynchronous connection initialization using IIFE (Immediately Invoked Function Expression)
- Automatic execution when the module is imported
- Error handling with process exit on connection failure
- Retrieves connection string from `.env` file using `MONGODB_URL_STRING` variable

### 2. Mongoose Schema and Model

#### src/models/Users.ts

Defines the MongoDB schema and creates a Mongoose model for type safety:

```typescript
import { User } from "types/UserTypes";
import mongoose, { Schema } from "mongoose";

const UserSchema: Schema = new Schema<User>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserModel = mongoose.model<User>("User", UserSchema);
```

**Schema Configuration:**

- `name`: Required string field
- `username`: Required string with unique constraint (no duplicate usernames)
- `email`: Required string with unique constraint (no duplicate emails)
- `timestamps`: Automatically adds `createdAt` and `updatedAt` fields
- `versionKey: false`: Removes MongoDB's default `__v` field from documents

### 3. Updated Type Definitions

#### src/types/RepositoryTypes.ts

Extended the generic repository interface with complete CRUD operations:

```typescript
export interface IRepository<T = unknown> {
  create(data: T): Promise<T>;
  find(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
```

**New Methods:**

- `findById(id: string)`: Retrieves a single document by ID
- `update(id: string, data: Partial<T>)`: Updates a document and returns the updated version
- `delete(id: string)`: Removes a document and returns success status

#### src/types/UserTypes.ts

Extended the service interface with additional methods:

```typescript
export interface IUserService {
  createUser(data: User): Promise<User>;
  findUsers(): Promise<User[]>;
  findUserById(id: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
}
```

### 4. Repository Layer with MongoDB

#### src/repositories/userRepositories.ts

Replaced in-memory storage with Mongoose queries:

```typescript
import { UserModel } from "models/Users";
import { IUserRepository, User } from "types/UserTypes";

export class UserRepository implements IUserRepository {
  async create(data: User): Promise<User> {
    const newUser = new UserModel(data);
    return await newUser.save();
  }

  async find(): Promise<User[]> {
    return await UserModel.find().exec();
  }

  async findById(id: string): Promise<User | null> {
    return await UserModel.findById(id).exec();
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    return await UserModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
```

**Key Changes:**

- **Removed**: In-memory array storage (`private users: User[] = []`)
- **Added**: Mongoose operations for database persistence
- All methods are now asynchronous with `await` for database operations
- `.exec()` method forces query execution and returns a Promise

### 5. Service Layer Implementation

#### src/services/userServices.ts

Activated previously commented CRUD methods:

```typescript
import { IUserRepository, IUserService, User } from "types/UserTypes";

export class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(data: User): Promise<User> {
    return this.userRepository.create(data);
  }

  async findUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}
```

**Changes:**

- Uncommented all CRUD methods
- Methods now properly delegate to repository layer
- Maintains consistent async/await pattern throughout

### 6. Application Entry Point

#### src/app.ts

Added MongoDB configuration import:

```typescript
// it will be responsible for starting our application.
import app from "@server/server";
import dotenv from "dotenv";
import routes from "@routes/routes";
import "@config/mongodb"; // Import the MongoDB configuration to establish the connection

// Load environment variables from .env file
dotenv.config();

const PORT: string | number = process.env.PORT || 4000;

app.use("/api/v1", routes());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

**Key Addition:**

- `import "@config/mongodb"` - Executes MongoDB connection on application startup
- Connection is established before routes are registered

### 7. Complete REST API Endpoints

#### src/routes/routes.ts

Implemented all CRUD endpoints:

```typescript
import { UserRepository } from "@repositories/userRepositories";
import { UserService } from "@services/userServices";
import { Router, Response, Request } from "express";
import { IUserRepository, User, IUserService } from "types/UserTypes";

const router: Router = Router();

const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);

export default () => {
  // Health check
  router.get("/healthy", (req: Request, res: Response) => {
    res.send("Api is healthy");
  });

  // GET all users
  router.get("/users", async (req: Request, res: Response) => {
    const users: User[] = await userService.findUsers();
    res.json(users);
  });

  // GET user by ID
  router.get("/users/:id", async (req: Request, res: Response) => {
    const user: User | null = await userService.findUserById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  // POST create new user
  router.post("/users", async (req: Request, res: Response) => {
    const user: User = await userService.createUser(req.body);
    res.json(user);
  });

  // PUT update user by ID
  router.put("/users/:id", async (req: Request, res: Response) => {
    const user: User | null = await userService.updateUser(
      req.params.id,
      req.body
    );
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  // DELETE user by ID
  router.delete("/users/:id", async (req: Request, res: Response) => {
    const success: boolean = await userService.deleteUser(req.params.id);
    if (success) {
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  return router;
};
```

**Endpoints Summary:**

| Method | Endpoint            | Purpose                  | Status Codes |
| ------ | ------------------- | ------------------------ | ------------ |
| GET    | `/api/v1/users`     | Retrieve all users       | 200          |
| GET    | `/api/v1/users/:id` | Retrieve a specific user | 200, 404     |
| POST   | `/api/v1/users`     | Create a new user        | 201          |
| PUT    | `/api/v1/users/:id` | Update a user            | 200, 404     |
| DELETE | `/api/v1/users/:id` | Delete a user            | 200, 404     |
| GET    | `/api/v1/healthy`   | Health check             | 200          |

### 8. Dependency Addition

#### package.json

Added MongoDB driver and Mongoose:

```json
{
  "dependencies": {
    "dotenv": "17.2.3",
    "express": "5.2.1",
    "mongoose": "9.0.2",
    "morgan": "1.10.1"
  }
}
```

**New Dependency:**

- **mongoose@9.0.2**: ODM (Object Document Mapper) for MongoDB with schema validation and type safety

---

## Architecture Evolution

### Before (In-Memory Storage)

```
Request → Routes → Service → Repository → In-Memory Array
```

### After (MongoDB Persistence)

```
Request → Routes → Service → Repository → Mongoose Model → MongoDB
```

---

## Database Connection Flow

1. **Application Start** → `src/app.ts` imported
2. **Import Config** → `@config/mongodb` imported
3. **Async Connection** → IIFE in `mongodb.ts` executes immediately
4. **Environment Variables** → `MONGODB_URL_STRING` read from `.env`
5. **MongoDB Connection** → Mongoose connects to MongoDB Atlas
6. **Success/Error** → Logs connection status and exits on failure
7. **Server Ready** → Express server listens for requests

---

## Environment Configuration

Ensure your `.env` file contains:

```env
MONGODB_URL_STRING="mongodb+srv://username:password@cluster-name.mongodb.net/database-name?appName=app-name"
PORT=4000
```

**Connection String Format:**

```
mongodb+srv://username:password@cluster.mongodb.net/database?appName=name
```

---

## Testing Endpoints

### Using REST Client (request.http)

```http
### Get all users
GET http://localhost:4000/api/v1/users

### Create a new user
POST http://localhost:4000/api/v1/users
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com"
}

### Get user by ID
GET http://localhost:4000/api/v1/users/MONGODB_ID_HERE

### Update user
PUT http://localhost:4000/api/v1/users/MONGODB_ID_HERE
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}

### Delete user
DELETE http://localhost:4000/api/v1/users/MONGODB_ID_HERE
```

---

## Key Improvements

- ✅ **Data Persistence**: Users are now stored in MongoDB, not lost on server restart
- ✅ **Complete CRUD**: All four CRUD operations fully implemented
- ✅ **Error Handling**: 404 responses for non-existent resources
- ✅ **Database Validation**: Mongoose schema enforces data integrity
- ✅ **Unique Constraints**: Username and email uniqueness enforced at database level
- ✅ **Automatic Timestamps**: `createdAt` and `updatedAt` fields automatically managed
- ✅ **Type Safety**: Full TypeScript support throughout the stack
- ✅ **Separation of Concerns**: Repository pattern maintains clean architecture

---
