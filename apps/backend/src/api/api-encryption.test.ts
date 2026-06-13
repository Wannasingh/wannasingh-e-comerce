import crypto from "node:crypto";

import { describe, it, expect } from "vitest";

import { encryptPayload } from "./api-encryption";

describe("encryptPayload", () => {
  const testKey = "my_super_secret_encryption_key_32bytes";
  const testText = "My secure secret payload";

  it("should return an object with iv and data as hex strings", () => {
    const result = encryptPayload(testText, testKey);
    expect(result).toHaveProperty("iv");
    expect(result).toHaveProperty("data");
    expect(typeof result.iv).toBe("string");
    expect(typeof result.data).toBe("string");
    expect(result.iv).toHaveLength(24); // 12 bytes = 24 hex chars
  });

  it("should produce a payload that can be decrypted successfully", () => {
    const result = encryptPayload(testText, testKey);

    // Decrypt the payload natively
    const key = crypto.createHash("sha256").update(testKey).digest();
    const iv = Buffer.from(result.iv, "hex");

    // GCM tag is the last 16 bytes (32 hex characters)
    const dataHex = result.data;
    const ciphertextHex = dataHex.slice(0, -32);
    const tagHex = dataHex.slice(-32);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    expect(decrypted).toBe(testText);
  });
});
