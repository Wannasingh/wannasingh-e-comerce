/**
 * Decrypts AES-256-CBC encrypted payload from the backend.
 * Uses the native Web Crypto API (supported in all modern browsers).
 */

interface EncryptedPayload {
  iv?: string;
  data?: string;
  [key: string]: unknown;
}

export async function decryptPayload(
  encrypted: unknown,
  keyString: string = (import.meta.env.PUBLIC_API_ENCRYPTION_KEY as string | undefined) ?? "",
): Promise<unknown> {
  // If the payload does not match the encrypted structure, return it directly
  if (!encrypted || typeof encrypted !== "object") {
    return encrypted;
  }

  const payload = encrypted as EncryptedPayload;
  if (!payload.iv || !payload.data) {
    return encrypted;
  }

  try {
    // 1. Convert hex IV and hex data to Uint8Arrays
    const ivBytes = payload.iv.match(/.{1,2}/g);
    const dataBytes = payload.data.match(/.{1,2}/g);

    if (!ivBytes || !dataBytes) {
      return encrypted;
    }

    const iv = new Uint8Array(ivBytes.map((byte) => Number.parseInt(byte, 16)));
    const encryptedData = new Uint8Array(dataBytes.map((byte) => Number.parseInt(byte, 16)));

    // 2. Hash keyString with SHA-256 to match backend key derivation
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyString);

    // Support both browser and Node.js SSR environments for Web Crypto
    const webCrypto = globalThis.crypto;
    const subtle = webCrypto.subtle as SubtleCrypto | undefined;

    if (!subtle) {
      throw new Error("Web Crypto API is not supported in this environment.");
    }

    const keyHash = await subtle.digest("SHA-256", keyData);

    // 3. Import the derived key for AES-GCM
    const cryptoKey = await subtle.importKey("raw", keyHash, { name: "AES-GCM" }, false, [
      "decrypt",
    ]);

    // 4. Decrypt the data
    const decryptedBuffer = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      cryptoKey,
      encryptedData,
    );

    // 5. Decode the decrypted bytes to string
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);

    // 6. Attempt to parse as JSON, otherwise return string
    try {
      return JSON.parse(decryptedText) as unknown;
    } catch {
      return decryptedText;
    }
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error("Failed to decrypt API response payload.");
  }
}
