import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

export function encryptPayload(text: string, keyString: string): { iv: string; data: string } {
  // Hash the key using SHA-256 to ensure it's exactly 32 bytes (256 bits)
  const key = crypto.createHash("sha256").update(keyString).digest();
  const iv = crypto.randomBytes(12); // GCM standard IV is 12 bytes
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  
  return {
    iv: iv.toString("hex"),
    data: encrypted + tag,
  };
}
