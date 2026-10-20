"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Field, StatusMessage } from "@/components/dashboard/dashboard-ui"
import { formatDate, isValidUrl, normalizeSkills, relativeTime } from "@/lib/dashboard-data"
import { Pencil, Plus, Trash2, X, Users, ShieldCheck, Settings2, ChevronDown, Check, MessageSquareWarning } from "lucide-react"

type FieldKind = "text" | "textarea" | "url" | "select"
type FieldConfig = { name: string; label: string; kind?: FieldKind; required?: boolean; placeholder?: string; hint?: string; options?: readonly string[] }

const resourceTypes = ["PDF", "Guide", "Workbook", "Video", "Recording", "Audio", "Link"] as const

const sections = {
  announcements: { title: "Opportunities", singular: "opportunity", destination: "Member dashboard → The Network", fields: [
    { name: "title", label: "Title", required: true },
    { name: "body", label: "Details", kind: "textarea", required: true, hint: "Members can expand and respond by email." },
  ] },
  courses: { title: "Courses", singular: "course", destination: "Member dashboard → The Institute, and the public Institute page", fields: [
    { name: "title", label: "Course title", required: true },
    { name: "instructor", label: "Instructor", required: true },
    { name: "category", label: "Category", placeholder: "e.g. Leadership", hint: "Used for the Institute category filters." },
    { name: "is_free", label: "Access type", kind: "select", required: true, options: ["Free", "Paid"], hint: "Free courses grant access as soon as a member signs up. Paid courses need admin approval." },
    { name: "price", label: "Price", placeholder: "e.g. From R400 or Free" },
    { name: "slug", label: "Slug", placeholder: "e.g. building-self", hint: "Optional unique id. Generated from the title if left blank." },
    { name: "duration", label: "Duration", placeholder: "e.g. 6 weeks" },
    { name: "event_date", label: "Start date", placeholder: "YYYY-MM-DD or 5, 6 and 7 November 2026" },
    { name: "thumbnail_url", label: "Thumbnail link", kind: "url", placeholder: "https://… or /courses/example.png" },
    { name: "description", label: "Description", kind: "textarea", required: true },
  ] },
  resources: { title: "Resources", singular: "resource", destination: "Member dashboard → The Institute → Resource library", fields: [
    { name: "title", label: "Title", required: true },
    { name: "resource_type", label: "Type", kind: "select", required: true, options: resourceTypes, hint: "Video, Recording and Audio show a Watch button." },
    { name: "url", label: "Link", kind: "url", required: true, placeholder: "https://…" },
    { name: "description", label: "Description", kind: "textarea" },
  ] },
  blog_posts: { title: "Blog posts", singular: "blog post", destination: "Public site", fields: [
    { name: "title", label: "Title", required: true },
    { name: "instructor", label: "Author", required: true },
    { name: "event_date", label: "Date", placeholder: "YYYY-MM-DD" },
    { name: "thumbnail_url", label: "Thumbnail link", kind: "url", placeholder: "https://…" },
    { name: "media_url", label: "Optional media link", kind: "url", placeholder: "https://…" },
    { name: "body", label: "Body", kind: "textarea", required: true },
  ] },
} satisfies Record<string, { title: string; singular: string; destination: string; fields: FieldConfig[] }>

type Section = keyof typeof sections
type Item = Record<string, string | boolean | null> & { id: string; published?: boolean; is_free?: boolean }
type Profile = { headline?: string; company?: string; role?: string; bio?: string; location?: string; website?: string; linkedin_url?: string; skills?: unknown; updated_at?: string }
type User = { id: string; email?: string; created_at: string; last_sign_in_at?: string; email_confirmed_at?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; profile?: Profile | null }
type Enrollment = { id: string; user_id: string; course_id: string; status: "pending" | "enrolled" | "revoked"; source: string; created_at: string }
type CourseOption = { id: string; title: string; is_free: boolean }

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)
}
const accessOptions = ["prepared", "updates", "active", "blocked"] as const
const accessLabels: Record<string, string> = { prepared: "Dashboard is being prepared", updates: "Updates to the dashboard are being made", active: "Active", blocked: "Blocked" }
const reviewLabels: Record<string, string> = { pending_review: "Profile pending review", approved: "Profile approved", rejected: "Profile changes requested" }
const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-sm"

function profileStatusOf(user: User) { return String(user.user_metadata?.professional_profile_status || "") }

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [section, setSection] = useState<Section>("announcements")
  const [form, setForm] = useState<Record<string, string>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [items, setItems] = useState<Item[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [courseCatalog, setCourseCatalog] = useState<CourseOption[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [userSort, setUserSort] = useState<"name" | "email" | "created_at" | "verified">("created_at")
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending_review" | "approved" | "rejected" | "none">("all")
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [userStatus, setUserStatus] = useState("")
  const [verificationStatus, setVerificationStatus] = useState("")
  const [dashboardAnnouncement, setDashboardAnnouncement] = useState("The Spring Cohort applications close Friday. Secure your seat now.")
  const [landingAnnouncement, setLandingAnnouncement] = useState("We have launched. Don\'t miss your spot.")
  const [announcementStatus, setAnnouncementStatus] = useState("")
  const [accessBusy, setAccessBusy] = useState("")

  const config = sections[section]
  const dashboardAnnouncementKey = "__dashboard_announcement__"
  const landingAnnouncementKey = "__landing_announcement__"

  async function loadAnnouncementSettings() {
    const { data } = await createClient().from("announcements").select("title, body, published").in("title", [dashboardAnnouncementKey, landingAnnouncementKey]).eq("published", true)
    const dashboard = data?.find((item) => item.title === dashboardAnnouncementKey)
    const landing = data?.find((item) => item.title === landingAnnouncementKey)
    if (dashboard?.body) setDashboardAnnouncement(dashboard.body)
    if (landing?.body) setLandingAnnouncement(landing.body)
  }
  async function saveAnnouncementSetting(title: string, body: string) {
    if (!body.trim()) { setAnnouncementStatus("Announcements can't be empty."); return }
    setAnnouncementStatus("Saving announcement...")
    const client = createClient()
    const { data: existing } = await client.from("announcements").select("id").eq("title", title).maybeSingle()
    const { error } = existing
      ? await client.from("announcements").update({ body: body.trim(), published: true }).eq("id", existing.id)
      : await client.from("announcements").insert({ title, body: body.trim(), published: true })
    setAnnouncementStatus(error ? "Unable to save this announcement." : "Announcement saved and live.")
  }
  async function loadItems(currentSection = section) { const query = createClient().from(currentSection).select("*").order("created_at", { ascending: false }); const { data } = currentSection === "announcements" ? await query.not("title", "in", `("__dashboard_announcement__","__landing_announcement__")`) : await query; setItems((data as Item[]) || []) }
  async function loadCourseAccess() {
    const client = createClient()
    const [{ data: catalog }, { data: rows }] = await Promise.all([
      client.from("courses").select("id, title, is_free").order("title"),
      client.from("course_enrollments").select("id, user_id, course_id, status, source, created_at").order("created_at", { ascending: false }),
    ])
    setCourseCatalog((catalog as CourseOption[]) || [])
    setEnrollments((rows as Enrollment[]) || [])
  }
  async function loadUsers() { const response = await fetch("/api/admin/users"); if (response.ok) setUsers((await response.json()).users) }
  async function updateUser(id: string, updates: Record<string, unknown>, successMessage = "User access updated.") { const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) }); setUserStatus(response.ok ? successMessage : "Unable to update user."); if (response.ok) await loadUsers(); return response.ok }
  async function toggleAdmin(user: User) { await updateUser(user.id, { is_admin: user.app_metadata?.is_admin !== true }, user.app_metadata?.is_admin === true ? "Admin role removed." : "Admin role assigned.") }
  async function updateContact(user: User) { const email = window.prompt("Contact email", user.email || ""); if (email && email !== user.email) await updateUser(user.id, { email }, "Contact email updated.") }
  async function reviewProfile(user: User, profileStatus: "approved" | "rejected") {
    const ok = await updateUser(user.id, { profile_status: profileStatus, profile_review_note: profileStatus === "rejected" ? reviewNote : "" }, profileStatus === "approved" ? "Profile approved." : "Changes requested. The member will see your note on their dashboard.")
    if (ok) setReviewNote("")
  }
  async function resendVerification(user: User) { const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, resend_verification: true }) }); setVerificationStatus(response.ok ? `Verification email sent to ${user.email || "member"}.` : "Unable to send verification email.") }
  async function resendUnverifiedInBulk() { const unverified = users.filter((user) => !user.email_confirmed_at && user.email); if (!unverified.length) { setVerificationStatus("There are no unverified users to contact."); return }; setVerificationStatus(`Sending ${unverified.length} verification email${unverified.length === 1 ? "" : "s"}...`); const results = await Promise.all(unverified.map((user) => fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, resend_verification: true }) }))); const sent = results.filter((response) => response.ok).length; setVerificationStatus(`Sent ${sent} of ${unverified.length} verification emails.`) }
  async function deleteUser(user: User) { if (!window.confirm(`Delete the account for ${user.email || "this user"}?`)) return; const response = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id }) }); setUserStatus(response.ok ? "User account deleted." : "Unable to delete user."); if (response.ok) await loadUsers() }
  useEffect(() => { void (async () => { const client = createClient(); let { data: { user } } = await client.auth.getUser(); if (user?.app_metadata?.is_admin !== true) { const { data: refreshed } = await client.auth.refreshSession(); user = refreshed.session?.user || user } const isAdmin = user?.app_metadata?.is_admin === true; setAllowed(isAdmin); if (isAdmin) { await loadItems(); await loadUsers(); await loadAnnouncementSettings(); await loadCourseAccess() } })() }, [])
  function resetForm() { setEditingId(null); setForm({}); setFormErrors({}); setStatus("") }
  function startEdit(item: Item) { setEditingId(item.id); setForm(Object.fromEntries(config.fields.map((field) => [field.name, field.name === "is_free" ? (item.is_free ? "Free" : "Paid") : String(item[field.name] ?? "")]))); setFormErrors({}); setStatus("") }
  async function setCourseAccess(userId: string, courseId: string, status: "enrolled" | "revoked") {
    const client = createClient()
    const existing = enrollments.find((enrollment) => enrollment.user_id === userId && enrollment.course_id === courseId)
    setAccessBusy(`${userId}:${courseId}`)
    try {
      const { error } = existing
        ? await client.from("course_enrollments").update({ status, source: "admin", updated_at: new Date().toISOString() }).eq("id", existing.id)
        : await client.from("course_enrollments").insert({ user_id: userId, course_id: courseId, status, source: "admin" })
      setUserStatus(error ? "Unable to update course access." : status === "enrolled" ? "Course access granted." : "Course access revoked.")
      if (!error) await loadCourseAccess()
    } finally {
      setAccessBusy("")
    }
  }
  function validateForm() {
    const errors: Record<string, string> = {}
    for (const field of config.fields as FieldConfig[]) {
      const value = (form[field.name] || "").trim()
      if (field.required && !value) errors[field.name] = `${field.label} is required.`
      else if (value && field.kind === "url" && !isValidUrl(value)) errors[field.name] = "Enter a full link starting with https://."
      else if (value && field.name === "event_date" && Number.isNaN(Date.parse(value))) errors[field.name] = "Use a date like 2026-11-14."
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!validateForm()) { setStatus("Please fix the highlighted fields."); return }
    const { data: { user } } = await createClient().auth.getUser()
    if (!user || !allowed) return
    setStatus(editingId ? "Saving..." : "Publishing...")
    const values: Record<string, string | boolean | null> = Object.fromEntries(config.fields.map((field) => [field.name, (form[field.name] || "").trim() || null]))
    if (section === "courses") {
      values.is_free = (form.is_free || "Paid") === "Free"
      values.slug = String(values.slug || slugify(form.title || "") || null)
      if (values.is_free && !values.price) values.price = "Free"
    }
    const query = editingId ? createClient().from(section).update(values).eq("id", editingId) : createClient().from(section).insert({ ...values, published: true, created_by: user.id })
    const { error } = await query
    if (error) { setStatus("Unable to save this item."); return }
    resetForm()
    setStatus(editingId ? "Changes saved." : "Published successfully.")
    await loadItems()
    if (section === "courses") await loadCourseAccess()
  }
  async function remove(item: Item) { if (!window.confirm(`Remove “${String(item.title)}”?`)) return; const { error } = await createClient().from(section).delete().eq("id", item.id); setStatus(error ? "Unable to remove this item." : "Item removed."); if (!error) await loadItems() }
  async function togglePublished(item: Item) { const { error } = await createClient().from(section).update({ published: !item.published }).eq("id", item.id); setStatus(error ? "Unable to change visibility." : item.published ? "Hidden from members." : "Published to members."); await loadItems() }

  const reviewCounts = useMemo(() => ({ pending_review: users.filter((user) => profileStatusOf(user) === "pending_review").length }), [users])
  const visibleUsers = useMemo(() => users.filter((user) => `${user.email || ""} ${String(user.user_metadata?.full_name || "")} ${user.profile?.company || ""}`.toLowerCase().includes(userSearch.toLowerCase())).filter((user) => reviewFilter === "all" || (reviewFilter === "none" ? !profileStatusOf(user) : profileStatusOf(user) === reviewFilter)).sort((a, b) => {
    if (userSort === "verified") return Number(Boolean(a.email_confirmed_at)) - Number(Boolean(b.email_confirmed_at))
    if (userSort === "created_at") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    const aValue = userSort === "name" ? String(a.user_metadata?.full_name || "Member") : a.email || ""
    const bValue = userSort === "name" ? String(b.user_metadata?.full_name || "Member") : b.email || ""
    return aValue.localeCompare(bValue)
  }), [users, userSearch, userSort, reviewFilter])

  if (allowed === null) return <main className="tdd-dashboard min-h-screen p-8 text-muted-foreground">Checking access...</main>
  if (!allowed) return <main className="tdd-dashboard grid min-h-screen place-items-center p-8"><Card><CardHeader><CardTitle>Admin access required</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">This area is restricted to administrators.</p></CardContent></Card></main>
  return <main className="tdd-dashboard min-h-screen"><div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
    <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">The Distinguished Daniel</p><h1 className="font-display text-3xl sm:text-4xl">Admin dashboard</h1><p className="text-muted-foreground">Manage member access, administrators, courses, and all published member content.</p></div><Button variant="outline" render={<a href="/dashboard" />}>Open member dashboard</Button></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-4"><StatTile label="Members" value={users.length} /><StatTile label="Active dashboards" value={users.filter((user) => user.user_metadata?.dashboard_status === "active").length} /><StatTile label="Unverified" value={users.filter((user) => !user.email_confirmed_at).length} /><button type="button" className="text-left" onClick={() => { setReviewFilter("pending_review"); document.getElementById("member-access")?.scrollIntoView({ behavior: "smooth" }) }}><StatTile label="Profiles to review" value={reviewCounts.pending_review} highlight={reviewCounts.pending_review > 0} /></button></div>
    <Card className="mb-6"><CardHeader><CardTitle>Live announcements</CardTitle><p className="text-sm text-muted-foreground">These two messages are shown immediately on the public landing page and member dashboard. Opportunities are managed separately below.</p></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2"><div className="flex flex-col gap-2"><label htmlFor="dashboard-announcement" className="text-sm font-medium">Member dashboard announcement</label><Textarea id="dashboard-announcement" value={dashboardAnnouncement} onChange={(event) => setDashboardAnnouncement(event.target.value)} /><p className="text-xs text-muted-foreground">Shown in the bar at the top of every member dashboard view. Members can dismiss it for their session.</p><Button className="w-fit btn-gold" onClick={() => void saveAnnouncementSetting(dashboardAnnouncementKey, dashboardAnnouncement)}>Save dashboard announcement</Button></div><div className="flex flex-col gap-2"><label htmlFor="landing-announcement" className="text-sm font-medium">Landing page announcement</label><Textarea id="landing-announcement" value={landingAnnouncement} onChange={(event) => setLandingAnnouncement(event.target.value)} /><p className="text-xs text-muted-foreground">Shown on the public homepage.</p><Button className="w-fit btn-gold" onClick={() => void saveAnnouncementSetting(landingAnnouncementKey, landingAnnouncement)}>Save landing announcement</Button></div>{announcementStatus && <p role="status" className="text-sm text-muted-foreground lg:col-span-2">{announcementStatus}</p>}</CardContent></Card>
    <div className="mb-6 flex flex-wrap gap-2">{(Object.keys(sections) as Section[]).map((key) => <Button key={key} variant={section === key ? "default" : "outline"} className={section === key ? "btn-gold" : ""} onClick={() => { setSection(key); resetForm(); void loadItems(key) }}>{sections[key].title}</Button>)}</div>
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card className="h-fit"><CardHeader><CardTitle className="flex items-center justify-between">{editingId ? `Edit ${config.singular}` : `Add ${config.singular}`}<Button variant="ghost" size="icon" onClick={resetForm} aria-label="Clear form"><X /></Button></CardTitle><p className="text-xs text-muted-foreground">Appears in: {config.destination}</p></CardHeader><CardContent><form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {(config.fields as FieldConfig[]).map((field) => { const id = `admin-${section}-${field.name}`; const value = form[field.name] || ""; const onChange = (next: string) => { setForm({ ...form, [field.name]: next }); if (formErrors[field.name]) setFormErrors({ ...formErrors, [field.name]: "" }) }; const label = field.required ? `${field.label} *` : field.label; return <Field key={field.name} id={id} label={label} error={formErrors[field.name]} hint={field.hint}>
          {field.kind === "textarea" ? <Textarea id={id} rows={5} value={value} aria-invalid={Boolean(formErrors[field.name])} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
            : field.kind === "select" ? <select id={id} className={`${selectClass} h-10`} value={value} aria-invalid={Boolean(formErrors[field.name])} onChange={(e) => onChange(e.target.value)}><option value="">Select…</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}{value && !field.options?.includes(value) && <option value={value}>{value}</option>}</select>
            : <Input id={id} type={field.kind === "url" ? "url" : "text"} value={value} aria-invalid={Boolean(formErrors[field.name])} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />}
        </Field> })}
        <div className="flex gap-3"><Button type="submit" className="btn-gold"><Plus data-icon="inline-start" />{editingId ? "Save changes" : "Publish"}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}</div>{status && <p role="status" className="text-sm text-muted-foreground">{status}</p>}
      </form></CardContent></Card>
      <Card><CardHeader><CardTitle>{config.title}</CardTitle><p className="text-xs text-muted-foreground">Hidden items stay saved but aren&apos;t shown to members.</p></CardHeader><CardContent className="flex flex-col gap-3">{items.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 sm:flex-row sm:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><p className="font-medium">{String(item.title)}</p><Badge variant={item.published ? "default" : "secondary"}>{item.published ? "Published" : "Hidden"}</Badge>{(item.resource_type || item.category) && <Badge variant="outline">{String(item.resource_type || item.category)}</Badge>}</div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{String(item.description || item.body || item.instructor || item.url || "")}</p>{typeof item.created_at === "string" && <p className="mt-1 text-xs text-muted-foreground">Added {formatDate(item.created_at)}</p>}</div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" onClick={() => startEdit(item)} aria-label="Edit"><Pencil /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => void remove(item)} aria-label="Delete"><Trash2 /></Button><Button variant="outline" size="sm" onClick={() => void togglePublished(item)}>{item.published ? "Hide" : "Publish"}</Button></div></div>)}{items.length === 0 && <p className="text-sm text-muted-foreground">No {config.title.toLowerCase()} yet.</p>}</CardContent></Card>
    </div>
    <Card id="member-access" className="mt-8"><CardHeader><CardTitle className="flex items-center gap-2"><Settings2 /> Member access and admin roles</CardTitle><p className="text-sm text-muted-foreground">Use bulk actions to keep everyone on the same message, or customize individual access and paid course permissions.</p></CardHeader><CardContent className="flex flex-col gap-4">
      <PendingCourseRequests users={users} courses={courseCatalog} enrollments={enrollments} busy={accessBusy} onGrant={(userId, courseId) => void setCourseAccess(userId, courseId, "enrolled")} />
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void Promise.all(users.filter((u) => u.email !== "admin@distinguisheddaniel.com").map((u) => updateUser(u.id, { dashboard_status: "prepared" })))}>Set all to “Dashboard is being prepared”</Button><Button variant="outline" onClick={() => void Promise.all(users.filter((u) => u.email !== "admin@distinguisheddaniel.com").map((u) => updateUser(u.id, { dashboard_status: "active" })))}>Activate all members</Button><Button variant="outline" onClick={() => void Promise.all(users.filter((u) => u.email !== "admin@distinguisheddaniel.com").map((u) => updateUser(u.id, { dashboard_status: "updates" })))}>Set all to updates</Button><Button variant="outline" onClick={() => void resendUnverifiedInBulk()}>Resend verification to unverified</Button></div>
      {verificationStatus && <p role="status" className="text-sm text-muted-foreground">{verificationStatus}</p>}
      {userStatus && <p role="status" className="text-sm text-muted-foreground">{userStatus}</p>}
      <div className="flex flex-col gap-2 sm:flex-row"><Input aria-label="Search users" placeholder="Search by name, email or company" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} /><select aria-label="Filter by profile review" className={`${selectClass} h-10`} value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value as typeof reviewFilter)}><option value="all">All profiles</option><option value="pending_review">Pending review ({reviewCounts.pending_review})</option><option value="approved">Approved</option><option value="rejected">Changes requested</option><option value="none">Not submitted</option></select><select aria-label="Sort users" className={`${selectClass} h-10`} value={userSort} onChange={(event) => setUserSort(event.target.value as typeof userSort)}><option value="created_at">Newest first</option><option value="name">Name</option><option value="email">Email</option><option value="verified">Unverified first</option></select></div>
      <div className="flex flex-col gap-3">{visibleUsers.map((user) => { const expanded = expandedUserId === user.id; const profileStatus = profileStatusOf(user); return <div key={user.id} className="rounded-xl border border-border bg-card/60 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><p className="truncate font-medium">{String(user.user_metadata?.full_name || "Member")}</p><p className="truncate text-sm text-muted-foreground">{user.email || "No email"}{user.user_metadata?.title ? ` · ${String(user.user_metadata.title)}` : ""}</p><div className="mt-2 flex flex-wrap gap-2"><Badge variant={user.app_metadata?.is_admin === true ? "default" : "secondary"}>{user.app_metadata?.is_admin === true ? "Admin" : "Member"}</Badge><Badge variant={user.email_confirmed_at ? "outline" : "destructive"}>{user.email_confirmed_at ? "Verified" : "Unverified"}</Badge><Badge variant="outline">{accessLabels[String(user.user_metadata?.dashboard_status || "prepared")]}</Badge>{profileStatus && <Badge variant={profileStatus === "pending_review" ? "default" : "outline"} className={profileStatus === "pending_review" ? "btn-gold" : ""}>{reviewLabels[profileStatus] || profileStatus}</Badge>}</div></div><div className="flex flex-wrap gap-2"><select aria-label={`Dashboard access for ${user.email}`} className={selectClass} value={String(user.user_metadata?.dashboard_status || "prepared")} onChange={(e) => void updateUser(user.id, { dashboard_status: e.target.value })}>{accessOptions.map((option) => <option key={option} value={option}>{accessLabels[option]}</option>)}</select><Button variant="outline" size="sm" onClick={() => void toggleAdmin(user)}><ShieldCheck data-icon="inline-start" />{user.app_metadata?.is_admin === true ? "Remove admin" : "Assign admin"}</Button><Button variant="outline" size="sm" onClick={() => void updateContact(user)}><Pencil data-icon="inline-start" />Contact</Button>{!user.email_confirmed_at && user.email && <Button variant="outline" size="sm" onClick={() => void resendVerification(user)}>Resend verification</Button>}<Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => { setExpandedUserId(expanded ? null : user.id); setReviewNote("") }}><ChevronDown data-icon="inline-start" className={expanded ? "rotate-180 transition-transform" : "transition-transform"} />Profile</Button>{user.email !== "admin@distinguisheddaniel.com" && <Button variant="outline" size="sm" className="text-destructive" aria-label={`Delete ${user.email || "user"}`} onClick={() => void deleteUser(user)}><Trash2 /></Button>}</div></div>
        {expanded && <MemberDetails user={user} reviewNote={reviewNote} onReviewNoteChange={setReviewNote} onReview={(next) => void reviewProfile(user, next)} courses={courseCatalog} enrollments={enrollments.filter((enrollment) => enrollment.user_id === user.id)} busy={accessBusy} onGrant={(courseId) => void setCourseAccess(user.id, courseId, "enrolled")} onRevoke={(courseId) => void setCourseAccess(user.id, courseId, "revoked")} />}
      </div> })}{visibleUsers.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No users match this search.</p>}</div>
    </CardContent></Card>
  </div></main>
}

function StatTile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return <div className={`rounded-xl border bg-card/60 p-4 ${highlight ? "border-[#dcb567]/60" : "border-border"}`}><p className="text-2xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
}

function PendingCourseRequests({ users, courses, enrollments, busy, onGrant }: { users: User[]; courses: CourseOption[]; enrollments: Enrollment[]; busy: string; onGrant: (userId: string, courseId: string) => void }) {
  const pending = enrollments.filter((enrollment) => enrollment.status === "pending")
  return <section aria-labelledby="pending-course-requests-title" className="rounded-xl border border-border p-4">
    <h3 id="pending-course-requests-title" className="font-medium">Pending course requests</h3>
    {pending.length === 0
      ? <p className="mt-2 text-sm text-muted-foreground">There are no course requests waiting for approval.</p>
      : <ul className="mt-3 flex flex-col gap-3">{pending.map((enrollment) => {
        const user = users.find((candidate) => candidate.id === enrollment.user_id)
        const course = courses.find((candidate) => candidate.id === enrollment.course_id)
        const isBusy = busy === `${enrollment.user_id}:${enrollment.course_id}`
        return <li key={enrollment.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{String(user?.user_metadata?.full_name || user?.email || "Member")}</p>
            <p className="truncate text-sm text-muted-foreground">{course?.title || "Course"}{user?.email ? ` · ${user.email}` : ""}</p>
            <p className="mt-1 text-xs text-muted-foreground">Requested {formatDate(enrollment.created_at)}</p>
          </div>
          <Button size="sm" className="btn-gold" disabled={isBusy} onClick={() => onGrant(enrollment.user_id, enrollment.course_id)}>
            {isBusy ? "Granting..." : "Grant access"}
          </Button>
        </li>
      })}</ul>}
  </section>
}

function MemberDetails({ user, reviewNote, onReviewNoteChange, onReview, courses, enrollments, busy, onGrant, onRevoke }: { user: User; reviewNote: string; onReviewNoteChange: (value: string) => void; onReview: (status: "approved" | "rejected") => void; courses: CourseOption[]; enrollments: Enrollment[]; busy: string; onGrant: (courseId: string) => void; onRevoke: (courseId: string) => void }) {
  const profile = user.profile
  const preferences = (user.user_metadata?.preferences || {}) as Record<string, unknown>
  const skills = normalizeSkills(profile?.skills)
  const profileStatus = profileStatusOf(user)
  const reviewedAt = String(user.user_metadata?.profile_reviewed_at || "")
  const note = String(user.user_metadata?.profile_review_note || "")
  const rows: [string, string][] = [["Headline", profile?.headline || ""], ["Role", profile?.role || ""], ["Company", profile?.company || ""], ["Location", profile?.location || String(user.user_metadata?.location || "")], ["Website", profile?.website || ""], ["LinkedIn", profile?.linkedin_url || ""]]
  return <div className="mt-4 grid gap-4 border-t border-border pt-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,1fr)]">
    <div className="flex flex-col gap-3">
      {!profile ? <p className="text-sm text-muted-foreground">This member hasn&apos;t saved a professional profile yet.</p> : <>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="truncate text-foreground">{value ? (isValidUrl(value) ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">{value}</a> : value) : "—"}</dd></div>)}</dl>
        {skills.length > 0 && <div className="flex flex-wrap gap-1.5">{skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div>}
        {profile.bio && <p className="whitespace-pre-line text-sm text-muted-foreground">{profile.bio}</p>}
        {profile.updated_at && <p className="text-xs text-muted-foreground">Last saved {relativeTime(profile.updated_at)}</p>}
      </>}
      <dl className="grid gap-x-6 gap-y-2 border-t border-border pt-3 text-xs sm:grid-cols-3"><div><dt className="text-muted-foreground">Joined</dt><dd className="text-foreground">{formatDate(user.created_at)}</dd></div><div><dt className="text-muted-foreground">Last sign-in</dt><dd className="text-foreground">{user.last_sign_in_at ? relativeTime(user.last_sign_in_at) : "Never"}</dd></div><div><dt className="text-muted-foreground">Email preferences</dt><dd className="text-foreground">Updates {preferences.email_updates === false ? "off" : "on"} · Network {preferences.network_alerts === false ? "off" : "on"}</dd></div></dl>
    </div>
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <p className="text-sm font-medium text-foreground">Profile review</p>
      <p className="text-xs text-muted-foreground">{profileStatus ? `${reviewLabels[profileStatus] || profileStatus}${reviewedAt ? ` · reviewed ${relativeTime(reviewedAt)}` : ""}` : "Not submitted yet."} This doesn&apos;t change dashboard access.</p>
      {note && <StatusMessage tone="error">{note}</StatusMessage>}
      <Textarea aria-label="Note for the member" placeholder="Optional note when requesting changes" rows={3} maxLength={500} value={reviewNote} onChange={(e) => onReviewNoteChange(e.target.value)} />
      <div className="flex flex-wrap gap-2"><Button size="sm" className="btn-gold" disabled={!profile || profileStatus === "approved"} onClick={() => onReview("approved")}><Check data-icon="inline-start" />Approve</Button><Button size="sm" variant="outline" disabled={!profile} onClick={() => onReview("rejected")}><MessageSquareWarning data-icon="inline-start" />Request changes</Button></div>
    </div>
  </div>
}
