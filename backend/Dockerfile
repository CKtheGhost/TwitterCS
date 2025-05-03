FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# ---- Build stage ----
FROM base AS build

# Install all dependencies, including dev dependencies
RUN npm ci

# Copy source
COPY . .

# Run tests
RUN npm test

# ---- Production stage ----
FROM base AS production

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy app source (excluding files in .dockerignore)
COPY --chown=node:node . .

# Expose port
EXPOSE 3001

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Create directory for logs with proper permissions
RUN mkdir -p /app/logs && \
    chown -R node:node /app/logs

# Security: Set user to non-root
USER node

# Start the app
CMD ["node", "src/server.js"]