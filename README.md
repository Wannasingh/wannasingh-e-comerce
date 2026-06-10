# Wannasingh E-Commerce — Speed Demon Stack

> High-performance headless e-commerce monorepo powered by **Astro 5**,
> **MedusaJS v2**, and **MongoDB Atlas**.

## Repository Structure

```
wannasingh-e-comerce/
├── apps/
│   ├── frontend/          # Astro 5 + Tailwind v4 + shadcn/ui
│   └── backend/           # MedusaJS v2 + MongoDB Atlas
├── docker/mongo/          # MongoDB replica set init scripts
├── scripts/               # Developer utilities
├── eslint.config.mjs      # ESLint 9 flat config
├── .prettierrc            # Prettier 3
├── sonar-project.properties
├── Jenkinsfile            # CI/CD pipeline
└── docker-compose.yml     # Local dev environment
```

## Prerequisites

| Tool           | Minimum Version |
| -------------- | --------------- |
| Node.js        | 20 LTS          |
| pnpm           | 9.x             |
| Docker         | 24.x            |
| Docker Compose | v2              |

## Quick Start — Local Development

### 1. Clone & Setup

```bash
git clone <repo-url> wannasingh-e-comerce
cd wannasingh-e-comerce
cp .env.example .env          # Fill in your secrets
```

### 2. Generate MongoDB Keyfile (first time only)

```bash
chmod +x scripts/generate-mongo-keyfile.sh
./scripts/generate-mongo-keyfile.sh
```

### 3. Start all services

```bash
docker compose up -d          # Start MongoDB + Backend + Frontend
docker compose logs -f        # Tail logs
```

### 4. Install dependencies & run locally (without Docker)

```bash
pnpm install                  # Install all workspace deps
pnpm dev                      # Start all apps in parallel
```

| Service                | URL                   |
| ---------------------- | --------------------- |
| Frontend (Astro)       | http://localhost:4321 |
| Backend (Medusa API)   | http://localhost:9000 |
| Medusa Admin           | http://localhost:7001 |
| SonarQube (QA profile) | http://localhost:9100 |

## Running QA / SonarQube Locally

```bash
docker compose --profile qa up -d sonarqube sonar-db
# Then run sonar-scanner
sonar-scanner
```

## Code Quality

```bash
pnpm lint              # ESLint (zero warnings policy)
pnpm format:check      # Prettier format check
pnpm format            # Auto-fix formatting
pnpm type-check        # TypeScript strict check
```

## Docker

```bash
# Build production images
docker build --file apps/frontend/Dockerfile --target runner -t wannasingh/frontend .
docker build --file apps/backend/Dockerfile  --target runner -t wannasingh/backend  .

# Run full stack
docker compose up --build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `MONGODB_URI` — Atlas connection string (production)
- `JWT_SECRET` — Strong random secret (min 64 chars)
- `COOKIE_SECRET` — Strong random secret (min 64 chars)
- `SONAR_TOKEN` — SonarQube project token

## CI/CD Pipeline (Jenkins)

The `Jenkinsfile` defines a declarative pipeline:

1. **Checkout** — SCM checkout + env info
2. **Setup & Install** — pnpm install (frozen)
3. **Lint & Format Check** — Parallel: ESLint + Prettier + TypeScript
4. **SonarQube Analysis** — sonar-scanner + Quality Gate wait
5. **Docker Build** — Parallel: frontend + backend multi-stage builds
6. **Push to Registry** — Gated to `main`/`master`/`release/*` branches

### Required Jenkins Configuration

- **Credential ID** `docker-registry-creds`: Username+Password for registry
- **Credential ID** `sonarqube-token`: Secret text with SonarQube token
- **SonarQube Server**: Add under Jenkins > Configure System > SonarQube named
  `"SonarQube"`
- **Environment variable** `REGISTRY`: Target registry, e.g.
  `ghcr.io/wannasingh`

## Tech Stack

| Layer        | Technology              | Purpose                  |
| ------------ | ----------------------- | ------------------------ |
| Frontend     | Astro 5                 | SSR + Islands            |
| UI           | Tailwind v4 + shadcn/ui | Design system            |
| Commerce     | MedusaJS v2             | Headless commerce engine |
| Database     | MongoDB Atlas           | Document store           |
| Code Quality | ESLint 9 + Prettier 3   | Lint + formatting        |
| Type Safety  | TypeScript 5.7 strict   | Static analysis          |
| Containers   | Docker multi-stage      | Build + run              |
| CI/CD        | Jenkins                 | Pipeline                 |
| Analysis     | SonarQube               | Code quality gates       |

## License

MIT

# wannasingh-e-comerce
