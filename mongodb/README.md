# MongoDB Docker Setup Guide

This repository provides a comprehensive guide for deploying MongoDB using Docker and Docker Compose. It includes step-by-step instructions for both manual CLI-based setup and automated containerization using Docker Compose.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Method 1: Manual MongoDB Setup via CLI](#method-1-manual-mongodb-setup-via-cli)
3. [Method 2: Docker Compose Automation](#method-2-docker-compose-automation)
4. [Database Access](#database-access)
5. [Common Operations](#common-operations)

---

## Prerequisites

Before proceeding, ensure the following tools are installed on your system:

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 1.29 or higher
- **MongoDB Shell (mongosh)**: Optional, for local testing

Verify installations:

```bash
docker --version
docker compose version
```

---

## Method 1: Manual MongoDB Setup via CLI

This section demonstrates how to provision a MongoDB instance using Docker command-line interface without Docker Compose.

### Step 1: Pull the MongoDB Image

Download the official MongoDB image from Docker Hub:

```bash
docker pull mongo:6.0.27-jammy
```

Verify the image was successfully downloaded:

```bash
docker images
```

Expected output will show `mongo:6.0.27-jammy` in your local image registry.

### Step 2: Create a Data Persistence Directory

Create a local directory to persist MongoDB data across container lifecycle:

```bash
mkdir -p ~/docker-mongodb
```

This directory will be mounted as a volume inside the container, ensuring data persists even if the container is removed.

### Step 3: Launch MongoDB Container (Initial Setup)

Run the MongoDB container with environment variables for root credentials:

```bash
docker run -d \
  --name nosqldb \
  -p 27030:27017 \
  -v ${HOME}/docker-mongodb:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=myrootpassword \
  mongo:6.0.27-jammy
```

**Parameter Explanation:**

- `-d`: Run container in detached mode (background)
- `--name nosqldb`: Assign container name for easy reference
- `-p 27030:27017`: Map host port 27030 to container port 27017
- `-v`: Bind mount local directory to container data directory
- `-e`: Set environment variables for root authentication

### Step 4: Access MongoDB Shell

Connect to the running container and launch the MongoDB shell:

```bash
docker exec -it nosqldb mongosh
```

Or authenticate directly with credentials:

```bash
mongosh -u root -p myrootpassword --authenticationDatabase admin
```

Verify database connectivity:

```javascript
show dbs
```

### Step 5: Enable Authentication (Recommended)

Stop the current container:

```bash
docker stop nosqldb
docker rm nosqldb
```

Restart the container with authentication enabled:

```bash
docker run -d \
  --name nosqldb \
  -p 27030:27017 \
  -v ${HOME}/docker-mongodb:/data/db \
  mongo:6.0.27-jammy \
  mongod --auth --bind_ip_all
```

The `--auth` flag enforces authentication, and `--bind_ip_all` allows connections from any interface.

### Step 6: Create Application User

Connect to MongoDB and create a dedicated user for your application:

```bash
docker exec -it nosqldb mongosh -u root -p myrootpassword --authenticationDatabase admin
```

Inside the MongoDB shell:

```javascript
use admin
db.createUser({
  user: "api-user_user",
  pwd: "api-user_password",
  roles: [{ role: "readWrite", db: "api-user_db" }]
})
```

This user has read-write permissions only for the `api-user_db` database.

### Step 7: Create Database and Collections

Switch to the application database:

```javascript
use api-user_db
```

Create collections with initial data:

```javascript
db.createCollection("roles");
db.roles.insertMany([
  {
    name: "user",
    permissions: ["posts_read", "posts_write", "posts_update", "posts_delete"],
  },
  {
    name: "admin",
    permissions: ["admin_granted"],
  },
  {
    name: "manager",
    permissions: [
      "posts_read",
      "posts_write",
      "posts_update",
      "posts_delete",
      "users_write",
      "users_read",
      "users_update",
    ],
  },
  {
    name: "guest",
    permissions: ["posts_read"],
  },
]);
```

Verify data insertion:

```javascript
db.roles.find().pretty();
```

### Step 8: Retrieve Connection String

Generate the connection URI for application integration:

```javascript
db.getMongo().getURI();
```

Example output:

```
mongodb://api-user_user:api-user_password@127.0.0.1:27030/?directConnection=true&serverSelectionTimeoutMS=2000&authSource=api-user_db&appName=mongosh+2.5.10
```

---

## Method 2: Docker Compose Automation

This method automates the entire setup process, including user creation, database initialization, and data insertion using Docker Compose configuration and initialization scripts.

### Architecture Overview

The Docker Compose configuration orchestrates:

1. **MongoDB Service**: Containerized MongoDB instance
2. **Volume Management**: Persistent data storage
3. **Secrets Management**: Secure credential handling
4. **Initialization Scripts**: Automated database provisioning

### Configuration File Structure

#### `docker-compose.yml`

```yaml
services:
  mongodb:
    image: mongo:6.0.27-jammy
    container_name: nosqldb
    restart: unless-stopped
    secrets:
      - mongo_root_username
      - mongo_root_password
    environment:
      MONGO_INITDB_ROOT_USERNAME_FILE: /run/secrets/mongo_root_username
      MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/mongo_root_password
    ports:
      - "27030:27017"
    volumes:
      - ./mongo-data:/data/db
      - ./db/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js
    command: ["mongod", "--auth", "--bind_ip_all"]

volumes:
  mongo-data:

secrets:
  mongo_root_username:
    file: ./db/mongodb_root_username.txt
  mongo_root_password:
    file: ./db/mongodb_root_passwotd.txt
```

#### Key Configuration Elements

**Service Configuration:**

- `image`: Specifies MongoDB version (6.0.27-jammy)
- `container_name`: Names the container `nosqldb`
- `restart: unless-stopped`: Auto-restart on failure unless manually stopped

**Secrets Management:**

- Credentials stored in separate files for security
- Referenced via `MONGO_INITDB_ROOT_USERNAME_FILE` and `MONGO_INITDB_ROOT_PASSWORD_FILE`
- Files: `./db/mongodb_root_username.txt` and `./db/mongodb_root_passwotd.txt`

**Port Mapping:**

- Host port 27030 → Container port 27017
- Allows external connections to MongoDB

**Volume Mounting:**

- `./mongo-data:/data/db`: Persistent data directory
- `./db/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js`: Initialization script

**Command Override:**

- `mongod --auth --bind_ip_all`: Enforces authentication and accepts all IP addresses

### Initialization Script (`init-mongo.js`)

The initialization script automatically executes on first container startup and performs:

1. User creation for application access
2. Database creation
3. Collection initialization with seed data

**Execution Behavior:**

- Runs **only once** on initial container creation
- Subsequent container restarts do **not** re-execute the script
- Prevents duplicate data insertion and errors
- Scripts in `/docker-entrypoint-initdb.d/` execute alphabetically by filename

```javascript
// Switch to admin database
db = db.getSiblingDB("admin");

// Create application user with role-based access
db.createUser({
  user: "api-user_user",
  pwd: "api-user_password",
  roles: [{ role: "readWrite", db: "api-user_db" }],
});

// Switch to application database
db = db.getSiblingDB("api-user_db");

// Create collection
db.createCollection("roles");

// Insert seed data
db.roles.insertMany([
  {
    name: "user",
    permissions: ["posts_read", "posts_write", "posts_update", "posts_delete"],
  },
  {
    name: "admin",
    permissions: ["admin_granted"],
  },
  {
    name: "manager",
    permissions: [
      "posts_read",
      "posts_write",
      "posts_update",
      "posts_delete",
      "users_write",
      "users_read",
      "users_update",
    ],
  },
  {
    name: "guest",
    permissions: ["posts_read"],
  },
]);
```

### Credential Files

Create the following files in the `./db/` directory:

**`mongodb_root_username.txt`**

```
root
```

**`mongodb_root_passwotd.txt`**

```
myrootpassword
```

### Deployment Instructions

#### Step 1: Prepare Environment

Navigate to the project directory:

```bash
cd /path/to/mongodb
```

Ensure credential files exist in `./db/` directory.

#### Step 2: Build and Start Services

Launch the Docker Compose stack:

```bash
docker compose up -d
```

The `-d` flag runs services in detached mode.

**Expected Output:**

```
[+] Running 3/3
 ✔ Network mongodb_default    Created
 ✔ Volume mongodb_mongo-data  Created
 ✔ Container nosqldb          Started
```

#### Step 3: Verify Deployment

Check container status:

```bash
docker compose ps
```

View container logs:

```bash
docker compose logs -f mongodb
```

#### Step 4: Access Database

Connect to MongoDB shell:

```bash
docker exec -it nosqldb mongosh -u root -p myrootpassword --authenticationDatabase admin
```

Or using the application user:

```bash
docker exec -it nosqldb mongosh -u api-user_user -p api-user_password --authenticationDatabase admin
```

#### Step 5: Verify Data

Check created databases and collections:

```javascript
show dbs
use api-user_db
show collections
db.roles.find()
```

---

## Database Access

### Connection Methods

**From Host Machine (Root User):**

```bash
mongosh -u root -p myrootpassword --host 127.0.0.1:27030 --authenticationDatabase admin
```

**From Host Machine (Application User):**

```bash
mongosh -u api-user_user -p api-user_password --host 127.0.0.1:27030 --authenticationDatabase admin
```

**Application Connection String:**

```
mongodb://api-user_user:api-user_password@127.0.0.1:27030/api-user_db?authSource=admin
```

**From Docker Container:**

```bash
docker exec -it nosqldb mongosh -u api-user_user -p api-user_password --authenticationDatabase admin
```

---

## Common Operations

### Container Lifecycle Management

**Start Services:**

```bash
docker compose up -d
```

**Stop Services (Preserves Data):**

```bash
docker compose stop
```

**Resume Services:**

```bash
docker compose start
```

**Remove Services (Keeps Data Volumes):**

```bash
docker compose down
```

**Remove Services and All Volumes:**

```bash
docker compose down -v
```

### Monitoring and Debugging

**View Running Containers:**

```bash
docker compose ps
```

**Stream Container Logs:**

```bash
docker compose logs -f mongodb
```

**View Complete Logs:**

```bash
docker compose logs mongodb
```

**Execute Commands in Container:**

```bash
docker exec -it nosqldb <command>
```

### Data Management

**Backup Database:**

```bash
docker exec nosqldb mongodump --username root --password myrootpassword --authenticationDatabase admin --out /tmp/backup
```

**Restore Database:**

```bash
docker exec -i nosqldb mongorestore --username root --password myrootpassword --authenticationDatabase admin < /tmp/backup
```

---

## Best Practices

1. **Secrets Management**: Never hardcode credentials in configuration files. Use Docker secrets or environment files.
2. **Volume Persistence**: Always use named volumes or bind mounts for data persistence.
3. **Authentication**: Always enable authentication in production environments (`--auth` flag).
4. **Initialization Scripts**: Keep initialization scripts idempotent to prevent errors on container restarts.
5. **Port Binding**: Document port mappings clearly and avoid conflicts with host services.
6. **Resource Limits**: Add memory and CPU limits in docker-compose.yml for production environments.
7. **Script Organization**: Name initialization scripts with numeric prefixes (e.g., `01-init-mongo.js`) to control execution order.
8. **Error Handling**: Monitor initialization logs to ensure all setup commands execute successfully.

---

## Troubleshooting

### Connection Refused

Ensure the container is running:

```bash
docker compose ps
```

Check port mappings and firewall:

```bash
docker compose logs mongodb
```

### Authentication Failed

Verify credential files contain correct content:

```bash
cat ./db/mongodb_root_username.txt
cat ./db/mongodb_root_passwotd.txt
```

Ensure credentials match docker-compose configuration.

### Initialization Script Not Running

The script only executes on initial container creation. To re-run:

```bash
docker compose down -v
docker compose up -d
```

Check logs for initialization errors:

```bash
docker compose logs mongodb | grep -i "init"
```

### Permission Denied on Volume

Ensure proper file permissions:

```bash
chmod 644 ./db/mongodb_root_*.txt
chmod -R 755 ./mongo-data
```

### Data Persistence Issues

Verify volume is properly mounted:

```bash
docker compose exec mongodb sh -c "ls -la /data/db"
```

Check Docker volume:

```bash
docker volume ls
docker volume inspect mongodb_mongo-data
```

---

## References

- [MongoDB Official Docker Hub](https://hub.docker.com/_/mongo)
- [MongoDB Docker Image Documentation](https://github.com/docker-library/mongo)
- [Docker Compose Official Documentation](https://docs.docker.com/compose/)
- [MongoDB Shell (mongosh) Documentation](https://docs.mongodb.com/mongodb-shell/)
- [MongoDB Security Documentation](https://docs.mongodb.com/manual/security/)

---

**Last Updated**: January 12, 2026
