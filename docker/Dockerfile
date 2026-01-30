# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci

COPY . .
RUN npm run build

# ---------- RUN ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci --omit=dev --ignore-scripts
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
