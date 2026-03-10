// ============================================
// Settings — edit profile + notification preferences
// Tasks: 6F.4
// ============================================

import { useMemo, useState, useRef } from "react"
import { motion } from "framer-motion"
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Camera,
  Loader2,
  Mail,
  BellRing,
  CheckCircle2,
  Phone,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useUserProfile,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks"
import { useUpdateProfile } from "@/hooks/usePublicProfile"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { cn } from "@/lib/utils"

/** Readable labels for notification type keys */
const NOTIFICATION_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  NEW_MESSAGE: { label: "New messages", description: "When someone sends you a chat message" },
  PAYMENT_RECEIVED: { label: "Payment received", description: "When a buyer makes a payment" },
  PAYMENT_RELEASED: { label: "Payment released", description: "When escrow funds are released to you" },
  PAYMENT_REFUNDED: { label: "Payment refunded", description: "When a payment is refunded" },
  ORDER_UPDATE: { label: "Order updates", description: "Status changes on your transactions" },
  ITEM_SOLD: { label: "Item sold", description: "When someone purchases your listing" },
  VERIFICATION_APPROVED: { label: "Verification approved", description: "When your ID is verified" },
  VERIFICATION_REJECTED: { label: "Verification rejected", description: "When your ID is rejected" },
  REVIEW_RECEIVED: { label: "New review", description: "When someone reviews you" },
}

/** Settings page with edit profile + notification preferences */
export function Settings() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="text-primary" size={24} />
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      </div>

      {/* Edit Profile (6F.4) */}
      <EditProfileSection />

      <Separator className="my-6" />

      {/* Notification Preferences */}
      <NotificationPreferencesSection />
    </div>
  )
}

// ── Edit Profile Section ─────────────────────────────────────────────────────

function EditProfileSection() {
  const { data: profile, isLoading } = useUserProfile()
  const updateProfile = useUpdateProfile()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form values when profile loads
  if (profile && !initialized) {
    setFullName(profile.fullName || "")
    setPhone(profile.phone || "")
    setAvatarUrl(profile.avatarUrl || "")
    setInitialized(true)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadToCloudinary(file, "avatars")
      setAvatarUrl(result.url)
    } catch {
      // Upload failed — user can retry
    } finally {
      setUploading(false)
    }
  }

  const handleSave = () => {
    setSaved(false)
    updateProfile.mutate(
      {
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 3000)
        },
      }
    )
  }

  const hasChanges =
    initialized &&
    profile &&
    (fullName !== (profile.fullName || "") ||
      phone !== (profile.phone || "") ||
      avatarUrl !== (profile.avatarUrl || ""))

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-5">
        <User className="text-primary" size={20} />
        <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="space-y-5 rounded-xl border border-border p-5 bg-card">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 border-2 border-zinc-700">
                <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                <AvatarFallback className="bg-purple-500/20 text-purple-300 text-lg font-semibold">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground">
                Click to upload a new avatar
              </p>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm text-zinc-400">
              Full Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="bg-zinc-950 border-zinc-800 text-zinc-200"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm text-zinc-400 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="bg-zinc-950 border-zinc-800 text-zinc-200"
            />
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateProfile.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-green-400 flex items-center gap-1"
              >
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </motion.span>
            )}
            {updateProfile.isError && (
              <span className="text-sm text-red-400">Failed to save. Please try again.</span>
            )}
          </div>
        </div>
      )}
    </motion.section>
  )
}

// ── Notification Preferences Section ─────────────────────────────────────────

function NotificationPreferencesSection() {
  const { data: prefs, isLoading, isError } = useNotificationPreferences()
  const updatePrefs = useUpdateNotificationPreferences()

  // Derive the list of notification types from current prefs
  const notifTypes = useMemo(() => {
    if (!prefs) return []
    // Get all unique keys from both email and inApp
    const keys = new Set([
      ...Object.keys(prefs.email ?? {}),
      ...Object.keys(prefs.inApp ?? {}),
    ])
    return Array.from(keys).sort()
  }, [prefs])

  const handleToggle = (
    channel: "email" | "inApp",
    type: string,
    checked: boolean
  ) => {
    updatePrefs.mutate({
      [channel]: { [type]: checked },
    })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Bell className="text-primary" size={20} />
        <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
        {updatePrefs.isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Failed to load notification preferences. Please try again.
        </p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/30 border-b border-border">
            <div className="flex-1" />
            <div className="flex items-center gap-1 w-14 justify-center">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase">Email</span>
            </div>
            <div className="flex items-center gap-1 w-14 justify-center">
              <BellRing className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase">In-App</span>
            </div>
          </div>

          {/* Rows */}
          {notifTypes.map((type, i) => {
            const meta = NOTIFICATION_TYPE_LABELS[type] ?? {
              label: type.replace(/_/g, " ").toLowerCase(),
              description: "",
            }
            const emailOn = prefs?.email?.[type] ?? false
            const inAppOn = prefs?.inApp?.[type] ?? true

            return (
              <div
                key={type}
                className={cn(
                  "flex items-center gap-4 px-4 py-3",
                  i < notifTypes.length - 1 && "border-b border-border"
                )}
              >
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium text-foreground block">
                    {meta.label}
                  </Label>
                  {meta.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {meta.description}
                    </p>
                  )}
                </div>

                <div className="w-14 flex justify-center">
                  <Switch
                    checked={emailOn}
                    onCheckedChange={(checked) => handleToggle("email", type, checked)}
                    aria-label={`${meta.label} email notifications`}
                  />
                </div>

                <div className="w-14 flex justify-center">
                  <Switch
                    checked={inAppOn}
                    onCheckedChange={(checked) => handleToggle("inApp", type, checked)}
                    aria-label={`${meta.label} in-app notifications`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.section>
  )
}
