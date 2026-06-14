import { describe, it, expect, vi } from "vitest";

import { GET } from "./route";

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

describe("health API route GET", () => {
  it("should return 200 with service status info", async () => {
    const mockReq = {} as MedusaRequest;
    
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn().mockReturnThis();
    const mockRes = {
      status: statusMock,
      json: jsonMock,
    } as unknown as MedusaResponse;

    await GET(mockReq, mockRes);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ok",
        service: "wannasingh-backend",
      })
    );
  });
});
