// ============================================
// Cloudinary helpers — URL transform + upload
// ============================================

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

/**
 * Transforms a Cloudinary URL to add responsive optimisations.
 * Appends width, f_auto (format), and q_auto (quality) transforms.
 */
export function cloudinaryUrl(url: string, width: number): string {
  if (!url || !url.includes("cloudinary.com")) return url
  return url.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`)
}

/**
 * Generates a srcset string for responsive Cloudinary images.
 * Widths: 400, 800, 1200.
 */
export function cloudinarySrcSet(url: string): string {
  return [400, 800, 1200]
    .map((w) => `${cloudinaryUrl(url, w)} ${w}w`)
    .join(", ")
}

/**
 * Returns the base Cloudinary upload endpoint URL for the widget.
 */
export function cloudinaryUploadUrl(): string {
  return `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
}

export type CloudinaryUploadPreset =
  | "items"
  | "avatars"
  | "ids"

const PRESET_MAP: Record<CloudinaryUploadPreset, string> = {
  items: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_ITEMS,
  avatars: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_AVATARS,
  ids: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_IDS,
}

export function getUploadPreset(preset: CloudinaryUploadPreset): string {
  return PRESET_MAP[preset]
}

export interface CloudinaryResponse {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
}

/**
 * Uploads a single file to Cloudinary using an unsigned upload preset.
 */
export async function uploadToCloudinary(
  file: File,
  preset: CloudinaryUploadPreset
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", getUploadPreset(preset))

  const response = await fetch(cloudinaryUploadUrl(), {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Cloudinary upload failed")
  }

  const data = (await response.json()) as CloudinaryResponse
  return { url: data.secure_url, publicId: data.public_id }
}
