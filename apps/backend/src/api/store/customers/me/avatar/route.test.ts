import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { POST } from "./route";

import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { Mock } from "vitest";

describe("avatar upload API route POST", () => {
  let mockReq: {
    auth_context: { actor_id?: string };
    body: { avatar?: string };
    scope: { resolve: Mock };
  };
  let mockRes: MedusaResponse;
  let statusMock: Mock;
  let jsonMock: Mock;
  let mockCustomerService: {
    retrieveCustomer: Mock;
    updateCustomers: Mock;
  };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.SUPABASE_ANON_KEY = "mock_anon_key";
    process.env.SUPABASE_URL = "https://mock.supabase.co";

    mockCustomerService = {
      retrieveCustomer: vi.fn(),
      updateCustomers: vi.fn(),
    };

    mockReq = {
      auth_context: { actor_id: "cust_123" },
      body: {
        avatar:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
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

    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should return 401 if actor_id is missing", async () => {
    mockReq.auth_context.actor_id = "";
    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("should return 400 if avatar base64 is missing", async () => {
    mockReq.body.avatar = "";
    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Image data is required" });
  });

  it("should return 400 if avatar base64 format is invalid", async () => {
    mockReq.body.avatar = "invalid-base64-string";
    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Invalid image format. Expected Base64 data URL.",
    });
  });

  it("should return 500 if Supabase token is missing", async () => {
    delete process.env.SUPABASE_ANON_KEY;
    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Supabase storage is not configured on the server",
    });
  });

  it("should upload image to Supabase and update customer metadata avatar_url", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
    } as Response);

    mockCustomerService.retrieveCustomer.mockResolvedValue({
      id: "cust_123",
      metadata: { old_meta: "value" },
    });

    mockCustomerService.updateCustomers.mockResolvedValue({
      id: "cust_123",
      metadata: {
        old_meta: "value",
        avatar_url: "https://mock.supabase.co/storage/v1/object/public/profiles/...",
      },
    });

    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://mock.supabase.co/storage/v1/object/profiles/avatar-cust_123-",
      ),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer mock_anon_key",
          "Content-Type": "image/png",
        }) as unknown,
      }) as unknown,
    );

    expect(mockCustomerService.updateCustomers).toHaveBeenCalledWith(
      "cust_123",
      expect.objectContaining({
        metadata: expect.objectContaining({
          old_meta: "value",
          avatar_url: expect.stringContaining("profiles/avatar-cust_123-") as unknown,
        }) as unknown,
      }) as unknown,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it("should return 500 if Supabase upload fails", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      text: () => {
        return Promise.resolve("Upload Limit Exceeded");
      },
    } as Response);

    await POST(mockReq as unknown as AuthenticatedMedusaRequest, mockRes);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Failed to upload avatar to storage" });
  });
});
