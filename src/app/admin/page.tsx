"use client"

import { FormEvent, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sections = { announcements: { title: "Announcements", fields: ["title", "body"] }, courses: { title: "Courses", fields: ["title", "description", "category", "duration"] }, resources: { title: "Resources", fields: ["title", "description", "url", "resource_type"] } } as const

type Section = keyof typeof sections
export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [section, setSection] = useState<Section>("announcements")
  const [form, setForm] = useState<Record<string, string>>({})
  const [status, setStatus] = useState("")
  useEffect(() => { void (async () => { const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); setAllowed(Boolean(user?.user_metadata?.is_admin)) })() }, [])
  function changeSection(value: Section) { setSection(value); setForm({}) ; setStatus("") }
  async function submit(event: FormEvent) { event.preventDefault(); const { data: { user } } = await supabase.auth.getUser(); if (!user || !allowed) return; setStatus("Publishing..."); const { error } = await supabase.from(section).insert({ ...form, created_by: user.id, published: true }); setStatus(error ? "Unable to publish this item." : "Published successfully."); if (!error) setForm({}) }
  if (allowed === null) return <main className="tdd-dashboard min-h-screen p-8 text-muted-foreground">Checking access…</main>
  if (!allowed) return <main className="tdd-dashboard flex min-h-screen items-center justify-center p-8"><Card><CardHeader><CardTitle>Admin access required</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">This area is restricted to administrators.</p></CardContent></Card></main>
  const config = sections[section]
  return <main className="tdd-dashboard min-h-screen p-6 text-foreground lg:p-10"><div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">The Distinguished Daniel</p><h1 className="mt-3 font-display text-4xl">Admin dashboard</h1><p className="mt-2 text-muted-foreground">Manage the content members see across the network.</p><div className="mt-8 flex flex-wrap gap-2">{(Object.keys(sections) as Section[]).map((key) => <Button key={key} variant={section === key ? "default" : "outline"} onClick={() => changeSection(key)}>{sections[key].title}</Button>)}</div><Card className="mt-6 max-w-2xl"><CardHeader><CardTitle>Create {config.title.slice(0, -1).toLowerCase()}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="flex flex-col gap-4">{config.fields.map((field) => field === "description" || field === "body" ? <Textarea key={field} required placeholder={field.replace("_", " ")} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} /> : <Input key={field} required placeholder={field.replace("_", " ")} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}<div className="flex items-center gap-4"><Button type="submit" className="btn-gold">Publish</Button>{status && <span role="status" className="text-sm text-muted-foreground">{status}</span>}</div></form></CardContent></Card></div></main>
}
