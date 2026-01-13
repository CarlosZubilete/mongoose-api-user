# Mongoose API User Management System

A **REST API** for comprehensive user management built with **Express.js**, **TypeScript**, and **MongoDB**. This application implements robust authentication, role-based access control (RBAC), and a multi-entity domain model with complete CRUD operations. Available as a containerized Docker image for seamless deployment.

---

## Docker Hub Repository

This image is available on Docker Hub: **[happykitten/mongoose-api-user](https://hub.docker.com/r/happykitten/mongoose-api-user)**

### Quick Docker Start

```bash
# Pull the image
docker pull happykitten/mongoose-api-user

# Clone and run with Docker Compose (includes MongoDB)
git clone https://github.com/CarlosZubilete/mongoose-api-user.git
cd mongoose-api-user
docker compose up -d

# API available at: http://localhost:4000
```

**For detailed Docker documentation**, see the **[Docker Deployment](#docker-deployment)** section below.

---

## Table of Contents

1. [The "What" and "Why" (Project Overview)](#the-what-and-why-project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Getting Started (Installation)](#getting-started-installation)
4. [API Documentation](#api-documentation)
5. [Project Structure](#project-structure)
6. [Environment Configuration](#environment-configuration)
7. [Scripts Reference](#scripts-reference)
8. [Docker Deployment](#docker-deployment)
9. [Support & Documentation](#support--documentation)

---

## The "What" and "Why" (Project Overview)

### What is This Project?

**Mongoose API User** is a scalable TypeScript-based REST API that provides a complete user management system with the following core capabilities:

- **User Management**: Full CRUD operations with secure password handling using bcrypt
- **Role Management**: Hierarchical role system with fine-grained permission control
- **Post Management**: Content management system enabling users to create and manage posts
- **Authentication**: JWT-based authentication for secure API access
- **Authorization**: Role-based access control (RBAC) with permission-level enforcement

The application follows enterprise-grade architectural patterns including the Repository Pattern, Dependency Injection, and layered service-oriented architecture.

### Why Build This?

1. **Production-Ready Foundation**: Provides a complete, battle-tested template for building secure REST APIs with TypeScript
2. **Security First**: Implements industry-standard security practices including bcrypt password hashing and JWT token validation
3. **Scalability**: Decoupled architecture (repositories, services, controllers) enables easy feature expansion and maintenance
4. **Developer Experience**: Comprehensive type safety through TypeScript and modular design for intuitive codebase navigation
5. **Best Practices**: Demonstrates real-world implementation of design patterns commonly used in enterprise applications

### Key Features

- JWT-based authentication and authorization
- Bcrypt password hashing with configurable salt rounds
- Role-based access control (RBAC) with method and scope permissions
- MongoDB integration with Mongoose ODM
- Repository Pattern for data access abstraction
- Dependency Injection for loose coupling and testability
- Comprehensive error handling and validation
- HTTP request logging with Morgan middleware
- Environment-based configuration management
- TypeScript strict mode for maximum type safety

---

## Technical Architecture

### Technology Stack

| Layer                 | Technology   | Version       |
| --------------------- | ------------ | ------------- |
| **Runtime**           | Node.js      | v24.11.0+     |
| **Language**          | TypeScript   | 5.9.3         |
| **Web Framework**     | Express.js   | 5.2.1         |
| **Database**          | MongoDB      | Cloud (Atlas) |
| **ODM**               | Mongoose     | 9.0.2         |
| **Security**          | bcrypt       | 6.0.0         |
| **JWT**               | jsonwebtoken | 9.0.3         |
| **Module Resolution** | module-alias | 2.2.3         |
| **Package Manager**   | pnpm         | 10.20.0       |

### Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Express Application                       │
├─────────────────────────────────────────────────────────────┤
│  Routes Layer                    (/routes)                   │
│  - API endpoint definitions      - Request routing           │
│  - Middleware composition        - Error handling            │
├─────────────────────────────────────────────────────────────┤
│  Middleware Layer                (/middlewares)              │
│  - JWT verification & token validation                       │
│  - Role-based access control (RBAC)                          │
│  - Permission enforcement                                    │
├─────────────────────────────────────────────────────────────┤
│  Controller Layer                (/controllers)              │
│  - Request handling & validation - Response formatting       │
│  - Business logic orchestration  - Error responses           │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                   (/services)                 │
│  - Business logic implementation - Data transformation       │
│  - Domain operations             - Validation rules          │
├─────────────────────────────────────────────────────────────┤
│  Repository Layer                (/repositories)             │
│  - Data access abstraction       - Query execution           │
│  - MongoDB operations            - CRUD abstractions         │
├─────────────────────────────────────────────────────────────┤
│  Model Layer                     (/models)                   │
│  - Mongoose schema definitions   - Validation rules          │
│  - Database relationships        - Pre/Post hooks            │
├─────────────────────────────────────────────────────────────┤
│  Database Layer                  (MongoDB)                    │
│  - Persistent data storage       - Document relationships    │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```
src/
├── app.ts                          # Application entry point
├── secrets.ts                      # Environment variables & configuration
├── server/
│   └── server.ts                   # Express server configuration
├── config/
│   └── mongodb.ts                  # Database connection setup
├── routes/
│   └── routes.ts                   # API route definitions & middleware composition
├── controllers/                    # Request handlers
│   ├── usersController.ts          # User operations
│   ├── rolesController.ts          # Role operations
│   ├── postsControllers.ts         # Post operations
│   └── authControllers.ts          # Authentication operations
├── services/                       # Business logic layer
│   ├── userServices.ts             # User business logic
│   ├── roleServices.ts             # Role business logic
│   └── postServices.ts             # Post business logic
├── repositories/                   # Data access layer
│   ├── userRepositories.ts         # User data operations
│   ├── roleRepositories.ts         # Role data operations
│   └── postRepositories.ts         # Post data operations
├── models/                         # Mongoose schemas
│   ├── Users.ts                    # User schema with hooks
│   ├── Roles.ts                    # Role schema
│   └── Posts.ts                    # Post schema
├── middlewares/                    # Express middleware
│   ├── auth.ts                     # JWT verification & RBAC
│   └── roles.ts                    # Role-based middleware
└── types/                          # TypeScript interfaces
    ├── UserTypes.ts                # User-related interfaces
    ├── RoleTypes.ts                # Role-related interfaces
    ├── PostTypes.ts                # Post-related interfaces
    ├── RepositoryTypes.ts          # Generic repository interfaces
    └── PermissionsTypes.ts         # RBAC permission definitions
```

### Data Flow Example

```
HTTP Request
    ↓
Route Handler (routes/routes.ts)
    ↓
Middleware (JWT verification & RBAC)
    ↓
Controller (controllers/usersController.ts)
    ↓
Service (services/userServices.ts)
    ↓
Repository (repositories/userRepositories.ts)
    ↓
Model/Database (models/Users.ts → MongoDB)
    ↓
Response (JSON formatted response)
    ↓
HTTP Response
```

### Design Patterns

1. **Repository Pattern**: Data access abstraction enabling loose coupling from database operations
2. **Dependency Injection**: Services receive repositories through constructor injection
3. **Service Layer**: Centralized business logic separating concerns from controllers
4. **Middleware Composition**: Reusable middleware for authentication and authorization
5. **Type Safety**: TypeScript interfaces for all domain entities and contracts

---

## Getting Started (Installation)

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **pnpm**: Package manager (install via `npm install -g pnpm`)
- **MongoDB**: Atlas cloud account or local MongoDB instance
- **Git**: For version control

### Step 1: Clone the Repository

```bash
git clone https://github.com/CarlosZubilete/mongoose-api-user.git
cd mongoose-api-user
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This command installs all project dependencies defined in `package.json` using pnpm's efficient dependency resolution.

### Step 3: Configure Environment Variables

Create a `.env` file in the project root by copying the provided template:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration:

```env
MONGODB_URL_STRING=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-secure-jwt-secret
SALT_ROUND=12
NODE_ENV=development
PORT=4000
```

**Configuration Details:**

| Variable             | Description                                | Example                       |
| -------------------- | ------------------------------------------ | ----------------------------- |
| `MONGODB_URL_STRING` | MongoDB connection string                  | `mongodb+srv://...`           |
| `JWT_SECRET`         | Secret key for JWT signing (bcrypt hashed) | Bcrypt hashed string          |
| `SALT_ROUND`         | Bcrypt salt rounds for password hashing    | `12` (recommended)            |
| `NODE_ENV`           | Application environment                    | `development` or `production` |
| `PORT`               | Server listening port                      | `4000`                        |

### Step 4: Start the Application

#### Development Mode (Hot Reload)

```bash
pnpm dev
```

Starts the application with hot-reload using `ts-node-dev`. Changes to source files automatically restart the server.

#### Production Mode

```bash
pnpm build      # Compile TypeScript to JavaScript
pnpm start      # Run compiled application
```

#### Expected Output

```
Server is running on http://localhost:4000
Connected to MongoDB successfully.
```

### Step 5: Verify Installation

Test the API health using curl:

```bash
curl -X GET http://localhost:4000/api/v1/users
```

The API should respond (may require authentication for protected endpoints).

---

## API Documentation

### Authentication

The API uses JWT (JSON Web Token) authentication for protected endpoints. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Core Endpoints

#### Users Module

| Method   | Endpoint                | Authentication | Description                        |
| -------- | ----------------------- | -------------- | ---------------------------------- |
| `POST`   | `/api/v1/auth/register` | ❌ No          | Register new user account          |
| `POST`   | `/api/v1/auth/login`    | ❌ No          | Authenticate and receive JWT token |
| `GET`    | `/api/v1/users`         | ✅ Required    | Retrieve all users                 |
| `GET`    | `/api/v1/users/:id`     | ✅ Required    | Retrieve specific user by ID       |
| `PUT`    | `/api/v1/users/:id`     | ✅ Required    | Update user information            |
| `DELETE` | `/api/v1/users/:id`     | ✅ Required    | Delete user account                |

#### Roles Module

| Method   | Endpoint            | Authentication | Description                         |
| -------- | ------------------- | -------------- | ----------------------------------- |
| `GET`    | `/api/v1/roles`     | ✅ Required    | Retrieve all available roles        |
| `GET`    | `/api/v1/roles/:id` | ✅ Required    | Retrieve specific role by ID        |
| `POST`   | `/api/v1/roles`     | ✅ Required    | Create new role (Admin only)        |
| `PUT`    | `/api/v1/roles/:id` | ✅ Required    | Update role definition (Admin only) |
| `DELETE` | `/api/v1/roles/:id` | ✅ Required    | Delete role (Admin only)            |

#### Posts Module

| Method   | Endpoint            | Authentication | Description                  |
| -------- | ------------------- | -------------- | ---------------------------- |
| `GET`    | `/api/v1/posts`     | ✅ Required    | Retrieve all posts           |
| `GET`    | `/api/v1/posts/:id` | ✅ Required    | Retrieve specific post by ID |
| `POST`   | `/api/v1/posts`     | ✅ Required    | Create new post              |
| `PUT`    | `/api/v1/posts/:id` | ✅ Required    | Update post content          |
| `DELETE` | `/api/v1/posts/:id` | ✅ Required    | Delete post                  |

### Authentication Flow

#### 1. User Registration

**Request:**

```json
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "roles": ["user"]
}
```

#### 2. User Login

**Request:**

```json
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "roles": ["user"]
  }
}
```

#### 3. Authenticated Request

**Request:**

```
GET /api/v1/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**

```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "roles": ["user"]
    }
  ]
}
```

### Role-Based Access Control (RBAC)

The system implements fine-grained permission control with the following components:

#### Permission Structure

```typescript
permissions = {
  "CREATE:USER": "create_user",
  "READ:USER": "read_user",
  "UPDATE:USER": "update_user",
  "DELETE:USER": "delete_user",

  "CREATE:ROLE": "create_role",
  "READ:ROLE": "read_role",
  "UPDATE:ROLE": "update_role",
  "DELETE:ROLE": "delete_role",

  "CREATE:POST": "create_post",
  "READ:POST": "read_post",
  "UPDATE:POST": "update_post",
  "DELETE:POST": "delete_post",
};
```

#### Default Roles

- **Admin**: Full access to all operations
- **User**: Limited access to own resources and public posts
- **Moderator**: Enhanced permissions for managing content

### Error Handling

The API returns standardized error responses:

```json
{
  "message": "Authentication failed",
  "statusCode": 401
}
```

**Common HTTP Status Codes:**

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 500  | Internal Server Error |

---

## Project Structure

### Directory Organization

```
mongoose-api-user/
├── src/                            # Source code directory
│   ├── app.ts                      # Application bootstrap
│   ├── secrets.ts                  # Environment configuration
│   ├── server/                     # Server setup
│   ├── config/                     # Configuration files
│   ├── routes/                     # Route definitions
│   ├── controllers/                # Request handlers
│   ├── services/                   # Business logic
│   ├── repositories/               # Data access layer
│   ├── models/                     # Mongoose schemas
│   ├── middlewares/                # Middleware functions
│   └── types/                      # TypeScript interfaces
├── dist/                           # Compiled JavaScript (auto-generated)
├── doc/                            # Project documentation
│   ├── part1.md                    # Project initialization
│   ├── part2.md                    # Repository pattern & DI
│   ├── part3.md                    # MongoDB integration
│   ├── part4.md                    # Controller layer
│   ├── part5.md                    # Authentication & Posts
│   ├── part6.md                    # RBAC implementation
│   └── part7.md                    # Production build configuration
│   └── part8.md                    # Docker & Container Deployment
├── .env                            # Environment variables (local)
├── .env.example                    # Environment template
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Project metadata & dependencies
├── pnpm-lock.yaml                  # Dependency lock file
└── README.md                       # This file
```

### Key Configuration Files

#### tsconfig.json

Defines TypeScript compilation options and path aliases for clean imports:

```jsonc
{
  "compilerOptions": {
    "target": "es2021",
    "module": "commonjs",
    "baseUrl": "./src",
    "paths": {
      "@controllers/*": ["controllers/*"],
      "@services/*": ["services/*"],
      "@repositories/*": ["repositories/*"],
      "@models/*": ["models/*"],
      "@secrets": ["secrets"]
    }
  }
}
```

#### Environment Configuration

Load variables from `.env` file using dotenv package, enabling environment-specific settings without code changes.

---

## Environment Configuration

### Setting Up Your Environment

1. **Copy the template file:**

   ```bash
   cp .env.example .env
   ```

2. **Configure each variable:**

   - **MONGODB_URL_STRING**: Obtain from MongoDB Atlas dashboard
   - **JWT_SECRET**: Use bcrypt-hashed strong secret (minimum 30 characters)
   - **SALT_ROUND**: Bcrypt iterations (12-14 recommended for security)
   - **NODE_ENV**: Set to `development` or `production`
   - **PORT**: Choose available port (default: 4000)

3. **Security Best Practices:**
   - Never commit `.env` file to version control
   - Use different secrets for development and production
   - Rotate JWT secrets periodically
   - Store environment variables in secure vaults for production

### Development vs. Production

| Aspect               | Development          | Production                  |
| -------------------- | -------------------- | --------------------------- |
| `NODE_ENV`           | `development`        | `production`                |
| `PORT`               | Any available (4000) | Restricted port (80, 443)   |
| `JWT_SECRET`         | Simple secret        | Strong hashed secret        |
| `MONGODB_URL_STRING` | Development database | Production database cluster |
| Logging              | Verbose              | Minimal                     |

---

## Scripts Reference

```bash
# Development with hot-reload
pnpm dev

# Compile TypeScript to JavaScript
pnpm build

# Run production build
pnpm start

# Run tests (configure test framework first)
pnpm test
```

---

## Docker Deployment

### Quick Start with Docker

Deploy your entire application stack (API + MongoDB) with a single command:

```bash
# Build the Docker image
docker build -t mongoose-api-user:0.0.1 .

# Start all services with Docker Compose
docker compose up -d

# Verify containers are running
docker compose ps

# View logs
docker compose logs -f api
```

### Docker Setup Overview

This project includes a **production-ready Docker setup** with:

- **Multi-stage Dockerfile**: Optimized build process reducing image size by 50%
- **Docker Compose orchestration**: MongoDB + API services with automatic networking
- **Health checks**: Both containers monitor their own health and restart if needed
- **Docker secrets**: Sensitive MongoDB credentials stored securely, not in environment variables
- **Custom networking**: Isolated bridge network for secure service-to-service communication

### Key Components

```
┌─────────────────────────────────────────┐
│   Docker Container Deployment           │
├─────────────────────────────────────────┤
│                                         │
│  API Container (Express.js)             │
│  ├─ Port: 4000                          │
│  └─ Depends on MongoDB                  │
│                                         │
│  MongoDB Container                      │
│  ├─ Port: 27017 (mapped to 27030)      │
│  └─ Data: Persistent volume             │
│                                         │
│  Custom Network: mongoose-network       │
│  └─ Service-to-service communication    │
│                                         │
└─────────────────────────────────────────┘
```

### Docker Environment Configuration

When using Docker Compose, ensure your `.env` file uses the Docker service hostname:

```env
# For Docker Compose deployment:
MONGODB_URL_STRING="mongodb://api-user_user:apiuserpassword@mongodb:27017/api-user_db?authSource=admin"

# For local development (without Docker):
# MONGODB_URL_STRING="mongodb://localhost:27030/api-user_db"
```

**Important**: Inside Docker containers, use `mongodb` (service name) instead of `localhost` or `127.0.0.1` for MongoDB connection.

### Common Docker Commands

```bash
# Start services in background
docker compose up -d

# Stop services
docker compose stop

# Stop and remove containers
docker compose down

# View live logs
docker compose logs -f

# Access API container shell
docker compose exec api bash

# Rebuild after code changes
docker compose up -d --build

# Check service health
docker compose ps
```

### For Detailed Docker Documentation

See **Part 8** in the `doc/` directory: [`doc/part8.md`](./doc/part8.md)

Includes:

- Complete Docker overview and architecture
- Build process explanation (multi-stage builds)
- Network configuration and service communication
- Health checks and monitoring
- Troubleshooting guide
- Production deployment considerations

---

## Support & Documentation

For detailed implementation guides, refer to the documentation in the `doc/` directory:

- **Part 1**: Project setup and initialization
- **Part 2**: Repository pattern and dependency injection
- **Part 3**: MongoDB integration
- **Part 4**: Controller layer architecture
- **Part 5**: Authentication and Posts module
- **Part 6**: Role-based access control
- **Part 7**: Production build configuration
- **Part 8**: Docker & Container Deployment

---

## Acknowledgments

- Express.js documentation and community
- Mongoose ODM guides and best practices
- TypeScript strict mode recommendations
- RBAC pattern implementations from industry standards

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Authors

**Open Source Community**

---

**Last Updated**: December 30, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
