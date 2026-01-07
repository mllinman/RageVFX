# Dockerfile for RageVFX Web App - Alternative to Nixpacks
# This Dockerfile can be used for local Docker builds or other deployment platforms
# Railway deployment uses nixpacks.toml by default

# Stage 1: Build the web app
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Copy source files
COPY web ./web
COPY src ./src
COPY vite.config.ts ./
COPY tsconfig.json ./

# Build the web app
RUN npm run build:web

# Stage 2: Production server
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

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
