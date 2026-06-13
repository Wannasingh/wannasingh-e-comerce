# =============================================================================
# Astro Frontend — Multi-stage Dockerfile
# Stage 1: deps    → install all dependencies
# Stage 2: builder → compile the Astro SSR app
# Stage 3: runner  → minimal production image
# =============================================================================

# ── Global build args ─────────────────────────────────────────────────────────
ARG NODE_VERSION=20
ARG PNPM_VERSION=9.15.0

# ==============================================================================
# Stage 1: deps — Install Node.js dependencies
# ==============================================================================
FROM node:${NODE_VERSION}-alpine AS deps
ARG PNPM_VERSION

# Install pnpm via corepack (avoids npx download on each build)
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /repo

# Copy workspace manifests first (layer cache for dependency installs)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY scripts ./scripts
COPY apps/frontend/package.json ./apps/frontend/

# Install only production + dev deps needed for build (frozen for reproducibility)
RUN pnpm install --frozen-lockfile --filter @wannasingh/frontend...

# ==============================================================================
# Stage 2: builder — Compile Astro SSR bundle
# ==============================================================================
FROM node:${NODE_VERSION}-alpine AS builder
ARG PNPM_VERSION

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /repo

# Copy installed node_modules from deps stage
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy workspace manifests and source code
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY tsconfig.base.json ./
COPY apps/frontend ./apps/frontend
COPY scripts ./scripts

# Build args for public env vars (safe to bake into static assets)
ARG PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
ARG PUBLIC_SITE_URL=http://localhost:4321
ARG PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV PUBLIC_MEDUSA_BACKEND_URL=${PUBLIC_MEDUSA_BACKEND_URL}
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}
ENV PUBLIC_MEDUSA_PUBLISHABLE_KEY=${PUBLIC_MEDUSA_PUBLISHABLE_KEY}
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY=${PUBLIC_STRIPE_PUBLISHABLE_KEY}

WORKDIR /repo/apps/frontend
RUN pnpm build

FROM node:${NODE_VERSION}-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 astro && \
    adduser  --system --uid 1001 astro

# Maintain pnpm workspace directory structure to keep symlinks working
WORKDIR /repo/apps/frontend

# Copy only the compiled server bundle (no source code in production image)
COPY --from=builder --chown=astro:astro /repo/apps/frontend/dist ./dist

# Copy production node_modules and root node_modules virtual store
COPY --from=builder --chown=astro:astro /repo/apps/frontend/node_modules ./node_modules
COPY --from=builder --chown=astro:astro /repo/node_modules /repo/node_modules

USER astro

# Runtime environment variables (set real values via orchestrator / k8s secrets)
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4321/health || exit 1

CMD ["node", "dist/server/entry.mjs"]
