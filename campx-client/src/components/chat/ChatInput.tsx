// ============================================
// ChatInput — text input with send button and location share
// ============================================

import { useState, useRef, type KeyboardEvent, type FormEvent } from "react"
import { motion } from "framer-motion"
import { Send, MapPin, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { LocationPicker } from "@/components/map/LocationPicker"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (content: string, type?: "TEXT" | "LOCATION") => void
  isSending?: boolean
  disabled?: boolean
}

/**
 * Chat message input with:
 * - Auto-expanding textarea
 * - Send on Enter (Shift+Enter for newline)
 * - Location share button → opens LocationPicker dialog
 */
export function ChatInput({ onSend, isSending, disabled }: ChatInputProps) {
  const [text, setText] = useState("")
  const [locationOpen, setLocationOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    locationText: string
  } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = text.trim().length > 0 && !isSending && !disabled

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!canSend) return
    onSend(text.trim(), "TEXT")
    setText("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextChange = (value: string) => {
    setText(value)
    // Auto-resize
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }

  const handleSendLocation = () => {
    if (!selectedLocation) return
    const content = JSON.stringify(selectedLocation)
    onSend(content, "LOCATION")
    setLocationOpen(false)
    setSelectedLocation(null)
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-background p-3"
      >
        <div className="flex items-end gap-2">
          {/* Location button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-primary"
            onClick={() => setLocationOpen(true)}
            disabled={disabled}
          >
            <MapPin className="h-4 w-4" />
          </Button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl bg-muted/50 border border-border",
                "px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50",
                "disabled:opacity-50 max-h-[120px]"
              )}
            />
          </div>

          {/* Send button */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              type="submit"
              size="icon"
              className={cn(
                "shrink-0 h-9 w-9 rounded-xl transition-all",
                canSend
                  ? "bg-primary hover:bg-primary/90 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  : "bg-muted text-muted-foreground"
              )}
              disabled={!canSend}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </form>

      {/* Location picker dialog */}
      <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Share Location
            </DialogTitle>
          </DialogHeader>

          <div className="h-[300px] rounded-xl overflow-hidden border border-border">
            <LocationPicker
              value={selectedLocation ?? undefined}
              onChange={(loc) =>
                setSelectedLocation({
                  lat: loc.lat,
                  lng: loc.lng,
                  locationText: loc.locationText ?? "",
                })
              }
              height="300px"
            />
          </div>

          {selectedLocation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">
                {selectedLocation.locationText || `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-auto shrink-0"
                onClick={() => setSelectedLocation(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLocationOpen(false)
                setSelectedLocation(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendLocation}
              disabled={!selectedLocation}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
