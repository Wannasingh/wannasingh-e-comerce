import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { Mock } from "vitest";

describe("approve-seller API route POST", () => {
  let mockReq: {
    params: { id: string };
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
      params: { id: "cust_target" },
      auth_context: { actor_id: "cust_caller" },
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

  it("should return 400 if ID is missing", async () => {
    mockReq.params.id = "";
    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Customer ID is required" });
  });

  it("should return 401 if authentication context is missing", async () => {
    mockReq.auth_context.actor_id = "";
    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Unauthorized: Missing authentication context",
    });
  });

  it("should return 403 if caller is not the system admin", async () => {
    mockCustomerService.retrieveCustomer.mockResolvedValue({
      id: "cust_caller",
      email: "not_admin@gmail.com",
    });

    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Forbidden: Caller is not authorized as system admin",
    });
  });

  it("should return 404 if target customer is not found", async () => {
    // Caller is admin
    mockCustomerService.retrieveCustomer.mockImplementation((id: string) => {
      if (id === "cust_caller")
        return Promise.resolve({ id: "cust_caller", email: "wannasingh.khan@gmail.com" });
      return Promise.resolve(null);
    });

    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Customer not found" });
  });

  it("should approve the seller and return 200 with updated customer info", async () => {
    mockCustomerService.retrieveCustomer.mockImplementation((id: string) => {
      if (id === "cust_caller")
        return Promise.resolve({ id: "cust_caller", email: "wannasingh.khan@gmail.com" });
      if (id === "cust_target")
        return Promise.resolve({ id: "cust_target", email: "seller@gmail.com", metadata: {} });
      return Promise.resolve(null);
    });

    mockCustomerService.updateCustomers.mockResolvedValue({
      id: "cust_target",
      metadata: { seller_requested: "false", seller_approved: "true" },
    });

    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(mockCustomerService.updateCustomers).toHaveBeenCalledWith("cust_target", {
      metadata: { seller_requested: "false", seller_approved: "true" },
    });
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({
          id: "cust_target",
        }) as unknown,
      }) as unknown,
    );
  });

  it("should catch errors and return 500 status", async () => {
    mockCustomerService.retrieveCustomer.mockRejectedValue(
      new Error("Database connection timed out"),
    );
    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Database connection timed out" });
  });
});
