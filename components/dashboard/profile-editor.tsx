"use client"

import { FormEvent, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProfileEditor() {
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({ headline: "", company: "", role: "", bio: "", location: "", website: "", linkedin_url: "", skills: "" })
  const [status, setStatus] = useState("")
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from("member_profiles").select("headline,company,role,bio,location,website,linkedin_url,skills").eq("id", user.id).maybeSingle()
      if (data) setForm({ ...data, skills: (data.skills || []).join(", ") })
    }
    void load()
  }, [supabase])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!userId) return
    setStatus("Saving...")
    const { error } = await supabase.from("member_profiles").upsert({ id: userId, ...form, skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean), updated_at: new Date().toISOString() })
    setStatus(error ? "We couldn't save your profile." : "Profile saved for the network.")
  }

  return <Card className="mb-6 border-primary/20 bg-card/80"><CardHeader><CardTitle className="font-display text-xl">Your professional profile</CardTitle><p className="text-sm text-muted-foreground">Add the information other members can discover.</p></CardHeader><CardContent><form onSubmit={save} className="grid gap-4 md:grid-cols-2"><Input aria-label="Headline" placeholder="Headline" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /><Input aria-label="Role" placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /><Input aria-label="Company" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /><Input aria-label="Location" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /><Input aria-label="Website" placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /><Input aria-label="LinkedIn" placeholder="LinkedIn URL" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /><Input className="md:col-span-2" aria-label="Skills" placeholder="Skills, separated by commas" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /><Textarea className="md:col-span-2" aria-label="Bio" placeholder="A short professional bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /><div className="flex items-center gap-4 md:col-span-2"><Button type="submit" className="btn-gold">Save profile</Button>{status && <span className="text-sm text-muted-foreground" role="status">{status}</span>}</div></form></CardContent></Card>
}

export function ProfileSummary({ profile }: { profile: { headline?: string; company?: string; role?: string; bio?: string; location?: string; skills?: string[] } }) {
  return <Card className="border-primary/20 bg-card/80"><CardHeader><CardTitle className="font-display text-xl">Member profile</CardTitle></CardHeader><CardContent><p className="text-lg font-semibold">{profile.headline || "Distinguished Daniel member"}</p><p className="text-sm text-muted-foreground">{[profile.role, profile.company, profile.location].filter(Boolean).join(" · ")}</p>{profile.bio && <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>}<div className="mt-4 flex flex-wrap gap-2">{(profile.skills || []).map((skill) => <span key={skill} className="rounded-full border border-primary/20 px-3 py-1 text-xs text-primary">{skill}</span>)}</div></CardContent></Card>
}
