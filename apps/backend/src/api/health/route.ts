import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * GET /health
 * Custom health check endpoint for Docker / load balancer probes.
 * Returns service status and uptime.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function GET(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
  res.status(200).json({
    status: "ok",
    service: "wannasingh-backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? "0.1.0",
  });
}
