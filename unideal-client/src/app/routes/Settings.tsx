import { motion } from "framer-motion"
import { Settings as SettingsIcon, User, Bell, Shield, CreditCard } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const SETTINGS_SECTIONS = [
  { icon: User, label: "Profile", desc: "Name, avatar, contact info" },
  { icon: Bell, label: "Notifications", desc: "Email and push preferences" },
  { icon: Shield, label: "Privacy & Security", desc: "Password, linked accounts" },
  { icon: CreditCard, label: "Payment", desc: "Bank accounts for withdrawal" },
]

/** Settings page — Phase 6 will implement full settings */
export function Settings() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="text-primary" size={24} />
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      </div>

      <div className="space-y-2">
        {SETTINGS_SECTIONS.map(({ icon: Icon, label, desc }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <button className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/50 transition-all duration-150">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Icon className="text-primary" size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      <Separator className="my-6" />
      <p className="text-center text-sm text-muted-foreground">
        Full settings coming in Phase 6.
      </p>
    </div>
  )
}
