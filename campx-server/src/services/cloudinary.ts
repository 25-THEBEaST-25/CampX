import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * Generates a signed URL for a private/authenticated Cloudinary asset.
 * Used for admin viewing of college ID card images.
 */
export function generateSignedUrl(
  publicId: string,
  expiresInSeconds = 300
): string {
  const expireAt = Math.floor(Date.now() / 1000) + expiresInSeconds
  return cloudinary.url(publicId, {
    sign_url: true,
    type: "authenticated",
    expires_at: expireAt,
  })
}

/**
 * Deletes a Cloudinary asset by its public ID.
 * Used when listings are deleted or verification images are cleaned up.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

/**
 * Deletes multiple Cloudinary assets in a single API call.
 */
export async function deleteImages(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return
  await cloudinary.api.delete_resources(publicIds)
}

export { cloudinary }
