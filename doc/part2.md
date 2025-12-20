# Part 2: Repository Pattern Implementation and Dependency Injection

**Branch:** `branch2`

## Overview

This document outlines the implementation of the Repository Pattern and Dependency Injection (DI) in the user management module. These architectural patterns promote code maintainability, testability, and separation of concerns.

---

## Changes Summary

### Files Modified

| File                   | Change Type | Description                                               |
| ---------------------- | ----------- | --------------------------------------------------------- |
| `src/routes/routes.ts` | Modified    | Enhanced with dependency injection and new user endpoints |

### Files Created

| File                                   | Purpose                                  |
| -------------------------------------- | ---------------------------------------- |
| `src/types/RepositoryTypes.ts`         | Generic repository interface definitions |
| `src/types/UserTypes.ts`               | User domain interfaces and types         |
| `src/repositories/userRepositories.ts` | User repository implementation           |
| `src/services/userServices.ts`         | User business logic service layer        |
| `doc/part2.md`                         | Technical documentation                  |
| `request.http`                         | HTTP request testing file (REST Client)  |

---

## Detailed Changes

### 1. Type Definitions

#### RepositoryTypes.ts

A generic repository interface that defines the contract for all data access operations:

```typescript
export interface IRepository<T = unknown> {
  create(data: T): Promise<T>;
  find(): Promise<T[]>;
}
```

**Purpose:** Provides a reusable template for repository implementations, enabling polymorphism across different entity types.

#### UserTypes.ts

Domain-specific types for the user module:

```typescript
import { IRepository } from "./RepositoryTypes";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
}

export interface IUserRepository extends IRepository<User> {}

export interface IUserService {
  createUser(data: User): Promise<User>;
  findUsers(): Promise<User[]>;
}
```

**Key Concepts:**

- `User` interface: Defines the user entity structure
- `IUserRepository`: Extends generic `IRepository<User>` to ensure type safety
- `IUserService`: Defines service contract for business operations

### 2. Repository Layer

#### userRepositories.ts

Implements data access logic and abstracts database operations:

```typescript
import { IUserRepository, User } from "types/UserTypes";

export class UserRepository implements IUserRepository {
  private users: User[] = [];

  async create(data: User): Promise<User> {
    this.users.push(data);
    return data;
  }

  async find(): Promise<User[]> {
    return this.users;
  }
}
```

**Responsibilities:**

- Handles all CRUD operations for users
- Currently uses in-memory storage (will be replaced with MongoDB)
- Implements `IUserRepository` interface for type safety

### 3. Service Layer

#### userServices.ts

Contains business logic and orchestrates data operations:

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

  // Future methods (commented out):
  // - getUser(id: string): Get a single user by ID
  // - updateUser(id: string, data: Partial<User>): Update user data
  // - deleteUser(id: string): Delete a user
}
```

**Key Feature:** Receives `IUserRepository` through constructor (Dependency Injection)

### 4. Routes Enhancement

#### routes.ts

Updated to implement dependency injection and add user endpoints:

```typescript
// Dependencies imported
import { UserRepository } from "@repositories/userRepositories";
import { UserService } from "@services/userServices";
import { Router, Response, Request } from "express";
import { IUserRepository, User, IUserService } from "types/UserTypes";

const router: Router = Router();

// Dependency Injection: Instantiate dependencies
const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);

export default () => {
  // Existing health check endpoint
  router.get("/healthy", (req: Request, res: Response) => {
    res.send("Api is healthy");
  });

  // NEW: Get all users
  router.get("/users", async (req: Request, res: Response) => {
    const users: User[] = await userService.findUsers();
    res.json(users);
  });

  // NEW: Create a new user
  router.post("/users", async (req: Request, res: Response) => {
    const user: User = await userService.createUser(req.body);
    res.json(user);
  });

  return router;
};
```

**New Endpoints:**

- `GET /api/v1/users` - Retrieves all users
- `POST /api/v1/users` - Creates a new user

---

## Architectural Pattern Explanation

### Repository Pattern

The Repository Pattern creates an abstraction layer between the application logic and data sources. Benefits include:

- **Data Source Independence:** Swap in-memory storage with MongoDB without changing service code
- **Testability:** Mock repositories easily for unit testing
- **Consistency:** Centralized data access logic
- **Maintainability:** Changes to data access logic isolated in one location

### Dependency Injection (DI)

Dependencies are passed to classes through constructors, rather than being created internally.

**Before (without DI):**

```typescript
class UserService {
  private userRepository = new UserRepository(); // Tightly coupled
}
```

**After (with DI):**

```typescript
class UserService {
  constructor(private userRepository: IUserRepository) {} // Loosely coupled
}
```

**Advantages:**

- **Loose Coupling:** Services don't depend on concrete implementations
- **Flexibility:** Easy to swap implementations (e.g., for testing)
- **Scalability:** Simplified management of complex dependency graphs

---

## Type Safety

All layers use TypeScript interfaces to ensure type safety:

1. **Repositories** implement `IUserRepository`
2. **Services** accept `IUserRepository` through dependency injection
3. **Routes** use typed interfaces to interact with services
4. **Responses** return properly typed `User[]` or `User` objects

This creates a type-safe chain from HTTP requests to data access operations.

---

## Testing the Implementation

### Using REST Client (request.http)

Create test requests for the new endpoints:

```http
### Get all users
GET http://localhost:4000/api/v1/users

### Create a new user
POST http://localhost:4000/api/v1/users
Content-Type: application/json

{
  "id": "1",
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com"
}
```

---

## Key Takeaways

- ✅ Repository Pattern separates data access from business logic
- ✅ Dependency Injection promotes loose coupling and testability
- ✅ TypeScript interfaces enforce contracts across layers
- ✅ In-memory storage allows rapid prototyping before database integration
- ✅ Clear separation of concerns enables scalable architecture
