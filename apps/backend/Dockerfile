# =============================================================================
# MedusaJS Backend — Multi-stage Dockerfile
# Stage 1: deps    → install all dependencies
# Stage 2: builder → compile TypeScript to JS
# Stage 3: runner  → minimal production image
# =============================================================================

ARG NODE_VERSION=20
ARG PNPM_VERSION=9.15.0

# ==============================================================================
# Stage 1: deps — Install Node.js dependencies
# ==============================================================================
FROM node:${NODE_VERSION}-alpine AS deps
ARG PNPM_VERSION

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /repo

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY scripts ./scripts
COPY apps/backend/package.json ./apps/backend/

# Install all deps (including dev, needed for medusa build)
RUN pnpm install --frozen-lockfile --filter @wannasingh/backend...

# ==============================================================================
# Stage 2: builder — Compile MedusaJS bundle
# ==============================================================================
FROM node:${NODE_VERSION}-alpine AS builder
ARG PNPM_VERSION

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/backend/node_modules ./apps/backend/node_modules

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY tsconfig.base.json ./
COPY apps/backend ./apps/backend
COPY scripts ./scripts

WORKDIR /repo/apps/backend

# medusa build compiles TS and bundles into .medusa/server
RUN pnpm build

# Prune dev dependencies — install only production deps for the runner
RUN pnpm install --prod --filter @wannasingh/backend --ignore-scripts

# ==============================================================================
# Stage 3: runner — Minimal production image
# ==============================================================================
FROM node:${NODE_VERSION}-alpine AS runner

# Security hardening
RUN apk add --no-cache dumb-init && \
    addgroup --system --gid 1001 medusa && \
    adduser  --system --uid 1001 medusa

# Maintain pnpm workspace directory structure to keep symlinks working
WORKDIR /repo/apps/backend

# Copy compiled server bundle
COPY --from=builder --chown=medusa:medusa /repo/apps/backend/dist ./dist
COPY --from=builder --chown=medusa:medusa /repo/apps/backend/package.json ./package.json

# Copy production node_modules and root node_modules virtual store
COPY --from=builder --chown=medusa:medusa /repo/apps/backend/node_modules ./node_modules
COPY --from=builder --chown=medusa:medusa /repo/node_modules /repo/node_modules

USER medusa

ENV NODE_ENV=production
ENV PORT=9000

EXPOSE 9000

# Health check (MedusaJS exposes /health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:9000/health || exit 1

# Use dumb-init to handle PID 1 / zombie reaping
ENTRYPOINT ["dumb-init", "--"]
CMD ["node_modules/.bin/medusa", "start"]
