import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * GET /store/products
 * Lists published products via MedusaJS query service.
 * This is a thin wrapper — extend with filters, pagination, and search.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve("query");

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "subtitle",
      "status",
      "thumbnail",
      "description",
      "metadata",
      "variants.id",
      "variants.title",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
    filters: {
      status: ["published"],
    },
    pagination: {
      take: Number(req.query.limit ?? 20),
      skip: Number(req.query.offset ?? 0),
    },
  });

  res.status(200).json({ products, count: metadata?.count, offset: metadata?.skip });
}
