# Dockerfile for RageVFX Web App - Alternative to Nixpacks
# This Dockerfile can be used for local Docker builds or other deployment platforms
# Railway deployment uses nixpacks.toml by default

# Stage 1: Build the web app
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy source files needed for TypeScript build (prepare script runs during npm install)
COPY web ./web
COPY src ./src
COPY vite.config.ts ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
# Disable strict SSL to work around certificate issues in build environment
# ELECTRON_SKIP_BINARY_DOWNLOAD is set to skip Electron binary downloads
RUN npm config set strict-ssl false && ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install

# Build the web app
RUN npm run build:web

# Prune devDependencies to reduce size
RUN npm prune --omit=dev

# Stage 2: Production server
FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy node_modules from builder (already pruned of devDependencies)
COPY --from=builder /app/node_modules ./node_modules

# Copy built web app from builder stage
COPY --from=builder /app/dist-web ./dist-web

# Copy server file
COPY server.js ./

# Expose port (Railway will set PORT env variable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the server
CMD ["node", "server.js"]
