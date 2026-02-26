# ── Development stage ──
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

COPY . .

RUN mkdir -p logs

EXPOSE 3000

# Hot-reload via node --watch
CMD ["node", "--watch", "src/index.js"]

# ── Builder stage (production deps only) ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# ── Production stage ──
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "src/index.js"]
