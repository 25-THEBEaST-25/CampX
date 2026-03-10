import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  GraduationCap,
  Plus,
  Pencil,
  MapPin,
  Globe,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { College } from "@/types"

/** Shape returned by GET /api/colleges (public list). */
interface CollegeWithCounts extends College {
  _count?: { users: number; items: number }
}

/** Input for creating a new college. */
interface CreateCollegeInput {
  name: string
  slug: string
  emailDomain: string
  city: string
  state: string
  campusLat?: number
  campusLng?: number
  logoUrl?: string
}

/** Input for updating an existing college. */
interface UpdateCollegeInput extends Partial<CreateCollegeInput> {
  isActive?: boolean
}

const EMPTY_FORM: CreateCollegeInput = {
  name: "",
  slug: "",
  emailDomain: "",
  city: "",
  state: "",
  campusLat: undefined,
  campusLng: undefined,
  logoUrl: "",
}

/**
 * CollegeManagement — admin page for creating, editing, and toggling colleges.
 * Route: /admin/colleges
 */
export default function CollegeManagement() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingCollege, setEditingCollege] = useState<CollegeWithCounts | null>(null)
  const [form, setForm] = useState<CreateCollegeInput>(EMPTY_FORM)
  const [toggleTarget, setToggleTarget] = useState<CollegeWithCounts | null>(null)

  // ------ Queries ------

  const { data: colleges, isLoading, isError } = useQuery<CollegeWithCounts[]>({
    queryKey: ["admin", "colleges"],
    queryFn: () => api.get<CollegeWithCounts[]>("/api/colleges"),
  })

  // ------ Mutations ------

  const createCollege = useMutation({
    mutationFn: (input: CreateCollegeInput) =>
      api.post<College>("/api/admin/colleges", input),
    onSuccess: () => {
      toast.success("College created successfully")
      qc.invalidateQueries({ queryKey: ["admin", "colleges"] })
      qc.invalidateQueries({ queryKey: ["colleges"] })
      closeForm()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create college")
    },
  })

  const updateCollege = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCollegeInput }) =>
      api.put<College>(`/api/admin/colleges/${id}`, data),
    onSuccess: () => {
      toast.success("College updated successfully")
      qc.invalidateQueries({ queryKey: ["admin", "colleges"] })
      qc.invalidateQueries({ queryKey: ["colleges"] })
      closeForm()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update college")
    },
  })

  // ------ Handlers ------

  function openCreateForm() {
    setEditingCollege(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEditForm(college: CollegeWithCounts) {
    setEditingCollege(college)
    setForm({
      name: college.name,
      slug: college.slug,
      emailDomain: college.emailDomain,
      city: college.city,
      state: college.state,
      campusLat: college.campusLat ?? undefined,
      campusLng: college.campusLng ?? undefined,
      logoUrl: college.logoUrl ?? "",
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingCollege(null)
    setForm(EMPTY_FORM)
  }

  function handleSubmit() {
    if (!form.name || !form.slug || !form.emailDomain || !form.city || !form.state) {
      toast.error("Please fill in all required fields")
      return
    }

    const payload = {
      ...form,
      logoUrl: form.logoUrl || undefined,
      campusLat: form.campusLat || undefined,
      campusLng: form.campusLng || undefined,
    }

    if (editingCollege) {
      updateCollege.mutate({ id: editingCollege.id, data: payload })
    } else {
      createCollege.mutate(payload)
    }
  }

  function handleToggleActive(college: CollegeWithCounts) {
    setToggleTarget(college)
  }

  function confirmToggle() {
    if (!toggleTarget) return
    updateCollege.mutate({
      id: toggleTarget.id,
      data: { isActive: !toggleTarget.isActive },
    })
    setToggleTarget(null)
  }

  /** Auto-generate slug from name. */
  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug === slugify(prev.name) || !prev.slug
        ? slugify(value)
        : prev.slug,
    }))
  }

  // ------ Render ------

  const isSubmitting = createCollege.isPending || updateCollege.isPending
  const activeCount = colleges?.filter((c) => c.isActive).length ?? 0
  const totalUsers = colleges?.reduce((sum, c) => sum + (c._count?.users ?? 0), 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">College Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage partner colleges on the CampX marketplace
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_30px_rgba(168,85,247,0.55)] hover:-translate-y-0.5 transition-all duration-200"
          onClick={openCreateForm}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add College
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{colleges?.length ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Total Colleges</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* College list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-destructive">Failed to load colleges</p>
            <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin", "colleges"] })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : !colleges?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No colleges added yet</p>
            <Button size="sm" onClick={openCreateForm}>
              Add First College
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {colleges.map((college) => (
            <Card
              key={college.id}
              className={cn(
                "border-border bg-card transition-colors",
                !college.isActive && "opacity-60"
              )}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {/* Logo or fallback */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {college.logoUrl ? (
                    <img
                      src={college.logoUrl}
                      alt={college.name}
                      className="h-10 w-10 rounded-md object-cover"
                      loading="lazy"
                      width={40}
                      height={40}
                    />
                  ) : (
                    <GraduationCap className="h-6 w-6 text-primary" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{college.name}</h3>
                    <Badge variant={college.isActive ? "default" : "secondary"}>
                      {college.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {college.emailDomain}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {college.city}, {college.state}
                    </span>
                    {college._count && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {college._count.users} students · {college._count.items} listings
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit college"
                    onClick={() => openEditForm(college)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={college.isActive ? "Deactivate" : "Activate"}
                    onClick={() => handleToggleActive(college)}
                  >
                    {college.isActive ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCollege ? "Edit College" : "Add New College"}
            </DialogTitle>
            <DialogDescription>
              {editingCollege
                ? `Update details for ${editingCollege.name}`
                : "Enter the details for the new college"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="college-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="college-name"
                placeholder="Sardar Patel Institute of Technology"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            {/* Slug */}
            <div className="grid gap-1.5">
              <Label htmlFor="college-slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="college-slug"
                placeholder="spit"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (lowercase, no spaces)
              </p>
            </div>

            {/* Email Domain */}
            <div className="grid gap-1.5">
              <Label htmlFor="college-domain">
                Email Domain <span className="text-destructive">*</span>
              </Label>
              <Input
                id="college-domain"
                placeholder="spit.ac.in"
                value={form.emailDomain}
                onChange={(e) => setForm((f) => ({ ...f, emailDomain: e.target.value }))}
              />
            </div>

            {/* City + State */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="college-city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="college-city"
                  placeholder="Mumbai"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="college-state">
                  State <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="college-state"
                  placeholder="Maharashtra"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
              </div>
            </div>

            {/* Campus Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="college-lat">Campus Latitude</Label>
                <Input
                  id="college-lat"
                  type="number"
                  step="any"
                  placeholder="19.1234"
                  value={form.campusLat ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      campusLat: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="college-lng">Campus Longitude</Label>
                <Input
                  id="college-lng"
                  type="number"
                  step="any"
                  placeholder="72.8367"
                  value={form.campusLng ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      campusLng: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
            </div>

            {/* Logo URL */}
            <div className="grid gap-1.5">
              <Label htmlFor="college-logo">Logo URL</Label>
              <Input
                id="college-logo"
                placeholder="https://..."
                value={form.logoUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeForm} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingCollege ? "Save Changes" : "Create College"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle active confirmation */}
      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isActive ? "Deactivate College" : "Activate College"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.isActive
                ? `Deactivating "${toggleTarget.name}" will hide it from the college selector. Existing users won't be affected.`
                : `Activating "${toggleTarget?.name}" will make it available in the college selector for new sign-ups.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={toggleTarget?.isActive ? "bg-destructive hover:bg-destructive/90" : ""}
              onClick={confirmToggle}
            >
              {toggleTarget?.isActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============================================
// Helpers
// ============================================

/** Converts a string to a URL-safe slug. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
