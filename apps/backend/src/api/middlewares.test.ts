import { describe, it, expect, vi } from "vitest";

import { encryptionMiddleware } from "./middlewares";

import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http";

describe("encryptionMiddleware", () => {
  it("should call next() immediately", () => {
    const req = {} as MedusaRequest;
    const res = {
      send: vi.fn(),
    } as unknown as MedusaResponse;
    const next = vi.fn() as unknown as MedusaNextFunction;

    encryptionMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should not encrypt if content type is not application/json", () => {
    const req = {} as MedusaRequest;
    const mockSend = vi.fn();
    const res = {
      get: vi.fn().mockReturnValue("text/html"),
      send: mockSend,
    } as unknown as MedusaResponse;
    const next = vi.fn() as unknown as MedusaNextFunction;

    encryptionMiddleware(req, res, next);

    const testBody = "<html></html>";
    res.send(testBody);

    expect(mockSend).toHaveBeenCalledWith(testBody);
  });

  it("should encrypt JSON response payloads", () => {
    const req = {} as MedusaRequest;
    const mockSend = vi.fn();
    const mockSet = vi.fn();
    const res = {
      get: vi.fn().mockReturnValue("application/json"),
      set: mockSet,
      send: mockSend,
    } as unknown as MedusaResponse;
    const next = vi.fn() as unknown as MedusaNextFunction;

    encryptionMiddleware(req, res, next);

    const testBody = { message: "hello" };
    res.send(testBody);

    expect(mockSet).toHaveBeenCalledWith("Content-Type", "application/json");
    expect(mockSend).toHaveBeenCalled();

    const sentArg = mockSend.mock.calls[0][0] as string;
    expect(typeof sentArg).toBe("string");

    const parsed = JSON.parse(sentArg) as { iv?: unknown; data?: unknown };
    expect(parsed).toHaveProperty("iv");
    expect(parsed).toHaveProperty("data");
  });

  it("should not double-encrypt if payload is already encrypted", () => {
    const req = {} as MedusaRequest;
    const mockSend = vi.fn();
    const res = {
      get: vi.fn().mockReturnValue("application/json"),
      send: mockSend,
    } as unknown as MedusaResponse;
    const next = vi.fn() as unknown as MedusaNextFunction;

    encryptionMiddleware(req, res, next);

    const alreadyEncryptedBody = JSON.stringify({ iv: "123456", data: "abcdef" });
    res.send(alreadyEncryptedBody);

    expect(mockSend).toHaveBeenCalledWith(alreadyEncryptedBody);
  });
});
