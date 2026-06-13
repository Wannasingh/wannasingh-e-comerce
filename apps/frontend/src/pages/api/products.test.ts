import { describe, it, expect, vi, beforeEach } from "vitest";

import { getCachedProducts } from "../../lib/cache";

import { GET } from "./products";

import type { APIContext } from "astro";

// Mock the cache module
vi.mock("../../lib/cache", () => {
  return {
    getCachedProducts: vi.fn(),
  };
});

interface ProductResponse {
  total: number;
  products: {
    id: string;
    handle: string;
    name: string;
    subtitle: string;
    price: string;
    priceRaw: number;
    image: string;
    imageAlt: string;
    href: string;
    specs: { label: string; value: string }[];
    createdAt: string;
    category: string;
  }[];
}

interface ErrorResponse {
  error: string;
}

describe("GET products API endpoint", () => {
  const mockProducts = [
    {
      id: "prod_1",
      handle: "jacket-a",
      title: "Jacket A",
      subtitle: "Insulated shell",
      status: "published",
      created_at: "2026-06-01T00:00:00Z",
      variants: [
        {
          prices: [{ amount: 15000, currency_code: "usd" }],
        },
      ],
      metadata: {
        category: "Outerwear",
        price: "$150.00",
        specs: [
          { label: "Waterproof", value: "20,000mm" },
          { label: "Breathability", value: "15,000g" },
        ],
        features: [{ title: "Windproof design", desc: "keeps wind out" }],
        materials: [{ label: "Face Fabric", value: "3L CORDURA®" }],
      },
    },
    {
      id: "prod_2",
      handle: "pants-b",
      title: "Pants B",
      subtitle: "Technical pants",
      status: "published",
      created_at: "2026-06-02T00:00:00Z",
      variants: [
        {
          prices: [{ amount: 12000, currency_code: "usd" }],
        },
      ],
      metadata: {
        category: "Pants",
        specs: [{ label: "Windproof", value: "High" }],
        features: [{ title: "Insulated layers", desc: "thermal warmth" }],
        materials: [
          { label: "Reinforcement", value: "Dyneema® Blend" },
          { label: "Membrane", value: "GORE-TEX Pro" },
        ],
      },
    },
    {
      id: "prod_3",
      handle: "draft-c",
      title: "Draft Jacket",
      status: "draft",
      variants: [],
      metadata: {},
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCachedProducts).mockResolvedValue(mockProducts);
  });

  it("should return published products with default pagination", async () => {
    const mockUrl = new URL("https://example.com/api/products");
    const context = { url: mockUrl } as unknown as APIContext;

    const response = await GET(context);
    expect(response.status).toBe(200);

    const data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(2);
    expect(data.products).toHaveLength(2);
    expect(data.products[0].name).toBe("Pants B"); // sorted by newest first by default
  });

  it("should filter by category", async () => {
    const mockUrl = new URL("https://example.com/api/products?category=Outerwear");
    const context = { url: mockUrl } as unknown as APIContext;

    const response = await GET(context);
    const data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(1);
    expect(data.products[0].name).toBe("Jacket A");
  });

  it("should filter by search query q", async () => {
    const mockUrl = new URL("https://example.com/api/products?q=pants");
    const context = { url: mockUrl } as unknown as APIContext;

    const response = await GET(context);
    const data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(1);
    expect(data.products[0].name).toBe("Pants B");
  });

  it("should paginate correctly with limit and offset", async () => {
    const mockUrl = new URL("https://example.com/api/products?limit=1&offset=1");
    const context = { url: mockUrl } as unknown as APIContext;

    const response = await GET(context);
    const data = (await response.json()) as ProductResponse;
    expect(data.products).toHaveLength(1);
    expect(data.products[0].name).toBe("Jacket A"); // offset 1
  });

  it("should filter by price ranges (minPrice and maxPrice)", async () => {
    const mockUrl = new URL("https://example.com/api/products?minPrice=130&maxPrice=160");
    const context = { url: mockUrl } as unknown as APIContext;

    const response = await GET(context);
    const data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(1);
    expect(data.products[0].name).toBe("Jacket A"); // price 150
  });

  it("should support sorting options (price-asc, price-desc, oldest, newest)", async () => {
    // oldest
    let mockUrl = new URL("https://example.com/api/products?sort=oldest");
    let response = await GET({ url: mockUrl } as unknown as APIContext);
    let data = (await response.json()) as ProductResponse;
    expect(data.products[0].name).toBe("Jacket A");

    // price-desc
    mockUrl = new URL("https://example.com/api/products?sort=price-desc");
    response = await GET({ url: mockUrl } as unknown as APIContext);
    data = (await response.json()) as ProductResponse;
    expect(data.products[0].name).toBe("Jacket A");
  });

  it("should filter by technical performance (perf=waterproof, windproof, breathable, insulated)", async () => {
    // Waterproof
    let mockUrl = new URL("https://example.com/api/products?perf=waterproof");
    let response = await GET({ url: mockUrl } as unknown as APIContext);
    let data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(2);

    // Windproof
    mockUrl = new URL("https://example.com/api/products?perf=windproof");
    response = await GET({ url: mockUrl } as unknown as APIContext);
    data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(2);

    // Breathable
    mockUrl = new URL("https://example.com/api/products?perf=breathable");
    response = await GET({ url: mockUrl } as unknown as APIContext);
    data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(1);
    expect(data.products[0].name).toBe("Jacket A");

    // Insulated
    mockUrl = new URL("https://example.com/api/products?perf=insulated");
    response = await GET({ url: mockUrl } as unknown as APIContext);
    data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(1);
    expect(data.products[0].name).toBe("Pants B");
  });

  it("should filter by fabric technology (fabric=gore-tex pro, dyneema® blend, 3l cordura®)", async () => {
    // GORE-TEX PRO
    let mockUrl = new URL("https://example.com/api/products?fabric=gore-tex+pro");
    let response = await GET({ url: mockUrl } as unknown as APIContext);
    let data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(1);
    expect(data.products[0].name).toBe("Pants B");

    // DYNEEMA® BLEND
    mockUrl = new URL("https://example.com/api/products?fabric=dyneema%C2%AE+blend");
    response = await GET({ url: mockUrl } as unknown as APIContext);
    data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(1);
    expect(data.products[0].name).toBe("Pants B");

    // 3L CORDURA®
    mockUrl = new URL("https://example.com/api/products?fabric=3l+cordura%C2%AE");
    response = await GET({ url: mockUrl } as unknown as APIContext);
    data = (await response.json()) as ProductResponse;
    expect(data.total).toBe(1);
    expect(data.products[0].name).toBe("Jacket A");
  });

  it("should handle error gracefully and return 500 status", async () => {
    vi.mocked(getCachedProducts).mockRejectedValue(new Error("Database offline"));
    const mockUrl = new URL("https://example.com/api/products");
    const context = { url: mockUrl } as unknown as APIContext;

    const response = await GET(context);
    expect(response.status).toBe(500);
    const data = (await response.json()) as ErrorResponse;
    expect(data.error).toBe("Database offline");
  });
});
