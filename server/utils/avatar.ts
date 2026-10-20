import getSupabaseAdmin from "../config/supabaseAdmin";

const AVATAR_BUCKET = "avatars";

async function ensureAvatarBucket() {
  const { data } = await getSupabaseAdmin().storage.getBucket(AVATAR_BUCKET);
  if (data) return;

  const { error } = await getSupabaseAdmin().storage.createBucket(AVATAR_BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

/**
 * Avatars must not live in user_metadata as base64: Supabase copies user_metadata
 * into every access token, which then becomes too large for cookies and headers.
 * Uploads a `data:` URL to Storage and returns its public URL.
 */
export async function uploadAvatarDataUrl(userId: string, dataUrl: string): Promise<string> {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid avatar image");
  }

  const [, contentType, base64] = match;
  const extension = contentType.split("/")[1].replace("jpeg", "jpg").replace(/\+.*/, "");
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  await ensureAvatarBucket();

  const { error } = await getSupabaseAdmin().storage
    .from(AVATAR_BUCKET)
    .upload(path, Buffer.from(base64, "base64"), { contentType, upsert: true });
  if (error) {
    throw error;
  }

  return getSupabaseAdmin().storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}
