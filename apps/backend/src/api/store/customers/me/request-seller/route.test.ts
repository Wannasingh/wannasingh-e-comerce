import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { Mock } from "vitest";

describe("request-seller API route POST", () => {
  let mockReq: {
    auth_context: { actor_id?: string };
    scope: { resolve: Mock };
  };
  let mockRes: MedusaResponse;
  let statusMock: Mock;
  let jsonMock: Mock;
  let mockCustomerService: {
    retrieveCustomer: Mock;
    updateCustomers: Mock;
  };

  beforeEach(() => {
    mockCustomerService = {
      retrieveCustomer: vi.fn(),
      updateCustomers: vi.fn(),
    };

    mockReq = {
      auth_context: { actor_id: "cust_123" },
      scope: {
        resolve: vi.fn().mockImplementation((serviceName: string) => {
          if (serviceName === "customer") return mockCustomerService;
          return null;
        }),
      },
    };

    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn().mockReturnThis();
    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as unknown as MedusaResponse;
  });

  it("should return 401 if actor_id is missing", async () => {
    mockReq.auth_context.actor_id = "";
    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("should submit a seller request and return 200 with customer", async () => {
    mockCustomerService.retrieveCustomer.mockResolvedValue({
      id: "cust_123",
      metadata: { existing_field: "value" },
    });

    mockCustomerService.updateCustomers.mockResolvedValue({
      id: "cust_123",
      metadata: {
        existing_field: "value",
        seller_requested: "true",
        seller_approved: "false",
      },
    });

    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(mockCustomerService.updateCustomers).toHaveBeenCalledWith("cust_123", {
      metadata: {
        existing_field: "value",
        seller_requested: "true",
        seller_approved: "false",
      },
    });
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({
          id: "cust_123",
        }) as unknown,
      }) as unknown,
    );
  });

  it("should return 500 when retrieve or update throws", async () => {
    mockCustomerService.retrieveCustomer.mockRejectedValue(new Error("Database disconnected"));
    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Database disconnected" });
  });
});
