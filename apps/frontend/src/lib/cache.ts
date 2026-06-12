import crypto from "node:crypto";

const MEDUSA_URL = (import.meta.env.PUBLIC_MEDUSA_BACKEND_URL as string | undefined) ?? "http://localhost:9000";
const PK = (import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY as string | undefined) ?? "";
const ENC_KEY = (import.meta.env.PUBLIC_API_ENCRYPTION_KEY as string | undefined) ?? "";

interface EncryptedPayload {
  iv?: string;
  data?: string;
  [key: string]: unknown;
}

function decryptPayload(enc: unknown): unknown {
  if (!enc || typeof enc !== "object") return enc;
  const payload = enc as EncryptedPayload;
  if (!payload.iv || !payload.data) return enc;
  const keyHash = crypto.createHash("sha256").update(ENC_KEY).digest();
  const iv = Buffer.from(payload.iv, "hex");
  const rawData = Buffer.from(payload.data, "hex");
  const tag = rawData.subarray(-16);
  const data = rawData.subarray(0, -16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyHash, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString()) as unknown;
}

let cachedProducts: unknown[] = [];
let lastFetched = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes TTL

export async function getCachedProducts(): Promise<unknown[]> {
  const now = Date.now();
  if (cachedProducts.length > 0 && (now - lastFetched) < CACHE_TTL) {
    return cachedProducts;
  }

  try {
    const res = await fetch(
      `${MEDUSA_URL}/store/products?limit=500&fields=id,title,handle,subtitle,description,status,created_at,metadata,options.title,options.values,variants.title,variants.sku,variants.options,variants.prices.amount,variants.prices.currency_code`,
      {
        headers: {
          "x-publishable-api-key": PK,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.ok) {
      const raw: unknown = await res.json();
      const data = decryptPayload(raw);
      if (data && typeof data === "object" && "products" in data) {
        cachedProducts = (data as { products?: unknown[] }).products ?? [];
      } else {
        cachedProducts = [];
      }
      lastFetched = now;
      return cachedProducts;
    }
  } catch (err) {
    console.error("Failed to fetch/cache products from Medusa:", err);
  }

  // Fallback to cache if request fails
  return cachedProducts;
}
