# --- Stage 1: Builder ---
# Use Debian Slim instead of Alpine to avoid SSL/Prisma issues
FROM node:18-slim AS builder

WORKDIR /app

# 1. Install Dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Generate Prisma Client (It will auto-detect Debian now)
RUN npx prisma generate

# 2. Build the App
COPY . .
RUN npm run build

# --- Stage 2: Production Runner ---
FROM node:18-slim

# Install OpenSSL (Standard Debian package)
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# Copy necessary files from Builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Start the server
CMD ["node", "dist/src/main.js"]