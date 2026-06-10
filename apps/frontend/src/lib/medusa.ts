import Medusa from "@medusajs/js-sdk";

/**
 * Medusa JS SDK client — singleton for server-side use in Astro endpoints.
 * For client-side use, pass the public backend URL only.
 *
 * Usage in an Astro API route:
 *   import { medusaClient } from "@/lib/medusa";
 *   const { products } = await medusaClient.store.product.list();
 */

const backendUrl = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL;
const publishableKey = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export const medusaClient = new Medusa({
  baseUrl: backendUrl,
  publishableKey,
  debug: import.meta.env.DEV,
});
