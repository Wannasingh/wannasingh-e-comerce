import oracledb from "oracledb";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { GET } from "./route";

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { Mock } from "vitest";

// Mock the entire oracledb module
vi.mock("oracledb", () => {
  return {
    default: {
      getConnection: vi.fn(),
    },
  };
});

describe("oracle-test API route GET", () => {
  let mockReq: MedusaRequest;
  let mockRes: MedusaResponse;
  let statusMock: Mock;
  let jsonMock: Mock;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockReq = {} as MedusaRequest;
    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn().mockReturnThis();
    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as unknown as MedusaResponse;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("should return 400 if ORACLE_PASSWORD is not set", async () => {
    delete process.env.ORACLE_PASSWORD;

    await GET(mockReq, mockRes);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: "ORACLE_PASSWORD environment variable is not defined",
      })
    );
  });

  it("should return 200 on successful DB connection and query execution", async () => {
    process.env.ORACLE_PASSWORD = "test-password";
    process.env.ORACLE_USER = "test-user";
    process.env.ORACLE_CONNECTION_STRING = "test-conn";

    const mockExecute = vi.fn().mockResolvedValue({
      rows: [["2026-06-14", "test-user", "test-db"]],
    });
    const mockClose = vi.fn();
    const mockConnection = {
      execute: mockExecute,
      close: mockClose,
    };

    (oracledb.getConnection as Mock).mockResolvedValue(mockConnection);

    await GET(mockReq, mockRes);

    expect(oracledb.getConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        user: "test-user",
        password: "test-password",
        connectString: "test-conn",
      })
    );
    expect(mockExecute).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "Successfully connected to Oracle Database",
        data: [["2026-06-14", "test-user", "test-db"]],
      })
    );
    expect(mockClose).toHaveBeenCalled();
  });

  it("should return 500 when database connection fails", async () => {
    process.env.ORACLE_PASSWORD = "test-password";
    (oracledb.getConnection as Mock).mockRejectedValue(new Error("Connection refused"));

    await GET(mockReq, mockRes);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: "Failed to connect to Oracle Database",
        errorMessage: "Connection refused",
      })
    );
  });
});
