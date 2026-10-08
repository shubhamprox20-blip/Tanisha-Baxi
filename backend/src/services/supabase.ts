import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

const supabase = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

/**
 * Upload a file buffer to Supabase Storage
 * and return its public URL.
 */
export async function uploadToSupabase(
  buffer: Buffer,
  originalName: string,
  hero = false,
): Promise<string> {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "jpg";

  const filePath = hero
  ? "hero.jpg"
  : `products/${randomUUID()}.${ext}`;

  const contentType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "application/octet-stream";

  const { error } = await supabase.storage
    .from(env.supabase.bucket)
    .upload(filePath, buffer, {
      contentType,
      upsert: hero,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(env.supabase.bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}