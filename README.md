<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
<p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
</p>

## Description

**Car Service Backend API** - An enterprise-grade backend system for managing car maintenance, user bookings, and inventory.

This project utilizes a modern stack designed for scalability and reliability:
* **Framework:** [NestJS](https://github.com/nestjs/nest) (Node.js)
* **Database:** PostgreSQL 15
* **ORM:** Prisma (v7 with Driver Adapters)
* **Caching/Queues:** Redis 7
* **Containerization:** Docker & Docker Compose

## 📋 Prerequisites

Ensure you have the following installed on your machine:
* **Git**
* **Docker Desktop** (running)
* **PowerShell** (Windows) or **Terminal** (Linux/macOS)

## 🚀 Getting Started (Docker)

We recommend running this application via Docker to ensure all dependencies (Postgres, Redis) are configured correctly.

### 1. Configure Environment
Create a file named `.env` in the root directory. Copy the contents from the **Configuration** section below.

### 2. Build and Start
Run the following command to build the containers.
*Note: The `--build` flag is critical to ensure the Prisma 7 adapter is installed correctly.*

```bash
$ docker compose -f docker/docker-compose.yml up --build -d

```

*Wait ~30-60 seconds for the database and API to initialize.*

### 3. Initialize Database

Apply the schema migrations to create the database tables:

```bash
$ docker compose -f docker/docker-compose.yml exec api npx prisma migrate deploy

```

*Expected Output: "No pending migrations to apply" (if up to date) or a list of applied migrations.*

## 🧪 Validating the Installation

You can verify the system is operational by registering a test user.

### Windows (PowerShell)

```powershell
$body = @{
    email = "admin@example.com"
    password = "securePassword123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

```

### macOS / Linux (Bash)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "securePassword123"}'

```

**Expected Response:**
You should receive a JSON response containing an `accessToken` and `refreshToken`.

---

## 🛠 Troubleshooting

**Issue: "PrismaClientConstructorValidationError"**
If you encounter errors regarding the Prisma engine or client version:

1. Stop the containers:
```bash
docker compose -f docker/docker-compose.yml down

```


2. Rebuild without cache to force a fresh dependency install:
```bash
docker compose -f docker/docker-compose.yml build --no-cache api

```


3. Start again:
```bash
docker compose -f docker/docker-compose.yml up -d

```



**Issue: "Connection Refused"**
Ensure that Docker Desktop is running and that port `3000` is not being used by another application.

## Local Development (Without Docker)

If you prefer to run Node.js locally (requires local Postgres/Redis instances):

```bash
$ npm install

```

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod

```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov

```

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

### File 2: `.env`

# Database Connection (Docker Internal Network)
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/car_service?schema=public"

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Security Secrets (Test/Development Environment)
# WARNING: Generate new, secure secrets for production use
JWT_ACCESS_SECRET="fea0bcd8bdb9cb463b1aa9ef3917efe32345e14274a210c523f5c23b8b9412dc27c09aaeefba7949e0c4a57104fddec6ceff20cb5bf108976be32fb3206a1500"
JWT_REFRESH_SECRET="5e6950eb9aebc7e58ef6e25b83cea4d34eda05537c80c55412a8f1bd48b16b12b753d2914e8ba5797038b8f1be5d5f62310688ab431c4fdda13d610d698086cc"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
