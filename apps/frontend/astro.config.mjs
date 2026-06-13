import node from "@astrojs/node";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // ── Output mode: SSR (enables dynamic pages + API routes) ────
  output: "server",
  // eslint-disable-next-line no-undef
  adapter: process.env.VERCEL ? vercel() : node({
    mode: "standalone",
  }),

  // ── Integrations ─────────────────────────────────────────────────────────
  integrations: [
    // React integration for shadcn/ui island components
    react({
      // Only hydrate components marked with client:* directives
      experimentalReactChildren: true,
    }),
  ],

  // ── Server ────────────────────────────────────────────────────────────────
  server: {
    port: 4321,
    host: "0.0.0.0", // allow Docker container binding
  },

  // ── Build ────────────────────────────────────────────────────────────────
  build: {
    // Content-aware asset names for long-term caching
    assets: "_assets",
    inlineStylesheets: "auto",
  },

  // ── Image optimization ───────────────────────────────────────────────────
  image: {
    // Serve optimized images via the Node adapter
    service: { entrypoint: "astro/assets/services/sharp" },
  },

  // ── Dev toolbar ──────────────────────────────────────────────────────────
  devToolbar: { enabled: true },

  // ── Vite config ──────────────────────────────────────────────────────────
  vite: {
    plugins: [
      // Tailwind v4 — registered as a Vite plugin (not an Astro integration)
      tailwindcss(),
    ],
    envPrefix: ["PUBLIC_", "ASTRO_"],
    build: {
      // Reduce chunk size for better LCP
      chunkSizeWarningLimit: 500,
    },
    server: {
      // Proxy Medusa API calls to avoid CORS in dev
      proxy: {
        "/api/medusa": {
          // eslint-disable-next-line no-undef
          target: process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/medusa/, ""),
        },
      },
    },
  },
});
