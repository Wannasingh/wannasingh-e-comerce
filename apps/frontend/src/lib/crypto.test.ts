import crypto from "node:crypto";

import { describe, it, expect } from "vitest";

import { decryptPayload } from "./crypto";

// Helper to encrypt payload using the backend's logic
function encryptHelper(text: string, keyString: string): { iv: string; data: string } {
  const key = crypto.createHash("sha256").update(keyString).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    iv: iv.toString("hex"),
    data: encrypted + tag,
  };
}

describe("decryptPayload", () => {
  const testKey = "my_super_secret_encryption_key_32bytes";

  it("should return the original input if it is not an object", async () => {
    expect(await decryptPayload("string-input", testKey)).toBe("string-input");
    expect(await decryptPayload(null, testKey)).toBe(null);
  });

  it("should return the original input if it does not have iv/data", async () => {
    const payload = { test: 123 };
    expect(await decryptPayload(payload, testKey)).toBe(payload);
  });

  it("should decrypt a string payload correctly", async () => {
    const secretMessage = "Hello World! This is a secure communication.";
    const encrypted = encryptHelper(secretMessage, testKey);

    const decrypted = await decryptPayload(encrypted, testKey);
    expect(decrypted).toBe(secretMessage);
  });

  it("should decrypt and parse a JSON payload correctly", async () => {
    const jsonMessage = { user: "john_doe", role: "admin", active: true };
    const encrypted = encryptHelper(JSON.stringify(jsonMessage), testKey);

    const decrypted = await decryptPayload(encrypted, testKey);
    expect(decrypted).toEqual(jsonMessage);
  });

  it("should throw an error if decryption fails with incorrect key", async () => {
    const secretMessage = "Secret message";
    const encrypted = encryptHelper(secretMessage, testKey);

    await expect(decryptPayload(encrypted, "wrong-key")).rejects.toThrow(
      "Failed to decrypt API response payload.",
    );
  });
});
