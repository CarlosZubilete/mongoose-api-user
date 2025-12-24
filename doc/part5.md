# Part 5: Authentication, Authorization, and Posts Module

**Branch:** `branch5`

## Overview

This document details the implementation of authentication and authorization mechanisms using JWT (JSON Web Tokens), password security with bcrypt, middleware for protected routes, environment variable management improvements, and the introduction of a complete Posts module. This branch adds essential security features and introduces a new content management feature to the API.

---

## Changes Summary

### Files Modified

| File                                   | Change Type | Description                                           |
| -------------------------------------- | ----------- | ----------------------------------------------------- |
| `package.json`                         | Modified    | Added bcrypt, JWT, and TypeScript type definitions    |
| `src/app.ts`                           | Modified    | Refactored to use centralized secrets management      |
| `src/models/Users.ts`                  | Modified    | Added password field and encryption hooks             |
| `src/types/UserTypes.ts`               | Modified    | Extended User interface with password and methods     |
| `src/types/RepositoryTypes.ts`         | Modified    | Added Query type and query parameter support          |
| `src/repositories/userRepositories.ts` | Modified    | Added findOne method for flexible queries             |
| `src/services/userServices.ts`         | Modified    | Added findUserByEmail method                          |
| `src/routes/routes.ts`                 | Modified    | Added auth and post routes with middleware protection |
| `users.http`                           | Modified    | Updated test requests                                 |
| `roles.http`                           | Modified    | Updated test requests                                 |

### Files Created

| File                                   | Purpose                                     |
| -------------------------------------- | ------------------------------------------- |
| `src/secrets.ts`                       | Centralized environment variable management |
| `src/middlewares/auth.ts`              | JWT token verification middleware           |
| `src/controllers/authControllers.ts`   | User registration and login handlers        |
| `src/types/PostTypes.ts`               | Post interfaces and type definitions        |
| `src/models/Posts.ts`                  | Mongoose schema for posts                   |
| `src/repositories/postRepositories.ts` | Post data access layer                      |
| `src/services/postServices.ts`         | Post business logic layer                   |
| `src/controllers/postsControllers.ts`  | Post CRUD operation handlers                |
| `@types/`                              | Custom TypeScript type declarations         |
| `auth.http`                            | HTTP test requests for authentication       |
| `posts.http`                           | HTTP test requests for posts                |
| `doc/part5.md`                         | Technical documentation                     |

---

## Detailed Changes

### 1. Environment Variables Management

#### src/secrets.ts

Centralized configuration for environment variables:

```typescript
import dotenv from "dotenv";

// only load .env in non-production environments
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env" });
}

export const PORT: string = process.env.PORT!;
export const SALT_ROUND: string = process.env.SALT_ROUND!;
export const JWT_SECRET: string = process.env.JWT_SECRET!;
export const NODE_ENV: string = process.env.NODE_ENV!;
```

**Key Features:**

- Conditional loading of `.env` file (production uses process env only)
- Centralized variable exports with non-null assertion (`!`)
- Environment-aware configuration management
- Easy to add new environment variables

**Required .env Variables:**

```env
PORT=4000
NODE_ENV=development
SALT_ROUND=12
JWT_SECRET=your_secret_key_here
MONGODB_URL_STRING=mongodb+srv://...
```

### 2. Application Entry Point Refactoring

#### src/app.ts

Updated to use centralized secrets:

**Before:**

```typescript
import dotenv from "dotenv";
dotenv.config();
const PORT: string | number = process.env.PORT || 4000;
```

**After:**

```typescript
import { PORT } from "secrets";
// dotenv removed from here - handled in secrets.ts
```

**Benefits:**

- Single source of truth for configuration
- Cleaner app.ts file
- Easier to manage secrets across the application

### 3. User Authentication Enhancement

#### src/models/Users.ts

Extended with password field and security hooks:

```typescript
import { User } from "types/UserTypes";
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const UserSchema: Schema = new Schema<User>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash password before saving
UserSchema.pre<User>("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
  }
  // next();
});

// Instance method to compare passwords
UserSchema.method(
  "comparePassword",
  async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password as string);
  }
);

// Hide password in JSON responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const UserModel = mongoose.model<User>("User", UserSchema);
```

**Security Features:**

- **Password Hashing**: bcrypt with 12 salt rounds before saving
- **Pre-save Hook**: Automatically hashes password on creation/modification
- **Password Comparison**: Instance method to verify passwords during login
- **Password Exclusion**: Automatically removed from JSON responses

### 4. Extended User Type Definitions

#### src/types/UserTypes.ts

Enhanced with password field and authentication methods:

```typescript
import { Document } from "mongoose";
import { IRepository, Query } from "./RepositoryTypes";

export interface User extends Document {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  comparePassword(password: string): Promise<boolean>;
}

export interface IUserRepository extends IRepository<User> {
  findOne(query: Query): Promise<User | null>;
}

export interface IUserService {
  createUser(data: User): Promise<User>;
  findUsers(query?: Query): Promise<User[]>;
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
}
```

**New Additions:**

- `password` field for authentication
- `comparePassword()` method for login verification
- `findOne(query)` method in repository for flexible queries
- `findUserByEmail()` method in service for email-based lookups

### 5. Generic Repository Type Enhancement

#### src/types/RepositoryTypes.ts

Added Query type and query parameter support:

```typescript
export type Query = Record<string, unknown>;

export interface IRepository<T = unknown> {
  create(data: T): Promise<T>;
  find(query?: Query): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
```

**Key Changes:**

- `Query` type for flexible MongoDB queries
- `find()` now accepts optional query parameter
- Enables filtering on list operations

### 6. Enhanced User Repository

#### src/repositories/userRepositories.ts

Added `findOne()` method for flexible queries:

```typescript
import { UserModel } from "models/Users";
import { Query } from "types/RepositoryTypes";
import { IUserRepository, User } from "types/UserTypes";

export class UserRepository implements IUserRepository {
  async create(data: User): Promise<User> {
    const newUser = new UserModel(data);
    return await newUser.save();
  }

  async find(query?: Query): Promise<User[]> {
    return await UserModel.find(query || {}).exec();
  }

  async findOne(query: Query): Promise<User | null> {
    return await UserModel.findOne(query).exec();
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

### 7. Enhanced User Service

#### src/services/userServices.ts

Added email-based user lookup:

```typescript
import { Query } from "types/RepositoryTypes";
import { IUserRepository, IUserService, User } from "types/UserTypes";

export class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(data: User): Promise<User> {
    return this.userRepository.create(data);
  }

  async findUsers(query?: Query): Promise<User[]> {
    return this.userRepository.find(query);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ email });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}
```

### 8. JWT Authentication Middleware

#### src/middlewares/auth.ts

Token verification and user attachment:

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRepository } from "@repositories/userRepositories";
import { UserService } from "@services/userServices";
import { JWT_SECRET } from "secrets";
import { IUserRepository, IUserService, User } from "types/UserTypes";

const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace(/Bearer\s+/, "") as string;

  try {
    const verify = jwt.verify(token, JWT_SECRET) as User;

    const getUser = await userService.findUserById(verify.id);
    if (!getUser) return res.status(400);
    req.currentUser = getUser;

    next();
  } catch (error: any) {
    console.log("Error verifying token: >> ", error);
    return res.status(401).send(error.message);
  }
};
```

**Middleware Features:**

- Extracts JWT from `Authorization` header (Bearer token)
- Verifies token signature with `JWT_SECRET`
- Retrieves user from database using token payload
- Attaches user to `req.currentUser` for downstream handlers
- Returns 401 Unauthorized if token invalid
- Calls `next()` to continue request chain

### 9. Authentication Controller

#### src/controllers/authControllers.ts

User registration and login handlers:

```typescript
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "secrets";
import { UserRepository } from "@repositories/userRepositories";
import { UserService } from "@services/userServices";
import { IUserRepository, IUserService, User } from "types/UserTypes";

const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email }: User = req.body;
    const userExists: User | null = await userService.findUserByEmail(email);
    if (userExists)
      return res.status(409).json({ message: "Email already in use" });

    const user: User = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.log("Error registering user: >> ", error);
    res.status(500).json(error);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password }: User = req.body;
    const user: User | null = await userService.findUserByEmail(email);
    if (!user)
      return res.status(400).json({ message: "Invalid user or password" });

    const hashMatch = await user.comparePassword(password);
    if (!hashMatch)
      return res.status(400).json({ message: "Invalid user or password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.log("Error logging in user: >> ", error);
    res.status(500).json(error);
  }
};
```

**Features:**

- **Registration**: Creates user after email uniqueness check
- **Login**: Verifies email/password and issues JWT token
- **Token Expiration**: JWT expires after 1 hour
- **Error Handling**: Returns appropriate HTTP status codes

### 10. Post Type Definitions

#### src/types/PostTypes.ts

Content management interfaces:

```typescript
import { IRepository, Query } from "./RepositoryTypes";

export interface Post {
  title: string;
  description?: string;
  content?: string;
  featuredImageUrl?: string;
  author: string;
}

export interface IPostRepository extends IRepository<Post> {}

export interface IPostService {
  createPost(data: Post): Promise<Post>;
  findPosts(query?: Query): Promise<Post[]>;
  findPostById(id: string): Promise<Post | null>;
  updatePost(id: string, data: Partial<Post>): Promise<Post | null>;
  deletePost(id: string): Promise<boolean>;
}
```

### 11. Post Mongoose Model

#### src/models/Posts.ts

Database schema for blog posts:

```typescript
import mongoose, { Schema } from "mongoose";
import { Post } from "types/PostTypes";

const PostsSchema: Schema = new Schema<Post>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    content: { type: String },
    featuredImageUrl: { type: String },
    authorId: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PostsModel = mongoose.model<Post>("Posts", PostsSchema);
```

### 12. Posts Repository

#### src/repositories/postRepositories.ts

Data access for posts (standard CRUD pattern).

### 13. Posts Service

#### src/services/postServices.ts

Business logic for post operations (standard service pattern).

### 14. Posts Controller

#### src/controllers/postsControllers.ts

Request handlers for post operations with error management and protection middleware.

---

## Updated Route Architecture

### src/routes/routes.ts

Complete routing structure with authentication:

```typescript
export default () => {
  // Health Check
  router.get("/healthy", (_, res: Response) => {
    res.send("Api is healthy");
  });

  // * Authentication Routes (PUBLIC)
  router.post("/auth/register", registerUser);
  router.post("/auth/login", loginUser);

  // * User Routes (PROTECTED)
  router.get("/users", verifyToken, findUsers);
  router.get("/users/:id", verifyToken, findUserById);
  router.post("/users", verifyToken, createUser);
  router.put("/users/:id", verifyToken, updateUser);
  router.delete("/users/:id", verifyToken, deleteUser);

  // * Role Routes (PROTECTED)
  router.get("/roles", verifyToken, findRoles);
  router.get("/roles/:id", verifyToken, findRoleById);
  router.post("/roles", verifyToken, createRole);
  router.put("/roles/:id", verifyToken, updateRole);
  router.delete("/roles/:id", verifyToken, deleteRole);

  // * Post Routes (MIXED PROTECTION)
  router.get("/posts", findPosts); // PUBLIC
  router.get("/posts/:id", findPostById); // PUBLIC
  router.post("/posts", verifyToken, createPost); // PROTECTED
  router.put("/posts/:id", updatePost); // UNPROTECTED
  router.delete("/posts/:id", deletePost); // UNPROTECTED

  return router;
};
```

---

## Complete API Endpoints with Authentication

### Authentication Endpoints (PUBLIC)

| Method | Endpoint                | Handler        | Description                        |
| ------ | ----------------------- | -------------- | ---------------------------------- |
| POST   | `/api/v1/auth/register` | `registerUser` | Create new user account            |
| POST   | `/api/v1/auth/login`    | `loginUser`    | Authenticate and receive JWT token |

### User Endpoints (PROTECTED)

| Method | Endpoint            | Handler        | Protection   | Description        |
| ------ | ------------------- | -------------- | ------------ | ------------------ |
| GET    | `/api/v1/users`     | `findUsers`    | JWT Required | Retrieve all users |
| GET    | `/api/v1/users/:id` | `findUserById` | JWT Required | Get specific user  |
| POST   | `/api/v1/users`     | `createUser`   | JWT Required | Create new user    |
| PUT    | `/api/v1/users/:id` | `updateUser`   | JWT Required | Update user        |
| DELETE | `/api/v1/users/:id` | `deleteUser`   | JWT Required | Delete user        |

### Role Endpoints (PROTECTED)

| Method | Endpoint            | Handler        | Protection   | Description        |
| ------ | ------------------- | -------------- | ------------ | ------------------ |
| GET    | `/api/v1/roles`     | `findRoles`    | JWT Required | Retrieve all roles |
| GET    | `/api/v1/roles/:id` | `findRoleById` | JWT Required | Get specific role  |
| POST   | `/api/v1/roles`     | `createRole`   | JWT Required | Create new role    |
| PUT    | `/api/v1/roles/:id` | `updateRole`   | JWT Required | Update role        |
| DELETE | `/api/v1/roles/:id` | `deleteRole`   | JWT Required | Delete role        |

### Post Endpoints (MIXED)

| Method | Endpoint            | Handler        | Protection   | Description        |
| ------ | ------------------- | -------------- | ------------ | ------------------ |
| GET    | `/api/v1/posts`     | `findPosts`    | None         | Retrieve all posts |
| GET    | `/api/v1/posts/:id` | `findPostById` | None         | Get specific post  |
| POST   | `/api/v1/posts`     | `createPost`   | JWT Required | Create new post    |
| PUT    | `/api/v1/posts/:id` | `updatePost`   | None         | Update post        |
| DELETE | `/api/v1/posts/:id` | `deletePost`   | None         | Delete post        |

---

## Authentication Flow

```
1. USER REGISTRATION
   POST /auth/register
   Body: { name, username, email, password }
   ↓
   → Check email uniqueness
   → Hash password with bcrypt
   → Save user to MongoDB
   → Return user (without password)

2. USER LOGIN
   POST /auth/login
   Body: { email, password }
   ↓
   → Find user by email
   → Compare password with bcrypt
   → Generate JWT token (1h expiration)
   → Return { token }

3. PROTECTED REQUEST
   GET /users
   Headers: { Authorization: "Bearer <token>" }
   ↓
   → Extract token from header
   → Verify JWT signature
   → Decode and get user ID
   → Fetch user from database
   → Attach user to req.currentUser
   → Continue to handler
```

---

## HTTP Test Examples

### auth.http - Authentication

```http
### Register new user
POST http://localhost:4000/api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}

### Login user
POST http://localhost:4000/api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### users.http - Protected User Operations

```http
### Get all users (requires token)
GET http://localhost:4000/api/v1/users
Authorization: Bearer <your_jwt_token_here>

### Create user (requires token)
POST http://localhost:4000/api/v1/users
Authorization: Bearer <your_jwt_token_here>
Content-Type: application/json

{
  "name": "Jane Doe",
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "anotherpassword123"
}
```

### posts.http - Public and Protected Posts

```http
### Get all posts (PUBLIC)
GET http://localhost:4000/api/v1/posts

### Create post (PROTECTED - requires token)
POST http://localhost:4000/api/v1/posts
Authorization: Bearer <your_jwt_token_here>
Content-Type: application/json

{
  "title": "My First Post",
  "description": "A short description",
  "content": "Full post content here...",
  "author": "John Doe"
}
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "bcrypt": "6.0.0",
    "jsonwebtoken": "^9.0.3"
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0",
    "@types/jsonwebtoken": "^9.0.10"
  }
}
```

---

## Security Best Practices Implemented

1. ✅ **Password Hashing**: bcrypt with 12 salt rounds
2. ✅ **JWT Tokens**: Secure token-based authentication
3. ✅ **Token Expiration**: 1-hour token validity
4. ✅ **Password Exclusion**: Never sent in responses
5. ✅ **Route Protection**: Middleware guards sensitive endpoints
6. ✅ **Bearer Token**: Standard HTTP Authorization header format
7. ✅ **Email Uniqueness**: Prevents duplicate accounts
8. ✅ **Environment Variables**: Secrets not hardcoded

---

## Request/Response Examples

### Registration Success (201)

```json
{
  "_id": "65a2b3c4d5e6f7g8h9i0j1k2",
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2025-12-24T10:30:00Z",
  "updatedAt": "2025-12-24T10:30:00Z"
}
```

### Login Success (200)

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Protected Resource Success (200)

```json
{
  "_id": "65a2b3c4d5e6f7g8h9i0j1k2",
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com"
}
```

### Authorization Error (401)

```json
{
  "message": "jwt malformed"
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   HTTP Requests                         │
└────────────────┬────────────────────────────────────────┘
                 │
       ┌─────────▼──────────┐
       │   Routing Layer    │
       │ (src/routes.ts)    │
       └─────────┬──────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼──────┐ ┌──▼────┐ ┌─────▼──┐
│   Auth   │ │ Users │ │  Posts │
│Controller│ │Ctrl   │ │ Ctrl   │
└───┬──────┘ └──┬────┘ └─────┬──┘
    │           │            │
    │      ┌────▼────┐       │
    │      │ JWT Middleware │◄─┘
    │      │(verifyToken)   │
    │      └────┬────┘       │
    │           │            │
    ├───────────┼────────────┤
    │           │            │
┌───▼──────┐ ┌─▼────────┐ ┌─▼───────┐
│   Auth   │ │ Services │ │Services │
│Service   │ │(User/    │ │(Post)   │
│          │ │ Role)    │ │         │
└───┬──────┘ └─┬────────┘ └─┬───────┘
    │          │            │
    ├──────────┼────────────┤
    │          │            │
┌───▼──────────▼────────────▼─────────┐
│      Repository Layer               │
│ (User/Role/Post Repositories)       │
└───┬──────────────────────────────────┘
    │
    └────────────┬────────────────┐
                 │                │
            ┌────▼─────┐    ┌─────▼─────┐
            │  MongoDB  │    │  Security │
            │           │    │(bcrypt,   │
            │           │    │JWT)       │
            └───────────┘    └───────────┘
```

---
