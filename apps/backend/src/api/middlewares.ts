/* eslint-disable */
import { defineMiddlewares, authenticate } from "@medusajs/medusa";

import { encryptPayload } from "./api-encryption";

const encryptionKey =
  process.env.API_ENCRYPTION_KEY || "default_super_secret_encryption_key_32bytes";

const encryptionMiddleware = (_req: any, res: any, next: any) => {
  const originalSend = res.send;

  res.send = function (body: any) {
    const contentType = res.get("Content-Type");
    const isJson = contentType?.includes("application/json");

    if (isJson && body) {
      try {
        const bodyStr = typeof body === "string" ? body : JSON.stringify(body);

        // Only encrypt if it's not already encrypted (e.g. doesn't have iv and data structure)
        let isAlreadyEncrypted = false;
        try {
          const parsed = JSON.parse(bodyStr);
          if (parsed?.iv && parsed.data && Object.keys(parsed).length === 2) {
            isAlreadyEncrypted = true;
          }
        } catch {
          // ignore
        }

        if (!isAlreadyEncrypted) {
          const encrypted = encryptPayload(bodyStr, encryptionKey);
          const encryptedBody = JSON.stringify(encrypted);

          res.set("Content-Type", "application/json");
          return originalSend.call(this, encryptedBody);
        }
      } catch (err) {
        console.error("Encryption failed in middleware:", err);
      }
    }

    return originalSend.call(this, body);
  };

  next();
};

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/customers/me/avatar",
      bodyParser: {
        sizeLimit: "15mb",
      },
      middlewares: [authenticate("customer", ["session", "bearer"]), encryptionMiddleware],
    },
    {
      matcher: "/store/customers/me/request-seller",
      middlewares: [authenticate("customer", ["session", "bearer"]), encryptionMiddleware],
    },
    {
      matcher: "/store/admin-api/customers/*/approve-seller",
      middlewares: [authenticate("customer", ["session", "bearer"]), encryptionMiddleware],
    },
    {
      matcher: "/store/admin-api/customers/*/reject-seller",
      middlewares: [authenticate("customer", ["session", "bearer"]), encryptionMiddleware],
    },
    {
      matcher: "/store/*",
      middlewares: [encryptionMiddleware],
    },
    {
      matcher: "/auth/*",
      middlewares: [encryptionMiddleware],
    },
  ],
});
