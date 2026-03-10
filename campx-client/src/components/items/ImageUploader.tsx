// ============================================
// ImageUploader — reusable drag-and-drop Cloudinary upload component
// ============================================

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, ImageIcon, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadToCloudinary, type CloudinaryUploadPreset } from "@/lib/cloudinary"
import { MAX_IMAGE_SIZE_MB, ACCEPTED_IMAGE_TYPES } from "@/lib/constants"

export interface UploadedImage {
  url: string
  publicId: string
}

interface ImageUploaderProps {
  /** Cloudinary upload preset to use */
  preset: CloudinaryUploadPreset
  /** Maximum number of images allowed */
  maxFiles?: number
  /** Already-uploaded images (controlled) */
  value: UploadedImage[]
  /** Callback when images change */
  onChange: (images: UploadedImage[]) => void
  /** Custom class for the outer wrapper */
  className?: string
  /** Label shown in the dropzone */
  label?: string
  /** Whether component is disabled */
  disabled?: boolean
}

interface UploadingFile {
  id: string
  file: File
  preview: string
  progress: number
}

/**
 * Drag-and-drop image uploader with Cloudinary integration.
 * Supports multi-file upload, previews, progress bars, and reordering.
 */
export function ImageUploader({
  preset,
  maxFiles = 1,
  value,
  onChange,
  className,
  label = "Drop images here or click to browse",
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const remainingSlots = maxFiles - value.length - uploading.length

  /** Validates file type and size */
  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, and WebP images are accepted"
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return `Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB`
    }
    return null
  }, [])

  /** Handles file selection from input or drag-and-drop */
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null)

      const fileArray = Array.from(files).slice(0, remainingSlots)
      if (fileArray.length === 0) {
        if (remainingSlots <= 0) {
          setError(`Maximum ${maxFiles} image${maxFiles > 1 ? "s" : ""} allowed`)
        }
        return
      }

      // Validate all files first
      for (const file of fileArray) {
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          return
        }
      }

      // Create upload entries with previews
      const entries: UploadingFile[] = fileArray.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
      }))

      setUploading((prev) => [...prev, ...entries])

      // Upload all in parallel
      const results = await Promise.allSettled(
        entries.map(async (entry) => {
          try {
            // Simulate progress (Cloudinary doesn't expose XHR progress via fetch)
            const progressInterval = setInterval(() => {
              setUploading((prev) =>
                prev.map((u) =>
                  u.id === entry.id
                    ? { ...u, progress: Math.min(u.progress + 15, 90) }
                    : u
                )
              )
            }, 200)

            const result = await uploadToCloudinary(entry.file, preset)

            clearInterval(progressInterval)
            URL.revokeObjectURL(entry.preview)

            return result
          } catch {
            URL.revokeObjectURL(entry.preview)
            throw new Error(`Failed to upload ${entry.file.name}`)
          }
        })
      )

      // Collect successful uploads
      const successes: UploadedImage[] = []
      const errors: string[] = []

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          successes.push(result.value)
        } else {
          errors.push(result.reason?.message ?? "Upload failed")
        }
      })

      // Clear uploading state
      setUploading((prev) =>
        prev.filter((u) => !entries.some((e) => e.id === u.id))
      )

      if (successes.length > 0) {
        onChange([...value, ...successes])
      }

      if (errors.length > 0) {
        setError(errors[0]!)
      }
    },
    [remainingSlots, maxFiles, validateFile, preset, value, onChange]
  )

  /** Remove an uploaded image */
  const handleRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [value, onChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      if (!disabled && e.dataTransfer.files.length > 0) {
        void handleFiles(e.dataTransfer.files)
      }
    },
    [disabled, handleFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void handleFiles(e.target.files)
        // Reset input so the same file can be selected again
        e.target.value = ""
      }
    },
    [handleFiles]
  )

  return (
    <div className={cn("space-y-3", className)}>
      {/* Uploaded images grid */}
      <AnimatePresence mode="popLayout">
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "grid gap-3",
              maxFiles === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
            )}
          >
            {value.map((img, index) => (
              <motion.div
                key={img.publicId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-[#121212]"
              >
                <img
                  src={img.url}
                  alt={`Upload ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                )}
                {maxFiles > 1 && (
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                    {index + 1}
                  </span>
                )}
              </motion.div>
            ))}

            {/* Uploading previews */}
            {uploading.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-[#121212]"
              >
                <img
                  src={entry.preview}
                  alt="Uploading"
                  className="h-full w-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div className="mx-4 h-1.5 w-3/4 overflow-hidden rounded-full bg-zinc-700">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${entry.progress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropzone — shown when there's room for more uploads */}
      {remainingSlots > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
            isDragOver
              ? "border-primary bg-primary/10"
              : "border-zinc-700 bg-[#121212] hover:border-zinc-500",
            disabled && "cursor-not-allowed opacity-50",
            uploading.length > 0 && "py-4"
          )}
        >
          {uploading.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </div>
          ) : (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                {isDragOver ? (
                  <ImageIcon className="h-6 w-6 text-primary" />
                ) : (
                  <Upload className="h-6 w-6 text-zinc-400" />
                )}
              </div>
              <p className="text-sm text-zinc-300">{label}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {ACCEPTED_IMAGE_TYPES.map((t) => t.replace("image/", "").toUpperCase()).join(", ")} · Max {MAX_IMAGE_SIZE_MB}MB
              </p>
            </>
          )}
        </motion.div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple={maxFiles > 1}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-sm text-red-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
