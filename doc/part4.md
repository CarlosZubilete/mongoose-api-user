# Part 4: Controller Layer Implementation and Role Management

**Branch:** `branch4`

## Overview

This document details the implementation of the Controller layer, introduction of the Role entity, and refactoring of the routing architecture. This branch introduces separation of concerns by extracting business logic from routes into dedicated controller functions, and adds complete role management functionality following the same architectural patterns established in previous branches.

---

## Changes Summary

### Files Modified

| File                   | Change Type | Description                                                    |
| ---------------------- | ----------- | -------------------------------------------------------------- |
| `src/routes/routes.ts` | Modified    | Refactored to delegate to controllers, added role endpoints    |
| `request.http`         | Deleted     | Consolidated into separate `users.http` and `roles.http` files |

### Files Created

| File                                   | Purpose                               |
| -------------------------------------- | ------------------------------------- |
| `src/controllers/usersController.ts`   | User CRUD operation handlers          |
| `src/controllers/rolesController.ts`   | Role CRUD operation handlers          |
| `src/types/RoleTypes.ts`               | Role interfaces and type definitions  |
| `src/models/Roles.ts`                  | Mongoose schema and Role model        |
| `src/repositories/roleRepositories.ts` | Role data access layer                |
| `src/services/roleServices.ts`         | Role business logic layer             |
| `users.http`                           | HTTP test requests for user endpoints |
| `roles.http`                           | HTTP test requests for role endpoints |
| `doc/part4.md`                         | Technical documentation               |

---

## Architectural Pattern: MVC to Controllers

### Before (Routes Handling All Logic)

```
HTTP Request → Route Handler → Service → Repository → Database
                ↑
           (All logic inline)
```

### After (Clean Separation with Controllers)

```
HTTP Request → Route → Controller → Service → Repository → Database
                           ↑
                    (Business Logic)
```

---

## Detailed Changes

### 1. Refactored Routes Architecture

#### src/routes/routes.ts

Transformed from logic-heavy route handlers to clean delegation pattern:

**Before:**

```typescript
router.get("/users", async (req: Request, res: Response) => {
  const users: User[] = await userService.findUsers();
  res.json(users);
});
```

**After:**

```typescript
import {
  createUser,
  deleteUser,
  findUserById,
  findUsers,
  updateUser,
} from "@controllers/usersController";
import {
  createRole,
  deleteRole,
  findRoleById,
  findRoles,
  updateRole,
} from "@controllers/rolesController";

const router: Router = Router();

export default () => {
  router.get("/healthy", (_, res: Response) => {
    res.send("Api is healthy");
  });

  // * user routes
  router.get("/users", findUsers);
  router.get("/users/:id", findUserById);
  router.post("/users", createUser);
  router.put("/users/:id", updateUser);
  router.delete("/users/:id", deleteUser);

  // * role routes
  router.get("/roles", findRoles);
  router.get("/roles/:id", findRoleById);
  router.post("/roles", createRole);
  router.put("/roles/:id", updateRole);
  router.delete("/roles/:id", deleteRole);

  return router;
};
```

**Key Improvements:**

- Routes are now clean and self-documenting
- Easy to visualize all available endpoints at a glance
- Logic moved to dedicated controller layer
- Added comments to group related routes

### 2. User Controller Layer

#### src/controllers/usersController.ts

Centralized user request handlers with error management:

```typescript
import { Request, Response } from "express";
import { IUserRepository, IUserService, User } from "types/UserTypes";
import { UserRepository } from "repositories/userRepositories";
import { UserService } from "services/userServices";

const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);

export const findUsers = async (req: Request, res: Response) => {
  try {
    const users: User[] = await userService.findUsers();
    if (users.length === 0)
      return res.status(404).json({ message: "No users found" });
    res.json(users);
  } catch (error) {
    console.log("Error fetching users: >> ", error);
    res.status(500).json(error);
  }
};

export const findUserById = async (req: Request, res: Response) => {
  try {
    const user: User | null = await userService.findUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.log("Error fetching user by ID: >> ", error);
    res.status(500).json(error);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user: User = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.log("Error creating user: >> ", error);
    res.status(400).json(error);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user: User | null = await userService.updateUser(
      req.params.id,
      req.body
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.log("Error updating user: >> ", error);
    res.status(500).json(error);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const success: boolean = await userService.deleteUser(req.params.id);
    if (!success) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error deleting user: >> ", error);
    res.status(500).json(error);
  }
};
```

**Controller Responsibilities:**

- **Request Validation**: Receive and validate HTTP request parameters and body
- **Service Delegation**: Call appropriate service methods
- **Response Formatting**: Format and send HTTP responses with proper status codes
- **Error Handling**: Catch and handle errors with meaningful messages
- **Status Codes**: Use appropriate HTTP status codes (201 for creation, 404 for not found, 500 for errors)

### 3. Role Type Definitions

#### src/types/RoleTypes.ts

Domain-specific interfaces for role management:

```typescript
import { IRepository } from "./RepositoryTypes";

export interface Role {
  name: string;
}

export interface IRoleRepository extends IRepository<Role> {}

export interface IRoleService {
  createRole(data: Role): Promise<Role>;
  findRoles(): Promise<Role[]>;
  findRoleById(id: string): Promise<Role | null>;
  updateRole(id: string, data: Partial<Role>): Promise<Role | null>;
  deleteRole(id: string): Promise<boolean>;
}
```

**Type Structure:**

- `Role`: Minimal entity with name property
- `IRoleRepository`: Extends generic repository interface
- `IRoleService`: Defines complete CRUD service contract

### 4. Role Mongoose Model

#### src/models/Roles.ts

Database schema for role persistence:

```typescript
import { Role } from "types/RoleTypes";
import mongoose, { Schema } from "mongoose";

const RoleSchema: Schema = new Schema<Role>(
  {
    name: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const RoleModel = mongoose.model<Role>("Role", RoleSchema);
```

**Schema Configuration:**

- `name`: Required string field for role name
- `timestamps: true`: Automatic `createdAt` and `updatedAt` fields
- `versionKey: false`: Removes MongoDB's `__v` version field

### 5. Role Repository Layer

#### src/repositories/roleRepositories.ts

Data access implementation for roles:

```typescript
import { RoleModel } from "models/Roles";
import { IRoleRepository, Role } from "types/RoleTypes";

export class RoleRepository implements IRoleRepository {
  async create(data: Role): Promise<Role> {
    const newRole = new RoleModel(data);
    return await newRole.save();
  }

  async find(): Promise<Role[]> {
    return await RoleModel.find().exec();
  }

  async findById(id: string): Promise<Role | null> {
    return await RoleModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Role>): Promise<Role | null> {
    return await RoleModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await RoleModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
```

**CRUD Methods:**

- `create()`: Insert new role document
- `find()`: Retrieve all roles
- `findById()`: Fetch single role by MongoDB ID
- `update()`: Modify role with new data
- `delete()`: Remove role from database

### 6. Role Service Layer

#### src/services/roleServices.ts

Business logic for role operations:

```typescript
import { IRoleService, Role, IRoleRepository } from "types/RoleTypes";

export class RoleService implements IRoleService {
  private rolesRepository: IRoleRepository;

  constructor(rolesRepository: IRoleRepository) {
    this.rolesRepository = rolesRepository;
  }

  async createRole(data: Role): Promise<Role> {
    return this.rolesRepository.create(data);
  }

  async findRoles(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async findRoleById(id: string): Promise<Role | null> {
    return this.rolesRepository.findById(id);
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role | null> {
    return this.rolesRepository.update(id, data);
  }

  async deleteRole(id: string): Promise<boolean> {
    return this.rolesRepository.delete(id);
  }
}
```

**Service Pattern:**

- Receives repository through constructor injection
- Delegates database operations to repository
- Can be extended with business logic (validation, calculations, etc.)

### 7. Role Controller Layer

#### src/controllers/rolesController.ts

Request handlers for role endpoints (same pattern as users):

```typescript
import { Request, Response } from "express";
import { IRoleRepository, IRoleService, Role } from "types/RoleTypes";
import { RoleRepository } from "repositories/roleRepositories";
import { RoleService } from "services/roleServices";

const roleRepository: IRoleRepository = new RoleRepository();
const roleService: IRoleService = new RoleService(roleRepository);

export const findRoles = async (req: Request, res: Response) => {
  try {
    const roles: Role[] = await roleService.findRoles();
    if (roles.length === 0)
      return res.status(404).json({ message: "No roles found" });
    res.json(roles);
  } catch (error) {
    console.log("Error fetching roles: >> ", error);
    res.status(500).json(error);
  }
};

export const findRoleById = async (req: Request, res: Response) => {
  try {
    const role: Role | null = await roleService.findRoleById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json(role);
  } catch (error) {
    console.log("Error fetching role by ID: >> ", error);
    res.status(500).json(error);
  }
};

// ... additional CRUD handlers (create, update, delete)
```

---

## Complete API Endpoints

### User Endpoints

| Method | Endpoint            | Handler        | Description        |
| ------ | ------------------- | -------------- | ------------------ |
| GET    | `/api/v1/users`     | `findUsers`    | Retrieve all users |
| GET    | `/api/v1/users/:id` | `findUserById` | Get specific user  |
| POST   | `/api/v1/users`     | `createUser`   | Create new user    |
| PUT    | `/api/v1/users/:id` | `updateUser`   | Update user        |
| DELETE | `/api/v1/users/:id` | `deleteUser`   | Delete user        |

### Role Endpoints

| Method | Endpoint            | Handler        | Description        |
| ------ | ------------------- | -------------- | ------------------ |
| GET    | `/api/v1/roles`     | `findRoles`    | Retrieve all roles |
| GET    | `/api/v1/roles/:id` | `findRoleById` | Get specific role  |
| POST   | `/api/v1/roles`     | `createRole`   | Create new role    |
| PUT    | `/api/v1/roles/:id` | `updateRole`   | Update role        |
| DELETE | `/api/v1/roles/:id` | `deleteRole`   | Delete role        |

### Health Check

| Method | Endpoint          | Description       |
| ------ | ----------------- | ----------------- |
| GET    | `/api/v1/healthy` | API health status |

---

## HTTP Test Files

### users.http

```http
### Create a new user
POST http://localhost:4000/api/v1/users HTTP/1.1
Content-Type: application/json

{
  "name": "Carlos Test",
  "username": "carlostest",
  "email": "carlostest@example.com"
}

### Get all users
GET http://localhost:4000/api/v1/users/ HTTP/1.1

### Get user by ID
GET http://localhost:4000/api/v1/users/694877a5012bb9c2c4c8d5e9 HTTP/1.1

### Update user
PUT http://localhost:4000/api/v1/users/694877a5012bb9c2c4c8d5e9 HTTP/1.1
Content-Type: application/json

{
  "name": "Lionel Andres Messi"
}

### Delete user
DELETE http://localhost:4000/api/v1/users/694877a5012bb9c2c4c8d5e9 HTTP/1.1
```

### roles.http

```http
### Create a new role
POST http://localhost:4000/api/v1/roles HTTP/1.1
Content-Type: application/json

{
  "name": "admin"
}

### Get all roles
GET http://localhost:4000/api/v1/roles/ HTTP/1.1

### Get role by ID
GET http://localhost:4000/api/v1/roles/694a1e4c48a2388b0c25aaff HTTP/1.1

### Update role
PUT http://localhost:4000/api/v1/roles/694a1e4c48a2388b0c25aaff HTTP/1.1
Content-Type: application/json

{
  "name": "super_admin"
}

### Delete role
DELETE http://localhost:4000/api/v1/roles/694a1e4c48a2388b0c25aaff HTTP/1.1
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   HTTP Requests                     │
└────────────────┬────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │   src/routes   │  (Route Definitions)
         └───────┬────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼──────────────┐  ┌──────▼──────────┐
│ User Controller  │  │ Role Controller │  (Request Handlers)
└───┬──────────────┘  └──────┬──────────┘
    │                         │
┌───▼──────────────┐  ┌──────▼──────────┐
│  User Service    │  │  Role Service   │  (Business Logic)
└───┬──────────────┘  └──────┬──────────┘
    │                         │
┌───▼──────────────┐  ┌──────▼──────────┐
│User Repository   │  │Role Repository  │  (Data Access)
└───┬──────────────┘  └──────┬──────────┘
    │                         │
    └──────────┬──────────────┘
               │
        ┌──────▼──────┐
        │  MongoDB    │  (Persistent Storage)
        └─────────────┘
```

---

## Benefits of Controller Layer

1. **Separation of Concerns**: Routes define endpoints, controllers handle HTTP logic
2. **Code Reusability**: Controller functions can be reused and tested independently
3. **Maintainability**: Business logic separated from request handling
4. **Error Handling**: Centralized error management with try-catch blocks
5. **Consistency**: Uniform response format and status code usage across endpoints
6. **Testability**: Controllers can be unit tested with mock services
7. **Scalability**: Easy to add new entities with the same pattern

---

## Comparing User and Role Implementations

Both user and role modules follow identical architectural patterns:

| Layer      | Users                 | Roles                 |
| ---------- | --------------------- | --------------------- |
| Types      | `UserTypes.ts`        | `RoleTypes.ts`        |
| Model      | `Users.ts`            | `Roles.ts`            |
| Repository | `userRepositories.ts` | `roleRepositories.ts` |
| Service    | `userServices.ts`     | `roleServices.ts`     |
| Controller | `usersController.ts`  | `rolesController.ts`  |

This consistency makes it easy to add new entities by following the same pattern.

---
