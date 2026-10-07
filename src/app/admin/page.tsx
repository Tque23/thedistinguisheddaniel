"use client"

import { FormEvent, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Trash2, X, Users, ShieldCheck } from "lucide-react"

const sections = {
  announcements: { title: "Announcements", singular: "announcement", fields: ["title", "body"] },
  courses: { title: "Courses", singular: "course", fields: ["title", "instructor", "event_date", "thumbnail_url", "description", "category", "duration"] },
  resources: { title: "Resources", singular: "resource", fields: ["title", "description", "url", "resource_type"] },
  blog_posts: { title: "Blog posts", singular: "blog post", fields: ["title", "instructor", "event_date", "thumbnail_url", "media_url", "body"] },
} as const

type Section = keyof typeof sections
type Item = Record<string, string | boolean> & { id: string; published?: boolean }

const labels: Record<string, string> = { event_date: "Date", thumbnail_url: "Thumbnail link", media_url: "Optional media link", resource_type: "Type" }

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [section, setSection] = useState<Section>("announcements")
  const [form, setForm] = useState<Record<string, string>>({})
  const [items, setItems] = useState<Item[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [users, setUsers] = useState<Array<{ id: string; email?: string; created_at: string; last_sign_in_at?: string; email_confirmed_at?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }>>([])
  const [userSearch, setUserSearch] = useState("")

  const config = sections[section]
  const formTitle = editingId ? `Edit ${config.singular}` : `Add ${config.singular}`

  async function loadItems(currentSection = section) {
    const { data } = await createClient().from(currentSection).select("*").order("created_at", { ascending: false })
    setItems((data as Item[]) || [])
  }

  async function loadUsers() {
    const response = await fetch("/api/admin/users")
    if (response.ok) setUsers((await response.json()).users)
  }

  async function updateUser(user: (typeof users)[number]) {
    const email = window.prompt("Contact email", user.email || "")
    if (!email || email === user.email) return
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, email }) })
    setStatus(response.ok ? "User contact information updated." : "Unable to update user.")
    if (response.ok) await loadUsers()
  }

  async function deleteUser(user: (typeof users)[number]) {
    if (!window.confirm(`Delete the account for ${user.email || "this user"}? This cannot be undone.`)) return
    const response = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id }) })
    setStatus(response.ok ? "User account deleted." : "Unable to delete user.")
    if (response.ok) await loadUsers()
  }

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await createClient().auth.getUser()
      const isAdmin = Boolean((user?.app_metadata?.is_admin || user?.user_metadata?.is_admin) && user.email === "admin@distinguisheddaniel.com")
      setAllowed(isAdmin)
      if (isAdmin) {
        await loadItems()
        await loadUsers()
      }
    })()
  }, [])

  function startEdit(item: Item) {
    setEditingId(item.id)
    setForm(Object.fromEntries(config.fields.map((field) => [field, String(item[field] || "")])) )
    setStatus("")
  }

  function resetForm() { setEditingId(null); setForm({}); setStatus("") }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const { data: { user } } = await createClient().auth.getUser()
    if (!user || !allowed) return
    setStatus(editingId ? "Saving..." : "Publishing...")
    const payload = { ...form, published: true, ...(editingId ? {} : { created_by: user.id }) }
    const query = editingId ? createClient().from(section).update(payload).eq("id", editingId) : createClient().from(section).insert(payload)
    const { error } = await query
    setStatus(error ? "Unable to save this item." : editingId ? "Changes saved." : "Published successfully.")
    if (!error) { resetForm(); await loadItems() }
  }

  async function remove(item: Item) {
    if (!window.confirm(`Remove “${String(item.title)}”?`)) return
    const { error } = await createClient().from(section).delete().eq("id", item.id)
    if (error) setStatus("Unable to remove this item.")
    else { setStatus("Item removed."); await loadItems() }
  }

  async function togglePublished(item: Item) {
    await createClient().from(section).update({ published: !item.published }).eq("id", item.id)
    await loadItems()
  }

  if (allowed === null) return <main className="tdd-dashboard min-h-screen p-8 text-muted-foreground">Checking access...</main>
  if (!allowed) return <main className="tdd-dashboard flex min-h-screen items-center justify-center p-8"><Card><CardHeader><CardTitle>Admin access required</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">This area is restricted to administrators.</p></CardContent></Card></main>

  const visibleUsers = users.filter((user) => `${user.email || ""} ${String(user.user_metadata?.full_name || "")}`.toLowerCase().includes(userSearch.toLowerCase()))

  return <main className="tdd-dashboard min-h-screen"><div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
    <div className="mb-8 flex flex-col gap-2 border-b border-border pb-6"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">The Distinguished Daniel</p><h1 className="font-display text-3xl sm:text-4xl">Admin dashboard</h1><p className="text-muted-foreground">Manage the content members see across the network.</p></div>
    <div className="mb-6 flex flex-wrap gap-2">{(Object.keys(sections) as Section[]).map((key) => <Button key={key} variant={section === key ? "default" : "outline"} className={section === key ? "btn-gold" : ""} onClick={() => { setSection(key); resetForm(); void loadItems(key) }}>{sections[key].title}</Button>)}</div>
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="h-fit border-border/80"><CardHeader><CardTitle className="flex items-center justify-between">{formTitle}<Button variant="ghost" size="icon" onClick={resetForm} aria-label="Clear form"><X className="size-4" /></Button></CardTitle></CardHeader><CardContent><form onSubmit={submit} className="flex flex-col gap-4">{config.fields.map((field) => { const multiline = ["description", "body"].includes(field); return multiline ? <Textarea key={field} required={field !== "media_url"} placeholder={labels[field] || field.replaceAll("_", " ")} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} /> : <Input key={field} required={field !== "event_date" && field !== "thumbnail_url" && field !== "media_url"} placeholder={labels[field] || field.replaceAll("_", " ")} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} /> })}<div className="flex items-center gap-3"><Button type="submit" className="btn-gold"><Plus className="mr-2 size-4" />{editingId ? "Save changes" : "Publish"}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}</div>{status && <p role="status" className="text-sm text-muted-foreground">{status}</p>}</form></CardContent></Card>
      <Card className="border-border/80"><CardHeader><CardTitle>{config.title}</CardTitle></CardHeader><CardContent className="space-y-3">{items.length === 0 && <p className="text-sm text-muted-foreground">No {config.title.toLowerCase()} yet.</p>}{items.map((item) => <div key={item.id} className="flex items-start gap-4 rounded-xl border border-border bg-card/60 p-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{String(item.title)}</p><Badge variant={item.published ? "default" : "secondary"}>{item.published ? "Published" : "Hidden"}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{String(item.description || item.body || item.instructor || item.url || "")}</p></div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" onClick={() => startEdit(item)} aria-label={`Edit ${String(item.title)}`}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => void remove(item)} aria-label={`Remove ${String(item.title)}`}><Trash2 className="size-4" /></Button><Button variant="outline" size="sm" onClick={() => void togglePublished(item)}>{item.published ? "Hide" : "Publish"}</Button></div></div>)}</CardContent></Card>
    </div>
    <Card className="mt-8 border-border/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="size-5" /> User access</CardTitle>
        <p className="text-sm text-muted-foreground">Review, update, or remove member accounts. Changes apply immediately.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Input aria-label="Search users" placeholder="Search by name or email" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
        <div className="flex flex-col gap-3">
          {visibleUsers.map((user) => <div key={user.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card/60 p-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{String(user.user_metadata?.full_name || "Member")}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email || "No email"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={user.email_confirmed_at ? "default" : "secondary"}>{user.email_confirmed_at ? "Confirmed" : "Pending confirmation"}</Badge>
                {user.app_metadata?.is_admin === true && <Badge variant="outline"><ShieldCheck className="mr-1 size-3" /> Admin</Badge>}
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => void updateUser(user)}><Pencil className="mr-2 size-4" /> Edit contact</Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => void deleteUser(user)}><Trash2 className="mr-2 size-4" /> Delete</Button>
            </div>
          </div>)}
          {visibleUsers.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No users match this search.</p>}
        </div>
      </CardContent>
    </Card>
  </div></main>
}
