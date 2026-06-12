import { loadEnv, defineConfig } from "@medusajs/framework/utils";

// Load environment variables from .env file
loadEnv(process.env.NODE_ENV ?? "development", process.cwd());

// ─── MongoDB connection URI ──────────────────────────────────────────────────
// Use MONGODB_URI for Atlas in production, MONGODB_URI_LOCAL for local docker
const MONGODB_URI =
  process.env.MONGODB_URI ??
  process.env.MONGODB_URI_LOCAL ??
  "mongodb://localhost:27017/wannasingh_ecommerce?replicaSet=rs0";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required in production");
}

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/wannasingh_ecommerce";

export default defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseDriverOptions: {
      connection: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    },
    // ── HTTP ─────────────────────────────────────────────────────────────────
    http: {
      // ── Security ────────────────────────────────────────────────────────────
      jwtSecret:
        process.env.JWT_SECRET ?? "temp_jwt_secret_for_build_only",
      cookieSecret:
        process.env.COOKIE_SECRET ?? "temp_cookie_secret_for_build_only",

      // Admin dashboard CORS — tighten in production
      adminCors: process.env.ADMIN_CORS ?? "http://localhost:7001",
      // Storefront CORS
      storeCors: process.env.STORE_CORS ?? "http://localhost:4321",
      // Auth CORS
      authCors: process.env.AUTH_CORS ?? "http://localhost:4321,http://localhost:7001",
    },

    // ── Redis (optional — enables pub/sub & job queues) ──────────────────────
    // Uncomment when Redis is available:
    ...(process.env.REDIS_URL ? { redisUrl: process.env.REDIS_URL } : {}),
  },

  // ── Modules ────────────────────────────────────────────────────────────────
  modules: [
    // Database is automatically resolved via projectConfig.databaseUrl (PostgreSQL)

    // ── File Storage ─────────────────────────────────────────────────────────
    // Swap for @medusajs/file-s3 in production
    {
      key: "file",
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-local",
            id: "local",
            options: {
              upload_dir: "uploads",
              backend_url: `${process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"}/uploads`,
            },
          },
        ],
      },
    },

    // ── Redis Event Bus & Workflow Engine ─────────────────────────────────────
    ...(process.env.REDIS_URL ? [
      {
        key: "event_bus",
        resolve: "@medusajs/medusa/event-bus-redis",
        options: {
          redisUrl: process.env.REDIS_URL,
        },
      },
      {
        key: "workflows",
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: {
          redis: {
            redisUrl: process.env.REDIS_URL,
          },
        },
      },
    ] : []),
  ],

  // ── Admin Dashboard ────────────────────────────────────────────────────────
  admin: {
    // Disable built-in admin in this setup (use a separate admin SPA)
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000",
  },
});
