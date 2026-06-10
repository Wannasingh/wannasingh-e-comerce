// src/pages/api/products.ts
// Server-side API endpoint for paginated, filtered, and sorted product data
import type { APIRoute } from "astro";
import crypto from "node:crypto";
import { getStableImageUrl } from "../../lib/images";
import { getCachedProducts } from "../../lib/cache";

const MEDUSA_URL = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PK = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
const ENC_KEY = import.meta.env.PUBLIC_API_ENCRYPTION_KEY || "";

function decryptPayload(enc: { iv: string; data: string } | any): any {
  if (!enc || typeof enc !== "object" || !enc.iv || !enc.data) return enc;
  const keyHash = crypto.createHash("sha256").update(ENC_KEY).digest();
  const iv = Buffer.from(enc.iv, "hex");
  const data = Buffer.from(enc.data, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyHash, iv);
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString());
}

interface MedusaProduct {
  id: string;
  title: string;
  handle: string;
  subtitle: string | null;
  status: string;
  metadata: any;
  variants: any[];
  created_at: string;
}

export const GET: APIRoute = async ({ url }) => {
  const limit = parseInt(url.searchParams.get("limit") || "12", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  const category = url.searchParams.get("category") || "";
  const minPrice = parseFloat(url.searchParams.get("minPrice") || "0") * 100; // in cents
  const maxPrice = parseFloat(url.searchParams.get("maxPrice") || "999999") * 100; // in cents
  const sort = url.searchParams.get("sort") || "newest";

  try {
    const medusaProducts = await getCachedProducts();

    // Filter, map and process products in memory
    let processedProducts = medusaProducts
      .filter((p) => p.status === "published")
      .map((p) => {
        let priceRaw = 0;
        let priceStr = "$0.00";
        const firstVariant = p.variants?.[0];
        if (firstVariant?.prices?.[0]) {
          priceRaw = firstVariant.prices[0].amount;
          const dollars = priceRaw / 100;
          priceStr = `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (priceRaw === 0 && p.metadata?.price) {
          priceStr = p.metadata.price;
          priceRaw = parseFloat(p.metadata.price.replace(/[^0-9.]/g, "")) * 100;
        }

        const mainImage = getStableImageUrl(p.metadata?.images?.main || "");
        const specs = p.metadata?.specs || p.metadata?.quickSpecs || [];

        return {
          id: p.id,
          handle: p.handle,
          name: p.title,
          subtitle: p.subtitle || p.metadata?.series || "",
          price: priceStr,
          priceRaw,
          image: mainImage,
          imageAlt: `${p.title} — WANNASINGH Performance Systems`,
          href: `/shop/${p.handle}`,
          specs: specs.slice(0, 4),
          createdAt: p.created_at || "",
          category: p.metadata?.category || "Outerwear",
        };
      });

    // Apply category filter
    if (category) {
      processedProducts = processedProducts.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply search filter (q)
    if (q) {
      processedProducts = processedProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q)
      );
    }

    // Apply price range filter
    processedProducts = processedProducts.filter(
      (p) => p.priceRaw >= minPrice && p.priceRaw <= maxPrice
    );

    // Apply sorting
    if (sort === "newest") {
      processedProducts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sort === "oldest") {
      processedProducts.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else if (sort === "price-asc") {
      processedProducts.sort((a, b) => a.priceRaw - b.priceRaw);
    } else if (sort === "price-desc") {
      processedProducts.sort((a, b) => b.priceRaw - a.priceRaw);
    }

    // Apply pagination
    const totalCount = processedProducts.length;
    const paginatedProducts = processedProducts.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        products: paginatedProducts,
        total: totalCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
