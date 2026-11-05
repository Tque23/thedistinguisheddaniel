"use client"

import { useMemo, useState, type FormEvent } from "react"
import { ArrowRight, Briefcase, Building2, ExternalLink, GraduationCap, Lightbulb, MapPin, Search, Tag, UserPlus, Users2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SUPPORT_EMAIL, initialsFor, isValidUrl, profileCompletion, type DirectoryMember } from "@/lib/dashboard-data"
import { DdniButton, EmptyPanel, LoadingBlock, Panel, SelectField, TextLink, UnderlineTabs, type TabItem } from "@/components/dashboard/ddni-ui"
import { ViewContainer } from "@/components/dashboard/dashboard-ui"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

type TabId = "discover" | "connections" | "groups"
type Filters = { query: string; industry: string; location: string; skill: string; role: string }

const EMPTY_FILTERS: Filters = { query: "", industry: "all", location: "all", skill: "all", role: "all" }
const GROUP_ICONS = [Briefcase, Building2, Lightbulb, Users2]

const unique = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
const toOptions = (label: string, values: string[]) => [{ value: "all", label }, ...values.map((value) => ({ value, label: value }))]

function connectLink(person: DirectoryMember) {
  if (isValidUrl(person.linkedinUrl)) return person.linkedinUrl
  if (isValidUrl(person.website)) return person.website
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Connection request: ${person.name}`)}`
}

function Avatar({ name, className = "size-16" }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={`${className} ddni-serif grid shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#12294d,#0a1b36)] text-lg font-bold text-[#e4c276] ring-2 ring-[#c9a14f]/50 ring-offset-2 ring-offset-white`}>
      {initialsFor(name)}
    </span>
  )
}

function MemberCard({ person, onView }: { person: DirectoryMember; onView: () => void }) {
  const link = connectLink(person)
  const external = link.startsWith("http")
  const subtitle = [person.role, person.company].filter(Boolean).join(", ") || person.headline || "DDNI member"
  return (
    <article className="ddni-card ddni-card-hover flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Avatar name={person.name} />
        <div className="min-w-0">
          <h3 className="ddni-serif truncate text-lg leading-tight font-bold text-foreground">{person.name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
          {person.location && <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[#12294d]"><MapPin className="size-3.5 shrink-0 text-[#a9792a]" aria-hidden />{person.location}</p>}
        </div>
      </div>
      <div className="flex min-h-14 flex-wrap content-start gap-1.5">
        {person.skills.slice(0, 4).map((skill) => <span key={skill} className="rounded-full bg-[#f3eee1] px-2.5 py-1 text-xs text-foreground/80">{skill}</span>)}
        {person.skills.length === 0 && person.headline && <p className="line-clamp-2 text-xs text-muted-foreground">{person.headline}</p>}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2">
        <DdniButton variant="outline" size="sm" onClick={onView} aria-label={`View profile of ${person.name}`}>View Profile</DdniButton>
        <DdniButton size="sm" href={link} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} aria-label={`Connect with ${person.name}`}><UserPlus />Connect</DdniButton>
      </div>
    </article>
  )
}

export function NetworkView({ member, data, onNavigate }: DashboardViewProps) {
  const [tab, setTab] = useState<TabId>("discover")
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<DirectoryMember | null>(null)
  const completion = profileCompletion(member, data.profile)

  const options = useMemo(() => ({
    industry: unique(data.directory.map((person) => person.company)),
    location: unique(data.directory.map((person) => person.location)),
    skill: unique(data.directory.flatMap((person) => person.skills)),
    role: unique(data.directory.map((person) => person.role)),
  }), [data.directory])

  const groups = useMemo(() => {
    const tally = new Map<string, number>()
    data.directory.forEach((person) => person.skills.forEach((skill) => tally.set(skill, (tally.get(skill) ?? 0) + 1)))
    return [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 4)
  }, [data.directory])

  const members = data.directory.filter((person) => {
    const q = applied.query.trim().toLowerCase()
    if (q && ![person.name, person.company, person.role, person.headline, person.location, ...person.skills].some((value) => value.toLowerCase().includes(q))) return false
    if (applied.industry !== "all" && person.company !== applied.industry) return false
    if (applied.location !== "all" && person.location !== applied.location) return false
    if (applied.skill !== "all" && !person.skills.includes(applied.skill)) return false
    if (applied.role !== "all" && person.role !== applied.role) return false
    return true
  })
  const filtering = JSON.stringify(applied) !== JSON.stringify(EMPTY_FILTERS)

  function submit(event?: FormEvent) {
    event?.preventDefault()
    setApplied(draft)
    setTab("discover")
  }

  function clear() {
    setDraft(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
  }

  function viewGroup(skill: string) {
    const next = { ...EMPTY_FILTERS, skill }
    setDraft(next)
    setApplied(next)
    setTab("discover")
  }

  const tabs: TabItem<TabId>[] = [
    { id: "discover", label: "Discover Members", icon: Users2 },
    { id: "connections", label: "My Connections", icon: UserPlus },
    { id: "groups", label: "Groups", icon: Building2 },
  ]

  const groupList = groups.length === 0 ? (
    <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Groups form around shared skills as members complete their profiles.</p>
  ) : (
    <ul className="flex flex-col gap-3">
      {groups.map(([skill, count], index) => {
        const Icon = GROUP_ICONS[index % GROUP_ICONS.length]
        return (
          <li key={skill} className="flex gap-3 rounded-lg border border-border bg-white p-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-[#0c1d3a] text-[#e4c276]"><Icon className="size-7" aria-hidden /></span>
            <div className="min-w-0">
              <h4 className="ddni-serif truncate text-base font-bold text-foreground">{skill}</h4>
              <p className="text-xs text-muted-foreground">{count} {count === 1 ? "member" : "members"}</p>
              <TextLink onClick={() => viewGroup(skill)} className="mt-1 text-[#8a6420] underline underline-offset-4">View members<ArrowRight className="size-3.5" /></TextLink>
            </div>
          </li>
        )
      })}
    </ul>
  )

  return (
    <ViewContainer>
      <header className="relative overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#081a36,#0c2347_60%,#0a1d3b)] px-5 py-6 text-white shadow-[0_18px_40px_-20px_rgba(8,26,54,0.7)] sm:px-8 sm:py-7">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full border border-[#c9a14f]/40" />
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-8 size-72 rounded-full border border-[#c9a14f]/25" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-32 size-80 rounded-full border border-[#c9a14f]/30" />
        <nav aria-label="Breadcrumb" className="relative flex items-center gap-2 text-sm text-white/85">
          <button type="button" onClick={() => onNavigate("overview")} className="rounded-sm transition-colors hover:text-[#e4c276] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4c276]">Home</button>
          <span aria-hidden>/</span>
          <span aria-current="page" className="text-[#e4c276]">DDNI Network</span>
        </nav>
        <h2 className="font-display relative mt-3 text-2xl leading-snug font-semibold tracking-tight text-white sm:text-3xl">DDNI <span className="text-[#e4c276]">Network</span></h2>
        <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-white/90">Connect with distinguished people. Grow your <strong className="text-white">Kingdom influence.</strong></p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <form onSubmit={submit} className="ddni-card flex min-w-0 flex-col gap-6 p-6" role="search" aria-label="Search members">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-foreground/70" aria-hidden />
              <input
                type="search"
                value={draft.query}
                onChange={(event) => setDraft({ ...draft, query: event.target.value })}
                placeholder="Search members by name, profession, or keyword..."
                aria-label="Search members by name, profession, or keyword"
                className="h-11 w-full rounded-lg border border-input bg-[#f6f3ec] pr-3 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-[#b8893a] focus-visible:ring-2 focus-visible:ring-[#c9a14f]/30"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
              <SelectField id="net-industry" label="Industry" value={draft.industry} onChange={(value) => setDraft({ ...draft, industry: value })} icon={Briefcase} options={toOptions("All industries", options.industry)} />
              <SelectField id="net-location" label="Location" value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} icon={MapPin} options={toOptions("All locations", options.location)} />
              <SelectField id="net-skill" label="Skills" value={draft.skill} onChange={(value) => setDraft({ ...draft, skill: value })} icon={GraduationCap} options={toOptions("All skills", options.skill)} />
              <SelectField id="net-role" label="Role" value={draft.role} onChange={(value) => setDraft({ ...draft, role: value })} icon={Tag} options={toOptions("All roles", options.role)} />
              <DdniButton type="submit" size="lg" className="sm:col-span-2 lg:col-span-1">Search</DdniButton>
            </div>
          </form>

          <UnderlineTabs
            label="Network sections"
            items={tabs}
            value={tab}
            onChange={setTab}
            trailing={tab === "discover" && !data.loading ? (
              <span className="flex items-center gap-3">
                {members.length} {members.length === 1 ? "member" : "members"}
                {filtering && <button type="button" onClick={clear} className="font-medium text-[#8a6420] underline underline-offset-4">Clear filters</button>}
              </span>
            ) : undefined}
          />

          {data.errors.directory && <p role="alert" className="text-sm text-[#b3261e]">{data.errors.directory}</p>}

          {tab === "discover" && (
            data.loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">{[0, 1, 2].map((i) => <LoadingBlock key={i} className="h-52" />)}</div>
            ) : members.length === 0 ? (
              <EmptyPanel
                icon={Users2}
                title={data.directory.length ? "No members match your search" : "The directory is growing"}
                description={data.directory.length ? "Try a different name, company or area of expertise." : "Member profiles will appear here as members publish them."}
                action={filtering ? <DdniButton variant="outline" onClick={clear}>Clear filters</DdniButton> : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">{members.map((person) => <MemberCard key={person.id} person={person} onView={() => setSelected(person)} />)}</div>
            )
          )}

          {tab === "connections" && (
            <EmptyPanel
              icon={UserPlus}
              title="No connections yet"
              description="Reach out to members from Discover Members. Your connections will be gathered here."
              action={<DdniButton onClick={() => setTab("discover")}>Discover members</DdniButton>}
            />
          )}

          {tab === "groups" && (data.loading ? <LoadingBlock className="h-52" /> : <div className="max-w-xl">{groupList}</div>)}
        </div>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Network summary">
          <section className="ddni-card flex items-center gap-4 p-6">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#f5ecd6] text-[#a9792a]"><Users2 className="size-8" aria-hidden /></span>
            <div className="min-w-0">
              <p className="ddni-serif text-4xl leading-none font-bold text-foreground">{data.loading ? "—" : data.directory.length}</p>
              <p className="mt-1 text-sm text-foreground/85">{data.directory.length === 1 ? "Member" : "Members"} in the network</p>
              <TextLink onClick={() => setTab("discover")} className="mt-1 text-[#8a6420] underline underline-offset-4">Discover members<ArrowRight className="size-3.5" /></TextLink>
            </div>
          </section>

          <Panel title="Suggested Groups" icon={Users2}>{data.loading ? <LoadingBlock className="h-40" /> : groupList}</Panel>

          <Panel title="Your Profile" icon={Building2}>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{data.profile.company || member.name}</p>
                <p className="text-xs text-muted-foreground">{data.profile.headline || "Add a headline so members know what you do."}</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Profile completion</span><span className="font-semibold text-foreground">{completion.percent}%</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#ece7d9]" role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#b8893a] to-[#d4ad5c]" style={{ width: `${completion.percent}%` }} />
                </div>
                {completion.missing.length > 0 && <p className="mt-1.5 text-xs text-muted-foreground">Missing: {completion.missing.join(", ")}</p>}
              </div>
              <DdniButton className="w-full" onClick={() => onNavigate("profile")}>Edit profile</DdniButton>
            </div>
          </Panel>
        </aside>
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.name} />
                  <div className="min-w-0">
                    <SheetTitle className="font-display text-xl">{selected.name}</SheetTitle>
                    <SheetDescription>{[selected.role, selected.company].filter(Boolean).join(", ") || "DDNI member"}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 pb-6 text-sm text-muted-foreground">
                {selected.location && <p className="flex items-center gap-2"><MapPin className="size-4 text-[#f3d27a]" />{selected.location}</p>}
                {selected.headline && <p className="text-foreground">{selected.headline}</p>}
                {selected.bio && <p className="whitespace-pre-line">{selected.bio}</p>}
                {selected.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{selected.skills.map((skill) => <span key={skill} className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground">{skill}</span>)}</div>}
                <DdniButton href={connectLink(selected)} target={connectLink(selected).startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"><ExternalLink />Connect with {selected.name.split(" ")[0]}</DdniButton>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </ViewContainer>
  )
}
