import crypto from "node:crypto";

const MEDUSA_URL = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PK = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
const ENC_KEY = import.meta.env.PUBLIC_API_ENCRYPTION_KEY || "";

function decryptPayload(enc: any): any {
  if (!enc || typeof enc !== "object" || !enc.iv || !enc.data) return enc;
  const keyHash = crypto.createHash("sha256").update(ENC_KEY).digest();
  const iv = Buffer.from(enc.iv, "hex");
  const rawData = Buffer.from(enc.data, "hex");
  const tag = rawData.subarray(rawData.length - 16);
  const data = rawData.subarray(0, rawData.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyHash, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString());
}

let cachedProducts: any[] = [];
let lastFetched = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes TTL

export async function getCachedProducts(): Promise<any[]> {
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
      const raw = await res.json();
      const data = decryptPayload(raw);
      cachedProducts = data.products || [];
      lastFetched = now;
      return cachedProducts;
    }
  } catch (err) {
    console.error("Failed to fetch/cache products from Medusa:", err);
  }

  // Fallback to cache if request fails
  return cachedProducts;
}
