/**
 * Decrypts AES-256-CBC encrypted payload from the backend.
 * Uses the native Web Crypto API (supported in all modern browsers).
 */
export async function decryptPayload(
  encrypted: any,
  keyString: string = import.meta.env.PUBLIC_API_ENCRYPTION_KEY || ""
): Promise<any> {
  // If the payload does not match the encrypted structure, return it directly
  if (!encrypted || typeof encrypted !== 'object' || !encrypted.iv || !encrypted.data) {
    return encrypted;
  }

  try {
    // 1. Convert hex IV and hex data to Uint8Arrays
    const ivBytes = encrypted.iv.match(/.{1,2}/g);
    const dataBytes = encrypted.data.match(/.{1,2}/g);
    
    if (!ivBytes || !dataBytes) {
      return encrypted;
    }

    const iv = new Uint8Array(ivBytes.map((byte: string) => Number.parseInt(byte, 16)));
    const encryptedData = new Uint8Array(dataBytes.map((byte: string) => Number.parseInt(byte, 16)));

    // 2. Hash keyString with SHA-256 to match backend key derivation
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyString);
    
    // Support both browser and Node.js SSR environments for Web Crypto
    const webCrypto = globalThis.crypto || globalThis.window?.crypto;
      
    if (!webCrypto || !webCrypto.subtle) {
      throw new Error("Web Crypto API is not supported in this environment.");
    }

    const keyHash = await webCrypto.subtle.digest("SHA-256", keyData);

    // 3. Import the derived key for AES-GCM
    const cryptoKey = await webCrypto.subtle.importKey(
      "raw",
      keyHash,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // 4. Decrypt the data
    const decryptedBuffer = await webCrypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      cryptoKey,
      encryptedData
    );

    // 5. Decode the decrypted bytes to string
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);

    // 6. Attempt to parse as JSON, otherwise return string
    try {
      return JSON.parse(decryptedText);
    } catch {
      return decryptedText;
    }
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error("Failed to decrypt API response payload.");
  }
}
