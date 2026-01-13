# Part 8: Docker & Container Deployment

Containerize your Mongoose API User application for consistent, scalable deployment across development, staging, and production environments.

---

## Table of Contents

1. [Docker Overview](#docker-overview)
2. [Project Docker Setup](#project-docker-setup)
3. [Prerequisites](#prerequisites)
4. [Building the Docker Image](#building-the-docker-image)
5. [Running with Docker Compose](#running-with-docker-compose)
6. [Docker Networking & Services](#docker-networking--services)
7. [Environment Configuration for Docker](#environment-configuration-for-docker)
8. [Health Checks](#health-checks)
9. [Common Docker Commands](#common-docker-commands)
10. [Troubleshooting](#troubleshooting)

---

## Docker Overview

### Why Docker?

Docker provides several critical advantages for your API:

- **Consistency**: Application runs identically in development, testing, and production
- **Isolation**: Dependencies are containerized, preventing system conflicts
- **Scalability**: Easy to deploy multiple instances across different environments
- **Security**: Sensitive credentials stored in secrets, not environment variables
- **DevOps Ready**: Compatible with Kubernetes, Docker Swarm, and cloud platforms

### Architecture

Your setup consists of two interconnected containers:

```
┌─────────────────────────────────────────────────────────────┐
│                   Docker Host Network                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │   API Container      │      │  MongoDB Container   │    │
│  │                      │      │                      │    │
│  │  Express.js API      │◄────►│  MongoDB 6.0.27      │    │
│  │  Node.js 20          │      │  Port: 27017         │    │
│  │  Port: 4000          │      │  Auth: Enabled       │    │
│  │  Service: api        │      │  Service: mongodb    │    │
│  │                      │      │                      │    │
│  └──────────────────────┘      └──────────────────────┘    │
│         ▲                                ▲                   │
│         │ Port 4000                      │ Port 27030       │
│         └─────────────┬──────────────────┘                  │
│                       │                                      │
│                   localhost                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Docker Setup

### Dockerfile Structure (Multi-Stage Build)

The `Dockerfile` uses a **multi-stage build** pattern to optimize image size:

#### Stage 1: Builder

- Compiles TypeScript to JavaScript
- Installs all dependencies
- Creates optimized output
- **Size**: ~600MB (discarded after build)

#### Stage 2: Runtime

- Copies only compiled JavaScript and production dependencies
- Minimal dependencies for execution
- **Final Size**: ~300MB (production-ready)

**Benefits:**

- Smaller final image (50% reduction)
- Faster deployments
- Reduced attack surface (no build tools in production)
- Faster docker pull/push operations

### Docker Compose Orchestration

The `docker-compose.yml` file orchestrates:

1. **MongoDB Service**

   - Image: `mongo:6.0.27-jammy`
   - Authentication enabled
   - Persistent data volume
   - Health checks configured

2. **API Service**

   - Built from local Dockerfile
   - Depends on healthy MongoDB
   - Environment configuration
   - Port mapping (4000:4000)
   - Health checks configured

3. **Custom Network**

   - `mongoose-network` bridge network
   - Service-to-service DNS resolution
   - Isolated from other containers

4. **Docker Secrets**
   - MongoDB credentials stored securely
   - Loaded from files instead of environment
   - Not exposed in logs or inspections

---

## Prerequisites

### System Requirements

```bash
# Check Docker installation
docker --version          # Docker 20.10+
docker compose version    # Docker Compose 1.29+

# Expected Output:
# Docker version 25.0.1, build 29cf629
# Docker Compose version v2.24.1
```

### Install Docker & Docker Compose

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker
```

**macOS (with Homebrew):**

```bash
brew install --cask docker
# Or install Docker Desktop from https://www.docker.com/products/docker-desktop
```

**Windows:**

- Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- Enable WSL 2 (Windows Subsystem for Linux 2)

### Verify Installation

```bash
docker run hello-world
```

---

## Building the Docker Image

### Step 1: Build the Docker Image

```bash
# Navigate to project root
cd /path/to/mongoose-api-user

# Build with tag
docker build -t mongoose-api-user:0.0.1 .

# Build with alternative tag format
docker build -t mongoose-api-user:latest .
```

### Step 2: Verify Build Success

```bash
# List images
docker images | grep mongoose-api-user

# Expected output:
# REPOSITORY            TAG       IMAGE ID      CREATED      SIZE
# mongoose-api-user     0.0.1     abc123def456  2 minutes ago 290MB
```

### Build Output Explanation

```
Step 1/15 : ARG NODE_VERSION=20-bullseye-slim
Step 2/15 : FROM node:${NODE_VERSION} AS builder
 ---> abc123def456 (cached)
Step 3/15 : LABEL maintainer="github.com/CarlosZubilete"
 ---> Running in temporary_container
 ---> xyz789uvw012 (cached)
...
Successfully built abc123def456
Successfully tagged mongoose-api-user:0.0.1
```

---

## Running with Docker Compose

### Quick Start (3 Commands)

```bash
# 1. Ensure .env file is configured (see Environment Configuration section)
cp .env.example .env
# Edit .env with your settings

# 2. Build and start containers
docker compose up -d

# 3. Verify containers are running
docker compose ps
```

### Docker Compose Commands

```bash
# Start containers in background
docker compose up -d

# View logs from all services
docker compose logs -f

# View logs from specific service
docker compose logs -f api
docker compose logs -f mongodb

# Stop containers (data persists)
docker compose stop

# Stop and remove containers
docker compose down

# Remove containers and volumes (data deleted!)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build

# Check service health
docker compose ps
```

### Expected Output

```bash
$ docker compose up -d

[+] Building 12.3s (15/15) FINISHED
 => => naming to docker.io/library/mongoose-api-user:0.0.1

[+] Running 3/3
 ✔ Network mongoose_mongoose-network  Created
 ✔ Container nosqldb                  Started
 ✔ Container api-service              Started
```

---

## Docker Networking & Services

### Service-to-Service Communication

Inside the Docker network, services communicate using their **service names** as hostnames:

**From API Container:**

```javascript
// ❌ WRONG - localhost doesn't exist inside container
const mongoUrl = "mongodb://user:pass@localhost:27017/db";

// ✅ CORRECT - use service name
const mongoUrl = "mongodb://user:pass@mongodb:27017/db";
```

### Connection String Breakdown

```
mongodb://api-user_user:apiuserpassword@mongodb:27017/api-user_db?authSource=admin

└─┬──┘   └──┬─────┘ └──┬──────┘    └──┬────┘ └──┬───┘ └─────┬──────┘  └──┬──┘
  │        │          │              │        │      │               │
  │        │          │              │        │      │               └─ Authentication source
  │        │          │              │        │      └─ Database name
  │        │          │              │        └─ Service hostname (DNS resolved in network)
  │        │          │              └─ Password
  │        │          └─ Username
  │        └─ Root user (from docker-compose)
  └─ Protocol
```

### Port Mapping

```
Host Machine (localhost)    Docker Container
    │                             │
    ├─ 4000:4000 ─────────────► API (Express.js)
    │                             │
    └─ 27030:27017 ──────────► MongoDB
```

**Access from Host Machine:**

- API: `http://localhost:4000`
- MongoDB: `mongodb://localhost:27030`

**Access from API Container:**

- MongoDB: `mongodb://mongodb:27017`

---

## Environment Configuration for Docker

### Option 1: Using Docker Compose with .env File

```bash
# Copy template
cp .env.example .env

# Edit .env
nano .env
```

**Configure for Docker:**

```env
# Use Docker service name instead of localhost
MONGODB_URL_STRING="mongodb://api-user_user:apiuserpassword@mongodb:27017/api-user_db?authSource=admin&directConnection=true"

# Authentication
JWT_SECRET="your-very-strong-jwt-secret-here"
SALT_ROUND=12

# Application
NODE_ENV="production"
PORT=4000
```

### Option 2: Manual Environment Override

If you need to override specific variables without editing `.env`:

```bash
docker compose run --rm api bash -c "echo $MONGODB_URL_STRING"
```

### Environment Variables in docker-compose.yml

```yaml
api:
  env_file:
    - .env # Load from .env file


  # Override specific variables (optional)
  # environment:
  #   NODE_ENV: production
```

---

## Health Checks

Health checks ensure containers are functioning properly and enable automatic restart/recovery.

### API Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
```

**Parameters:**

- `--interval=30s`: Check every 30 seconds
- `--timeout=5s`: Each check times out after 5 seconds
- `--start-period=10s`: Wait 10 seconds before first check (startup time)
- `--retries=3`: Mark unhealthy after 3 consecutive failures

### MongoDB Health Check

```yaml
healthcheck:
  test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
  interval: 5s
  timeout: 5s
  retries: 5
  start_period: 10s
```

### Check Health Status

```bash
# View health status
docker compose ps

# Output:
# NAME          STATUS                      PORTS
# api-service   Up 2 minutes (healthy)      0.0.0.0:4000->4000/tcp
# nosqldb       Up 2 minutes (healthy)      0.0.0.0:27030->27017/tcp
```

---

## Common Docker Commands

### Container Management

```bash
# View running containers
docker compose ps

# View all containers (including stopped)
docker compose ps -a

# Inspect container details
docker inspect api-service

# Enter container shell
docker compose exec api bash
docker compose exec mongodb mongosh

# View container logs
docker compose logs api -f --tail=100
```

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi mongoose-api-user:0.0.1

# Remove unused images
docker image prune

# View image layers
docker history mongoose-api-user:0.0.1
```

### Network Management

```bash
# List networks
docker network ls

# Inspect custom network
docker network inspect mongoose_mongoose-network

# View container IP in network
docker inspect api-service --format='{{.NetworkSettings.Networks.mongoose_mongoose-network.IPAddress}}'
```

### Data & Volumes

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect mongo_data

# Backup MongoDB data
docker compose exec mongodb mongodump --authenticationDatabase admin -u root -p password

# Clear volumes (WARNING: deletes data)
docker compose down -v
```

---

## Troubleshooting

### Container Won't Start

**Problem:** API container exits immediately

**Solution:**

```bash
# Check logs
docker compose logs api

# Common causes:
# 1. MongoDB not ready
docker compose logs mongodb

# 2. Invalid connection string in .env
# 3. Port 4000 already in use
lsof -i :4000
```

### Can't Connect to MongoDB

**Problem:** Connection refused from API

**Symptoms:**

```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**

```bash
# Check MongoDB is healthy
docker compose ps mongodb

# Verify connection string uses service name
cat .env | grep MONGODB_URL_STRING

# Test from API container
docker compose exec api bash
curl -i http://localhost:4000
```

### Permission Denied on Volumes

**Problem:** MongoDB can't write to volume

```bash
# Fix permissions
docker compose down
sudo chown -R 999:999 ./mongodb/mongo-data
docker compose up -d
```

### Port Already in Use

**Problem:** Port 4000 or 27030 already taken

```bash
# Find process using port
lsof -i :4000

# Kill process or use different port in docker-compose.yml
# Change: ports: - "4001:4000"
```

### Docker Compose Network Issues

**Problem:** Containers can't communicate

```bash
# Verify network exists
docker network ls | grep mongoose

# Recreate network
docker compose down
docker compose up -d

# Test DNS resolution
docker compose exec api ping mongodb
```

---

## Production Considerations

### Security Best Practices

1. **Secrets Management**

   - Use Docker secrets (as implemented)
   - Never hardcode credentials
   - Rotate credentials regularly

2. **Image Security**

   - Use specific version tags (not `latest`)
   - Scan images for vulnerabilities: `docker scan mongoose-api-user:0.0.1`
   - Keep base image updated

3. **Network Security**

   - Use custom networks (implemented)
   - Don't expose unnecessary ports
   - Use reverse proxy (nginx/traefik)

4. **Data Security**
   - Enable MongoDB authentication (implemented)
   - Use encryption at rest
   - Regular backups: `docker compose exec mongodb mongodump`

### Performance Optimization

1. **Resource Limits**

   ```yaml
   api:
     deploy:
       resources:
         limits:
           cpus: "1"
           memory: 512M
         reservations:
           cpus: "0.5"
           memory: 256M
   ```

2. **Multi-Stage Builds**

   - Already implemented in Dockerfile
   - Reduces image size by 50%

3. **Caching Strategy**
   - Layer dependencies separately
   - Change source code more frequently
   - Docker caches unchanged layers

### Deployment Platforms

**Docker Compose** (Single Server):

- Development
- Small production deployments
- Easy local testing

**Docker Swarm** (Multiple Servers):

- Load balancing
- Rolling updates
- Service discovery

**Kubernetes** (Enterprise):

- Auto-scaling
- Self-healing
- Advanced networking
- Ideal for large deployments

---

## Summary

Your Docker setup provides:

✅ **Multi-stage builds** for optimized image size  
✅ **Docker Compose** for orchestration  
✅ **Health checks** for reliability  
✅ **Secrets management** for security  
✅ **Custom networking** for service communication  
✅ **Production-ready** configuration

You're ready to deploy to any platform supporting Docker!

---

## Next Steps

1. Build your image: `docker build -t mongoose-api-user:0.0.1 .`
2. Configure `.env` file
3. Start with Docker Compose: `docker compose up -d`
4. Verify health: `docker compose ps`
5. Check logs: `docker compose logs -f`

For detailed MongoDB setup, see `./mongodb/README.md`

---

**Questions?** Refer to:

- [Docker Official Documentation](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [MongoDB Docker Image](https://hub.docker.com/_/mongo)
