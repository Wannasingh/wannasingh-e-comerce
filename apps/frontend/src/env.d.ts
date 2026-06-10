// src/env.d.ts — Astro environment variable type declarations
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Public (browser-safe) variables
  readonly PUBLIC_MEDUSA_BACKEND_URL: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_MEDUSA_PUBLISHABLE_KEY: string;

  // Server-only variables (never exposed to client)
  readonly MEDUSA_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
