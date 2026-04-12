<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

**Car Service Backend API** — An enterprise-grade backend system for managing car maintenance, user bookings, and inventory.

This project utilises a modern stack designed for scalability and reliability:

* **Framework:** [NestJS](https://github.com/nestjs/nest) v11 (Node.js v20)
* **Database:** PostgreSQL 15
* **ORM:** Prisma v6 (with Driver Adapters via `@prisma/adapter-pg`)
* **Caching:** In-process TTL cache via `@nestjs/cache-manager`
* **Queues:** BullMQ backed by Redis 7
* **Containerisation:** Docker & Docker Compose

---

## Prerequisites

Ensure the following are installed and running:

* **Git**
* **Docker Desktop**
* **Node.js v20+** (for local development without Docker)
* **PowerShell** (Windows) or **Terminal** (Linux/macOS)

---

## Getting started (Docker)

### 1. Configure environment

Create a `.env` file in the project root using `.env.example` as the template:

```bash
cp .env.example .env
```

Edit the values — at minimum set the JWT secrets to long random strings (32+ characters each).

### 2. Build and start

```bash
docker compose -f docker/docker-compose.yml up --build -d
```

Wait 30–60 seconds for PostgreSQL and the API to initialise.

### 3. Apply database migrations

```bash
docker compose -f docker/docker-compose.yml exec api npx prisma migrate deploy
```

Expected output: `"No pending migrations to apply"` (if up to date) or a list of applied migrations.

### 4. Seed reference data (optional)

```bash
docker compose -f docker/docker-compose.yml exec api npm run prisma:seed
```

---

## Validating the installation

### macOS / Linux

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "securePassword123", "name": "Admin"}'
```

### Windows (PowerShell)

```powershell
$body = @{
    email    = "admin@example.com"
    password = "securePassword123"
    name     = "Admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

**Expected response:** a JSON object containing `accessToken` and `refreshToken`.

---

## Health checks

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness — process uptime only. Never fails due to dependencies. |
| `GET /health/ready` | Readiness — probes PostgreSQL and Redis. Returns `503` if either is unreachable. |

---

## API documentation

Swagger UI is available at `/docs` in **non-production environments only**.

Start the server locally and open: [http://localhost:3000/docs](http://localhost:3000/docs)

---

## Local development (without Docker)

Requires a local PostgreSQL 15 instance and Redis 7.

```bash
npm install
```

```bash
# development
npm run start

# watch mode
npm run start:dev

# production build
npm run build

# production mode
npm run start:prod
```

---

## Running tests

```bash
# unit tests
npm run test

# watch mode
npm run test:watch

# coverage
npm run test:cov

# e2e tests
npm run test:e2e
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development` / `test` / `production`. Default: `development` |
| `PORT` | No | HTTP port. Default: `3000` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (`postgresql://...`) |
| `JWT_ACCESS_SECRET` | **Yes** | Min 32 characters |
| `JWT_REFRESH_SECRET` | **Yes** | Min 32 characters |
| `JWT_ACCESS_EXPIRES_IN` | No | Default: `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | Default: `7d` |
| `REDIS_URL` | One of these two | Full Redis URL e.g. `redis://localhost:6379` |
| `REDIS_HOST` | One of these two | Redis hostname e.g. `localhost` |
| `REDIS_PORT` | No | Default: `6379` |
| `REDIS_PASSWORD` | No | Redis password for authenticated instances |
| `REDIS_TLS` | No | `true` to enable TLS. Default: `false` |
| `CORS_ORIGIN` | No | Allowed origin(s), comma-separated |

---

## Available scripts

| Script | Description |
|---|---|
| `npm run build` | Generates Prisma client and compiles TypeScript |
| `npm run start:dev` | Starts in watch mode |
| `npm run start:prod` | Runs migrations then starts the compiled app |
| `npm run lint` | Runs ESLint with auto-fix |
| `npm run test` | Runs unit tests |
| `npm run test:cov` | Runs unit tests with coverage report |
| `npm run test:e2e` | Runs end-to-end tests |
| `npm run prisma:seed` | Seeds reference data (brands, models, services, users) |

---

## Troubleshooting

**`PrismaClientConstructorValidationError`**

```bash
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml build --no-cache api
docker compose -f docker/docker-compose.yml up -d
```

**`Connection Refused`**

Ensure Docker Desktop is running and port `3000` is not occupied by another process.

**Config validation error at startup**

The app validates all environment variables at boot. If a required variable is missing or malformed, the process exits immediately with a clear error listing every invalid field. Check your `.env` against the environment variables table above.

---

## License

UNLICENSED