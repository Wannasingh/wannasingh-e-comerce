import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  const customerId = req.auth_context.actor_id;
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { avatar } = req.body as { avatar?: string };
  if (!avatar) {
    res.status(400).json({ message: "Image data is required" });
    return;
  }

  // Parse Base64 image
  const matches = /^data:([A-Za-z-+/]+);base64,(.+)$/.exec(avatar);
  if (matches?.length !== 3) {
    res.status(400).json({ message: "Invalid image format. Expected Base64 data URL." });
    return;
  }

  const mimeType = matches[1];
  const base64Content = matches[2];
  if (!mimeType || !base64Content) {
    res.status(400).json({ message: "Invalid image content" });
    return;
  }

  const buffer = Buffer.from(base64Content, "base64");

  // Determine file extension
  let ext = "jpg";
  if (mimeType.includes("png")) ext = "png";
  else if (mimeType.includes("webp")) ext = "webp";
  else if (mimeType.includes("gif")) ext = "gif";

  const filename = `avatar-${customerId}-${String(Date.now())}.${ext}`;

  // Supabase storage bucket parameters
  const supabaseUrlBase = process.env.SUPABASE_URL ?? "https://jbzdwpcbfcasmzkkwgpx.supabase.co";
  const supabaseUrl = `${supabaseUrlBase}/storage/v1/object/profiles/${filename}`;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    res.status(500).json({ message: "Supabase storage is not configured on the server" });
    return;
  }

  try {
    // Upload directly to Supabase Storage via REST API
    const uploadRes = await fetch(supabaseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${anonKey}`,
        "Content-Type": mimeType,
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error("Supabase Storage upload failed:", errorText);
      res.status(500).json({ message: "Failed to upload avatar to storage" });
      return;
    }

    // Retrieve public URL
    const publicUrl = `${supabaseUrlBase}/storage/v1/object/public/profiles/${filename}`;

    // Update customer metadata
    const customerService = req.scope.resolve("customer");
    const customer = await customerService.retrieveCustomer(customerId);
    
    const updatedCustomer = await customerService.updateCustomers(customerId, {
      metadata: {
        ...customer.metadata,
        avatar_url: publicUrl,
      },
    });

    res.status(200).json({ customer: updatedCustomer });
  } catch (err: unknown) {
    console.error("Avatar upload handler error:", err);
    const message = err instanceof Error ? err.message : "An error occurred during avatar upload";
    res.status(500).json({ message });
  }
}
