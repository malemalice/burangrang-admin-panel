# Multi-stage build for NestJS Backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy TypeScript and NestJS config files
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy Prisma schema
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN npm ci && \
    npm cache clean --force

# Copy application source
COPY src ./src/

# Copy PM2 ecosystem config
COPY ecosystem.config.js ./

# Debug: List copied files
RUN echo "=== Checking copied files ===" && \
    ls -la && \
    echo "=== Checking src directory ===" && \
    ls -la src/ && \
    echo "=== Checking if main.ts exists ===" && \
    test -f src/main.ts && echo "main.ts found" || echo "ERROR: main.ts NOT found"

# Generate Prisma Client
RUN npx prisma generate

# Build application and verify output
RUN echo "=== Starting build process ===" && \
    npm run build -- --verbose && \
    echo "=== Build completed, checking current directory ===" && \
    ls -la && \
    echo "=== Checking if dist directory exists ===" && \
    if [ -d "dist" ]; then \
        echo "dist directory found" && \
        ls -la dist/ && \
        if [ -d "dist/src" ]; then \
            echo "Found dist/src instead of dist/main.js - listing contents:" && \
            ls -la dist/src/ && \
            test -f dist/src/main.js && echo "Found at dist/src/main.js"; \
        fi; \
    else \
        echo "ERROR: dist directory not found at all!"; \
        exit 1; \
    fi && \
    test -f dist/main.js || test -f dist/src/main.js || (echo "ERROR: main.js not found in expected locations" && exit 1)

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies and PM2
RUN npm ci --only=production && \
    npm install -g pm2 && \
    npm cache clean --force

# Copy Prisma schema and generate client
COPY --chown=nodejs:nodejs prisma ./prisma/
RUN npx prisma generate

# Copy built application from builder
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist

# Debug: Verify dist was copied
RUN echo "=== Checking dist directory after copy ===" && \
    ls -la dist/ && \
    test -f dist/main.js && echo "main.js found in production stage" || (echo "ERROR: main.js NOT found in production stage" && exit 1)

# Copy PM2 ecosystem config from builder
COPY --chown=nodejs:nodejs --from=builder /app/ecosystem.config.js ./

# Create uploads directory
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

