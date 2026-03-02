# ============================================
# Unideal Server — Dockerfile
# Multi-stage build: builder → production runtime
# ============================================

FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (separate layer for caching)
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY . .
RUN npx prisma generate
RUN npm run build

# ============================================
# Production image — minimal footprint
# ============================================
FROM node:20-alpine
WORKDIR /app

# Only copy what's needed at runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Expose the app port
EXPOSE 5000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
