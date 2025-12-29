# Part 6: Role-Based Access Control (RBAC) Implementation

**Branch:** `branch6`

## Overview

This document details the implementation of Role-Based Access Control (RBAC) system with granular permission management. This branch introduces role-to-user relationships, permission-based authorization middleware, and a flexible permissions system that controls API access based on HTTP methods, scopes, and user roles.

---

## Changes Summary

### Files Modified

| File                                   | Change Type | Description                                           |
| -------------------------------------- | ----------- | ----------------------------------------------------- |
| `src/types/UserTypes.ts`               | Modified    | Added roles and permissions arrays to User            |
| `src/types/RoleTypes.ts`               | Modified    | Extended Role with permissions array and Document     |
| `src/models/Users.ts`                  | Modified    | Added permissions array and roles relationship        |
| `src/models/Roles.ts`                  | Modified    | Added permissions array and unique constraint on name |
| `src/repositories/userRepositories.ts` | Modified    | Added `.populate("roles")` to all queries             |
| `src/middlewares/auth.ts`              | Modified    | Added `getPermissions` middleware for authorization   |
| `src/routes/routes.ts`                 | Modified    | Applied RBAC middlewares to all protected routes      |
| `auth.http`                            | Modified    | Updated authentication test requests                  |
| `posts.http`                           | Modified    | Updated post endpoint test requests                   |
| `roles.http`                           | Modified    | Updated role endpoint test requests                   |
| `users.http`                           | Modified    | Updated user endpoint test requests                   |

### Files Created

| File                            | Purpose                                   |
| ------------------------------- | ----------------------------------------- |
| `src/types/PermissionsTypes.ts` | Permission enums and constants            |
| `src/middlewares/roles.ts`      | Role assignment and validation middleware |
| `doc/part6.md`                  | Technical documentation                   |

---

## Detailed Changes

### 1. Permission Type Definitions

#### src/types/PermissionsTypes.ts

Enum-based permission system:

```typescript
export enum Method {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export enum Scope {
  Read = "read",
  Write = "write",
  Update = "update",
  Delete = "delete",
}

export const permissions = [
  {
    method: Method.GET,
    scope: Scope.Read,
    permissions: ["admin_granted"],
  },
  {
    method: Method.POST,
    scope: Scope.Write,
    permissions: ["admin_granted"],
  },
  {
    method: Method.PUT,
    scope: Scope.Update,
    permissions: ["admin_granted"],
  },
  {
    method: Method.DELETE,
    scope: Scope.Delete,
    permissions: ["admin_granted"],
  },
];
```

**Key Concepts:**

- **Method Enum**: Maps HTTP methods (GET, POST, PUT, DELETE)
- **Scope Enum**: Defines operation types (read, write, update, delete)
- **Permissions Array**: Default permissions for each HTTP method/scope combination
- **Permission Naming Convention**: `{module}_{scope}` (e.g., `users_read`, `posts_write`)

### 2. Extended Role Type

#### src/types/RoleTypes.ts

Role now includes permission array:

**Before:**

```typescript
export interface Role {
  name: string;
}
```

**After:**

```typescript
import { Document } from "mongoose";

export interface Role extends Document {
  name: string;
  permissions: string[];
}
```

**Changes:**

- `extends Document`: Enables MongoDB document features
- `permissions` array: Stores assigned permission strings for the role

### 3. Role Mongoose Model

#### src/models/Roles.ts

Updated schema with permissions:

**Before:**

```typescript
const RoleSchema: Schema = new Schema<Role>(
  {
    name: { type: String, required: true },
  }
  // ...
);
```

**After:**

```typescript
const RoleSchema: Schema = new Schema<Role>(
  {
    name: { type: String, required: true, unique: true },
    permissions: { type: [String], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

**Schema Updates:**

- `unique: true` on name: Prevents duplicate role names
- `permissions` array: Stores permission strings with empty default
- Maintains timestamps for audit tracking

### 4. Extended User Type

#### src/types/UserTypes.ts

User now includes role relationships and permissions:

**Before:**

```typescript
export interface User extends Document {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  comparePassword(password: string): Promise<boolean>;
}
```

**After:**

```typescript
import { Role } from "./RoleTypes";

export interface User extends Document {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  comparePassword(password: string): Promise<boolean>;
  roles?: Role[];
  permissions?: string[];
}
```

**Additions:**

- `roles`: Array of Role objects assigned to user
- `permissions`: Direct permissions array for granular control

### 5. User Mongoose Model

#### src/models/Users.ts

User schema with role references:

**Before:**

```typescript
const UserSchema: Schema = new Schema<User>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, trim: true },
  }
  // ...
);
```

**After:**

```typescript
const UserSchema: Schema = new Schema<User>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, trim: true },
    permissions: { type: [String], default: [] },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

**Schema Additions:**

- `permissions` array: Direct permission assignment
- `roles` array: References to Role documents (Foreign Key relationship)
- `ref: "Role"`: Enables `.populate("roles")` for document joining

### 6. Enhanced User Repository

#### src/repositories/userRepositories.ts

Added `.populate("roles")` to all query methods:

**Before:**

```typescript
async find(query?: Query): Promise<User[]> {
  return await UserModel.find(query || {}).exec();
}

async findById(id: string): Promise<User | null> {
  return await UserModel.findById(id).exec();
}
```

**After:**

```typescript
async find(query?: Query): Promise<User[]> {
  return await UserModel.find(query || {})
    .populate("roles")
    .exec();
}

async findOne(query: Query): Promise<User | null> {
  return await UserModel.findOne(query).populate("roles").exec();
}

async findById(id: string): Promise<User | null> {
  return await UserModel.findById(id).populate("roles").exec();
}

async update(id: string, data: Partial<User>): Promise<User | null> {
  return await UserModel.findByIdAndUpdate(id, data, { new: true })
    .populate("roles")
    .exec();
}
```

**Key Feature:**

- `.populate("roles")`: Automatically fetches complete Role objects from database
- Applied to all query methods for consistency
- Enables access to role permissions in middleware

### 7. Role Middleware

#### src/middlewares/roles.ts

Role assignment and validation middleware:

```typescript
import { Request, Response, NextFunction } from "express";
import { RoleService } from "@services/roleServices";
import { RoleRepository } from "@repositories/roleRepositories";
import { IRoleRepository, IRoleService, Role } from "types/RoleTypes";

const roleRepository: IRoleRepository = new RoleRepository();
const roleService: IRoleService = new RoleService(roleRepository);

export const checkRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract roles from request body or default to "user"
  const roles: string[] = req.body && req.body?.roles ? req.body.roles : [];
  const role = Array.isArray(roles) && roles.length !== 0 ? roles : ["user"];

  try {
    // Find Role documents matching provided role names
    const findRoles: Role[] = await roleService.findRoles({
      name: { $in: role },
    });

    if (findRoles.length === 0) return res.status(404).send("No roles found");

    // Convert Role documents to their MongoDB IDs
    req.body.roles = findRoles.map((r) => r._id);

    next();
  } catch (error) {
    console.log("Error in role checking middleware:", error);
    return res.status(500).json(error);
  }
};
```

**Functionality:**

- **Role Extraction**: Gets roles from request body or defaults to "user"
- **Role Validation**: Verifies roles exist in database
- **ID Conversion**: Converts role names to MongoDB ObjectIds
- **Request Enhancement**: Attaches resolved role IDs for saving to user

### 8. Permission Authorization Middleware

#### src/middlewares/auth.ts

Extended with `getPermissions` function:

```typescript
export const getPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Extract current user, HTTP method, and request path
  const {
    currentUser,
    method,
    path,
  }: { currentUser: User; method: string; path: string } = req;

  console.log("Current User Permissions: >> ", currentUser);

  // 2. Extract module name from request path
  const currentModule = path.replace(/^\/([^\/]+).*/, "$1");
  // e.g., "/users" → "users", "/posts/123" → "posts"

  // 3. Find the permission configuration for current HTTP method
  const findMethod = permissions.find(
    (pm) => pm.method === Method[method as keyof typeof Method]
  );

  // 4. Build required permission string
  if (
    !findMethod?.permissions.includes(`${currentModule}_${findMethod.scope}`)
  ) {
    findMethod?.permissions.push(`${currentModule}_${findMethod.scope}`);
  }

  // 5. Extract user's role permissions
  const { roles }: { roles?: Role[] | undefined } = currentUser;

  // 6. Flatten all role permissions into a single set
  const rolesPermissions: string[][] | undefined = roles?.map(
    (role) => role.permissions
  );
  const flatPermissions: string[] | undefined = rolesPermissions?.flat();
  const mergedPermissions: Set<string> | undefined = new Set(flatPermissions);

  console.log("User Roles mergedPermissions: >> ", mergedPermissions);

  // 7. Check if user has any required permission
  const permissionGranted = findMethod?.permissions.find((permission) =>
    mergedPermissions?.has(permission)
  );

  console.log("Permission Granted: >> ", permissionGranted);

  // 8. Return 403 if no permission found
  if (!permissionGranted)
    return res.status(403).send("Access denied. No permission.");

  next();
};
```

**Authorization Flow:**

1. Extract current user from request (attached by `verifyToken`)
2. Determine HTTP method and request path
3. Extract module name from path (e.g., "users", "posts")
4. Find permission definition for method/scope
5. Retrieve roles assigned to user
6. Extract and flatten all permissions from user's roles
7. Check if user has any required permission
8. Return 403 Forbidden if no matching permission

### 9. Updated Route Architecture

#### src/routes/routes.ts

All routes now include permission authorization:

**Before:**

```typescript
router.get("/users", verifyToken, findUsers);
router.post("/users", verifyToken, createUser);
```

**After:**

```typescript
router.get("/users", verifyToken, getPermissions, findUsers);
router.post("/users", verifyToken, checkRoles, createUser);
router.put("/users/:id", verifyToken, getPermissions, updateUser);
router.delete("/users/:id", verifyToken, getPermissions, deleteUser);
```

**Route Protection Pattern:**

- `verifyToken`: Authenticates user (JWT validation)
- `checkRoles`: Validates and assigns roles (on POST/create)
- `getPermissions`: Authorizes based on user roles (on read/update/delete)

**Complete Route Configuration:**

| Endpoint            | Auth | Role Check | Permission | Purpose                           |
| ------------------- | ---- | ---------- | ---------- | --------------------------------- |
| POST /auth/register | -    | ✓          | -          | Register with role assignment     |
| POST /auth/login    | -    | -          | -          | Login (public)                    |
| GET /users          | ✓    | -          | ✓          | List users (permission required)  |
| POST /users         | ✓    | ✓          | -          | Create user (role assignment)     |
| PUT /users/:id      | ✓    | -          | ✓          | Update user (permission required) |
| DELETE /users/:id   | ✓    | -          | ✓          | Delete user (permission required) |
| GET /posts          | ✓    | -          | ✓          | List posts (permission required)  |
| POST /posts         | ✓    | -          | ✓          | Create post (permission required) |

---

## Request/Response Flow

### User Registration with Role Assignment

**Request:**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Admin",
  "username": "johnadmin",
  "email": "admin@example.com",
  "password": "securePassword123",
  "roles": ["admin"]
}
```

**Middleware Chain:**

1. `checkRoles` middleware:

   - Validates "admin" role exists
   - Retrieves admin role document
   - Converts to MongoDB ID
   - Attaches to `req.body.roles`

2. `registerUser` controller:
   - Creates user with role IDs
   - User saved with `roles: [ObjectId]`
   - Returns user with populated roles

**Response (201):**

```json
{
  "_id": "65a2b3c4d5e6f7g8h9i0j1k2",
  "name": "John Admin",
  "username": "johnadmin",
  "email": "admin@example.com",
  "permissions": [],
  "roles": [
    {
      "_id": "65a1a1a1a1a1a1a1a1a1a1a1",
      "name": "admin",
      "permissions": ["users_read", "users_write", "posts_read", "posts_write"],
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z"
    }
  ],
  "createdAt": "2025-12-28T10:30:00Z",
  "updatedAt": "2025-12-28T10:30:00Z"
}
```

### Protected Request with Permission Authorization

**Request:**

```http
GET /api/v1/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Middleware Chain:**

1. `verifyToken`:

   - Validates JWT signature
   - Decodes token payload
   - Fetches user from database (with `.populate("roles")`)
   - Attaches full user object to `req.currentUser`

2. `getPermissions`:

   - Extracts user's roles: `[{ name: "admin", permissions: [...] }]`
   - HTTP method: GET, Path: "/users" → Module: "users"
   - Permission needed: `users_read`
   - Flattens all role permissions into Set
   - Checks: `mergedPermissions.has("users_read")`
   - If match found → `next()` (continue to handler)
   - If no match → 403 Forbidden

3. `findUsers` controller:
   - Retrieves and returns user list

**Response (200):**

```json
[
  {
    "_id": "65a2b3c4d5e6f7g8h9i0j1k2",
    "name": "John Admin",
    "username": "johnadmin",
    "email": "admin@example.com",
    "roles": [
      {
        "_id": "65a1a1a1a1a1a1a1a1a1a1a1",
        "name": "admin",
        "permissions": [
          "users_read",
          "users_write",
          "posts_read",
          "posts_write"
        ]
      }
    ]
  }
]
```

---

## Permission Model Example

### Role Definition in Database

```json
{
  "_id": ObjectId("65a1a1a1a1a1a1a1a1a1a1a1"),
  "name": "admin",
  "permissions": [
    "users_read",
    "users_write",
    "users_update",
    "users_delete",
    "posts_read",
    "posts_write",
    "posts_update",
    "posts_delete",
    "roles_read",
    "roles_write",
    "roles_update",
    "roles_delete"
  ],
  "createdAt": ISODate("2025-12-28T10:00:00Z"),
  "updatedAt": ISODate("2025-12-28T10:00:00Z")
}
```

### User with Multiple Roles

```json
{
  "_id": ObjectId("65a2b3c4d5e6f7g8h9i0j1k2"),
  "name": "Jane Moderator",
  "username": "janemod",
  "email": "moderator@example.com",
  "password": "$2b$12$...",
  "permissions": [],
  "roles": [
    ObjectId("65a1a1a1a1a1a1a1a1a1a1a1"),  // admin role
    ObjectId("65a2a2a2a2a2a2a2a2a2a2a2")   // moderator role
  ],
  "createdAt": ISODate("2025-12-28T10:30:00Z"),
  "updatedAt": ISODate("2025-12-28T10:30:00Z")
}
```

**Merged Permissions When User Logs In:**

- From admin role: `["users_read", "users_write", ..., "roles_delete"]`
- From moderator role: `["posts_moderate", "comments_delete"]`
- Final Set: Union of all role permissions

---

## Middleware Stack Visualization

```
HTTP Request
    │
    ├─ verifyToken (auth.ts)
    │  └─ Validates JWT
    │  └─ Fetches user with .populate("roles")
    │  └─ Attaches req.currentUser
    │
    ├─ checkRoles (roles.ts) [Only on POST/create]
    │  └─ Validates role names
    │  └─ Resolves to MongoDB IDs
    │  └─ Attaches to req.body.roles
    │
    ├─ getPermissions (auth.ts) [On read/update/delete]
    │  └─ Extracts module from path
    │  └─ Gets HTTP method scope
    │  └─ Flattens user role permissions
    │  └─ Checks permission match
    │  └─ Returns 403 if denied
    │
    └─ Route Handler (Controller)
       └─ Executes business logic
```

---

## Permission String Conventions

### Format: `{module}_{scope}`

**Modules:**

- `users` - User management operations
- `roles` - Role management operations
- `posts` - Post/content operations
- `comments` - Comment operations
- `auth` - Authentication operations

**Scopes:**

- `read` - GET requests (retrieve data)
- `write` - POST requests (create data)
- `update` - PUT requests (modify data)
- `delete` - DELETE requests (remove data)

**Examples:**

- `users_read` - Read user data
- `users_write` - Create new users
- `posts_update` - Modify posts
- `roles_delete` - Remove roles

---

## HTTP Status Codes

| Code | Scenario                 | Middleware                |
| ---- | ------------------------ | ------------------------- |
| 200  | Request successful       | Controller                |
| 201  | Resource created         | Controller                |
| 400  | Invalid credentials      | loginUser                 |
| 401  | Invalid/missing JWT      | verifyToken               |
| 403  | Insufficient permissions | getPermissions            |
| 404  | Resource not found       | Controller/checkRoles     |
| 500  | Server error             | Any middleware/controller |

---

## Key Improvements in Branch6

- ✅ **Role-Based Access Control**: Granular permission system
- ✅ **User-Role Relationships**: Many-to-many relationship via MongoDB refs
- ✅ **Permission Inheritance**: Users inherit permissions from roles
- ✅ **Dynamic Authorization**: Runtime permission checking
- ✅ **Flexible Permission Strings**: Convention-based naming
- ✅ **Middleware Composition**: Layered authentication and authorization
- ✅ **Data Denormalization**: Permissions stored in roles for performance
- ✅ **Admin Role Support**: Default admin role with full permissions

---
