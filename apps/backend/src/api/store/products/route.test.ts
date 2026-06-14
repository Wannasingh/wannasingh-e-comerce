import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { Mock } from "vitest";

describe("store/products API route GET", () => {
  let mockReq: {
    query: { limit?: string; offset?: string };
    scope: { resolve: Mock };
  };
  let mockRes: MedusaResponse;
  let statusMock: Mock;
  let jsonMock: Mock;
  let mockQuery: {
    graph: Mock;
  };

  beforeEach(() => {
    mockQuery = {
      graph: vi.fn(),
    };

    mockReq = {
      query: { limit: "10", offset: "0" },
      scope: {
        resolve: vi.fn().mockImplementation((name: string) => {
          if (name === "query") return mockQuery;
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

  it("should retrieve products via query graph and return 200 with products", async () => {
    const mockProducts = [{ id: "prod_1", title: "Test Product" }];
    mockQuery.graph.mockResolvedValue({
      data: mockProducts,
      metadata: { count: 1, skip: 0 },
    });

    await GET(mockReq as unknown as MedusaRequest, mockRes);

    expect(mockReq.scope.resolve).toHaveBeenCalledWith("query");
    expect(mockQuery.graph).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "product",
        filters: { status: ["published"] },
        pagination: { take: 10, skip: 0 },
      })
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      products: mockProducts,
      count: 1,
      offset: 0,
    });
  });

  it("should handle default limit and offset if not provided", async () => {
    mockReq.query = {};
    mockQuery.graph.mockResolvedValue({
      data: [],
      metadata: { count: 0, skip: 0 },
    });

    await GET(mockReq as unknown as MedusaRequest, mockRes);

    expect(mockQuery.graph).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { take: 20, skip: 0 },
      })
    );
    expect(statusMock).toHaveBeenCalledWith(200);
  });
});
