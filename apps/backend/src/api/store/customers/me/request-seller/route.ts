import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  const customerId = req.auth_context.actor_id;
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const customerService = req.scope.resolve("customer");
    const customer = await customerService.retrieveCustomer(customerId);

    const updatedCustomer = await customerService.updateCustomers(customerId, {
      metadata: {
        ...customer.metadata,
        seller_requested: "true",
        seller_approved: "false",
      },
    });

    res.status(200).json({ customer: updatedCustomer });
  } catch (err: unknown) {
    console.error("Error in request-seller API route:", err);
    const message = err instanceof Error ? err.message : "An error occurred while submitting seller request";
    res.status(500).json({ message });
  }
}
