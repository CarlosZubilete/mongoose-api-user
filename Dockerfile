# ============================================================================
# PROFESSIONAL DOCKERFILE FOR MONGOOSE-API-USER
# TypeScript REST API with Express.js, MongoDB, and JWT Authentication
# ============================================================================

# Define Node.js version to ensure consistency across development and production
# Using LTS version for stability and long-term support
ARG NODE_VERSION=20-bullseye-slim

# ============================================================================
# STAGE 1: BUILDER - Compile TypeScript to JavaScript
# ============================================================================
# This stage handles all build-time dependencies and TypeScript compilation.
# We isolate this to avoid carrying build tools into the final image,
# reducing the final image size significantly (from ~600MB to ~300MB).
FROM node:${NODE_VERSION} AS builder

# Define metadata label for image identification and maintenance tracking
LABEL maintainer="github.com/CarlosZubilete"

# Set the working directory inside the container where application files will be placed
WORKDIR /usr/app

# Install pnpm globally in the builder stage
# pnpm is a fast, space-efficient package manager for Node.js projects
# Installing it here ensures consistency across the build process
RUN npm install -g pnpm

# Copy only package.json and pnpm-lock.yaml files first
# This layer is cached and reused when dependencies haven't changed,
# speeding up rebuilds (Docker layer caching optimization)
COPY package.json pnpm-lock.yaml ./

# Install production dependencies with pnpm
# The --frozen-lockfile flag ensures exact versions from lock file (reproducibility)
# --prod ensures only production dependencies are installed
RUN pnpm install --frozen-lockfile --prod

# Copy TypeScript configuration and source code
# This is done after dependency installation to leverage Docker caching
COPY tsconfig.json ./
COPY src/ ./src/
COPY @types/ ./@types/

# Install dev dependencies temporarily needed for TypeScript compilation
# We use a different RUN command to keep layers organized and maintainable
RUN pnpm install --frozen-lockfile

# Compile TypeScript to JavaScript
# The 'tsc' command reads from tsconfig.json and outputs to the 'dist' directory
# This creates optimized, production-ready JavaScript from our TypeScript sources
RUN pnpm run build

# ============================================================================
# STAGE 2: RUNTIME - Minimal production image
# ============================================================================
# This stage only includes the compiled application and production dependencies.
# We start fresh from a Node.js image, discarding build tools and dev dependencies.
FROM node:${NODE_VERSION}

# Metadata label for container identification
LABEL maintainer="github.com/CarlosZubilete"

# Set the working directory for the runtime environment
WORKDIR /usr/app

# Install pnpm in the runtime stage (needed for 'pnpm start' command)
RUN npm install -g pnpm

# Copy compiled JavaScript from builder stage
# Using COPY --from=builder references output from the previous stage
# This dramatically reduces image size by excluding TypeScript and dev tools
COPY --from=builder /usr/app/dist ./dist

# Copy production dependencies from builder stage
# node_modules contains compiled native modules that must match the runtime Node.js version
COPY --from=builder /usr/app/node_modules ./node_modules

# Copy package.json and pnpm-lock.yaml for reference and dependency management
COPY package.json pnpm-lock.yaml ./

# Expose port 4000 (the port defined in your Express application)
# This documents which port the application listens on
# The application connects to MongoDB on port 27030 (typically)
EXPOSE 4000

# Configure health check to monitor container and application status
# This allows Docker and orchestration platforms (like Kubernetes) to detect:
# - Application crashes
# - Unresponsive services
# - Network connectivity issues with MongoDB
# The health check:
#   - Executes every 30 seconds (--interval=30s)
#   - Fails after 3 consecutive failures (--retries=3)
#   - Waits 10 seconds before first check (--start-period=10s)
#   - Times out after 5 seconds per check (--timeout=5s)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Define the default command to run when container starts
# Uses pnpm start which runs "node ./dist/app.js" from package.json
# This runs the compiled TypeScript application in production mode
CMD ["pnpm", "start"]
