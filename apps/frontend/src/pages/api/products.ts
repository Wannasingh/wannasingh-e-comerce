// src/pages/api/products.ts
// Server-side API endpoint for paginated, filtered, and sorted product data
import crypto from "node:crypto";

import { getCachedProducts } from "../../lib/cache";
import { getStableImageUrl } from "../../lib/images";

import type { APIRoute } from "astro";

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
  const limit = Number.parseInt(url.searchParams.get("limit") || "12", 10);
  const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10);
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  const category = url.searchParams.get("category") || "";
  const minPrice = Number.parseFloat(url.searchParams.get("minPrice") || "0") * 100; // in cents
  const maxPrice = Number.parseFloat(url.searchParams.get("maxPrice") || "999999") * 100; // in cents
  const sort = url.searchParams.get("sort") || "newest";
  const perfFilters = url.searchParams.getAll("perf");
  const fabricFilters = url.searchParams.getAll("fabric");

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
          priceRaw = Number.parseFloat(p.metadata.price.replace(/[^0-9.]/g, "")) * 100;
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

    // Apply Technical Performance filters
    if (perfFilters.length > 0) {
      processedProducts = processedProducts.filter((p) => {
        const rawP = medusaProducts.find(rm => rm.id === p.id);
        if (!rawP) return false;

        const specs = rawP.metadata?.specs || [];
        const features = rawP.metadata?.features || [];
        const materials = rawP.metadata?.materials || [];

        return perfFilters.every((filterVal) => {
          const filter = filterVal.toUpperCase();
          if (filter === "WATERPROOF") {
            const hasWaterproofSpec = specs.some((s: any) => s.label.toLowerCase().includes("waterproof") || s.value.toLowerCase().includes("waterproof") || s.value.toLowerCase().includes("mm"));
            const hasWaterproofFeature = features.some((f: any) => f.title.toLowerCase().includes("waterproof") || f.desc.toLowerCase().includes("waterproof") || f.title.toLowerCase().includes("water"));
            const hasWaterproofMaterial = materials.some((m: any) => m.value.toLowerCase().includes("waterproof") || m.value.toLowerCase().includes("membrane") || m.value.toLowerCase().includes("gore-tex"));
            return hasWaterproofSpec || hasWaterproofFeature || hasWaterproofMaterial;
          }
          if (filter === "WINDPROOF") {
            const hasWindproofSpec = specs.some((s: any) => s.label.toLowerCase().includes("windproof") || s.value.toLowerCase().includes("windproof") || s.value.toLowerCase().includes("blocked"));
            const hasWindproofFeature = features.some((f: any) => f.title.toLowerCase().includes("windproof") || f.desc.toLowerCase().includes("windproof") || f.title.toLowerCase().includes("wind"));
            return hasWindproofSpec || hasWindproofFeature;
          }
          if (filter === "BREATHABLE") {
            const hasBreathableSpec = specs.some((s: any) => s.label.toLowerCase().includes("breathability") || s.value.toLowerCase().includes("ret") || s.value.toLowerCase().includes("breathable"));
            const hasBreathableFeature = features.some((f: any) => f.title.toLowerCase().includes("breathable") || f.desc.toLowerCase().includes("breathable") || f.desc.toLowerCase().includes("moisture"));
            return hasBreathableSpec || hasBreathableFeature;
          }
          if (filter === "INSULATED") {
            const hasInsulatedSpec = specs.some((s: any) => s.label.toLowerCase().includes("warmth") || s.value.toLowerCase().includes("clo") || s.value.toLowerCase().includes("insulated"));
            const hasInsulatedFeature = features.some((f: any) => f.title.toLowerCase().includes("insulated") || f.title.toLowerCase().includes("insulation") || f.desc.toLowerCase().includes("warmth") || f.title.toLowerCase().includes("thermal"));
            const hasInsulatedMaterial = materials.some((m: any) => m.value.toLowerCase().includes("primaloft") || m.value.toLowerCase().includes("insulation") || m.value.toLowerCase().includes("fleece"));
            return hasInsulatedSpec || hasInsulatedFeature || hasInsulatedMaterial;
          }
          return true;
        });
      });
    }

    // Apply Fabric Technology filters
    if (fabricFilters.length > 0) {
      processedProducts = processedProducts.filter((p) => {
        const rawP = medusaProducts.find(rm => rm.id === p.id);
        if (!rawP) return false;

        const specs = rawP.metadata?.specs || [];
        const materials = rawP.metadata?.materials || [];

        return fabricFilters.every((filterVal) => {
          const filter = filterVal.toUpperCase();
          if (filter === "GORE-TEX PRO") {
            return materials.some((m: any) => m.value.toUpperCase().includes("GORE-TEX") || m.value.toUpperCase().includes("GORE-PRO")) || specs.some((s: any) => s.value.toUpperCase().includes("GORE-TEX"));
          }
          if (filter === "DYNEEMA® BLEND") {
            return materials.some((m: any) => m.value.toUpperCase().includes("DYNEEMA")) || specs.some((s: any) => s.value.toUpperCase().includes("DYNEEMA"));
          }
          if (filter === "3L CORDURA®") {
            return materials.some((m: any) => m.value.toUpperCase().includes("CORDURA")) || specs.some((s: any) => s.value.toUpperCase().includes("CORDURA"));
          }
          return true;
        });
      });
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
