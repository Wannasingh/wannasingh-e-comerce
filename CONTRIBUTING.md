# =============================================================================

# CONTRIBUTING.md — Developer Guide

# =============================================================================

# Contributing to Wannasingh E-Commerce

## Prerequisites

| Tool           | Version  | Install                     |
| -------------- | -------- | --------------------------- |
| Node.js        | ≥ 20 LTS | https://nodejs.org          |
| pnpm           | ≥ 9.x    | `npm i -g pnpm`             |
| Docker         | ≥ 24.x   | https://docker.com          |
| Docker Compose | v2       | Bundled with Docker Desktop |

## First-time Setup

```bash
# 1. Clone the repo
git clone <repo-url> && cd wannasingh-e-comerce

# 2. Copy environment variables
cp .env.example .env
# Fill in JWT_SECRET, COOKIE_SECRET (at minimum)

# 3. Generate the MongoDB replica-set keyfile
./scripts/generate-mongo-keyfile.sh

# 4. Install all workspace dependencies
pnpm install

# 5. Start all services (MongoDB + Backend + Frontend)
docker compose up -d
# OR run without Docker:
pnpm dev
```

## Development Workflow

### Branch Strategy

- `main` — production-ready, protected
- `develop` — integration branch
- `feature/<ticket>-<short-description>` — feature work
- `fix/<ticket>-<short-description>` — bug fixes
- `release/<version>` — release candidates (trigger push-to-registry in CI)

### Commit Messages (Conventional Commits)

```
<type>(<scope>): <subject>

feat(frontend): add product listing page
fix(backend): resolve order total calculation
chore: upgrade dependencies
docs: update README quickstart
```

### Before Opening a PR

```bash
pnpm lint          # Must pass with zero warnings
pnpm format:check  # Must pass
pnpm type-check    # Must pass
```

## Adding shadcn/ui Components

```bash
cd apps/frontend
npx shadcn@latest add button card badge input
```

Components are added to `src/components/ui/`.

## Adding a New Medusa Module

```bash
cd apps/backend
# Create module directory
mkdir -p src/modules/<module-name>

# Add to medusa-config.ts modules array
```

## Environment Variables

| Variable                        | Required   | Description                         |
| ------------------------------- | ---------- | ----------------------------------- |
| `MONGODB_URI`                   | Production | Atlas cluster URI                   |
| `MONGODB_URI_LOCAL`             | Dev        | Local replica set URI               |
| `JWT_SECRET`                    | Always     | ≥ 64 char random string             |
| `COOKIE_SECRET`                 | Always     | ≥ 64 char random string             |
| `PUBLIC_MEDUSA_BACKEND_URL`     | Always     | Medusa API URL (exposed to browser) |
| `PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Always     | From Medusa Admin > API Keys        |
