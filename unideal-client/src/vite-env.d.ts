/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_CLOUDINARY_CLOUD_NAME: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET_ITEMS: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET_AVATARS: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET_IDS: string
  readonly VITE_ABLY_API_KEY: string
  readonly VITE_MAPBOX_ACCESS_TOKEN: string
  readonly VITE_RAZORPAY_KEY_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
