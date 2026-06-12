/* eslint-disable */
import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ message: "Customer ID is required" });
    return;
  }

  const callerId = req.auth_context.actor_id;
  if (!callerId) {
    res.status(401).json({ message: "Unauthorized: Missing authentication context" });
    return;
  }

  try {
    const customerService = req.scope.resolve("customer");

    // Verify caller is admin
    const caller = await customerService.retrieveCustomer(callerId);
    if (!caller || caller.email !== "wannasingh.khan@gmail.com") {
      res.status(403).json({ message: "Forbidden: Caller is not authorized as system admin" });
      return;
    }

    const customer = await customerService.retrieveCustomer(id);
    if (!customer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    const updatedCustomer = await customerService.updateCustomers(id, {
      metadata: {
        ...customer.metadata,
        seller_requested: "false",
        seller_approved: "true",
      },
    });

    res.status(200).json({ customer: updatedCustomer });
  } catch (err: any) {
    console.error("Error in approve-seller API route:", err);
    res.status(500).json({ message: err.message || "An error occurred during seller approval" });
  }
}
