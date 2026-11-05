"use client"

import { useMemo, useState } from "react"
import { ArrowRight, BookOpen, Bookmark, CalendarDays, Download, Eye, FileText, LayoutGrid, Library, Play, Presentation, Star, Tag, Video } from "lucide-react"
import { COURSES } from "@/lib/courses"
import { cn } from "@/lib/utils"
import { formatDate, type Resource } from "@/lib/dashboard-data"
import { CourseCover, DdniButton, EmptyPanel, LoadingBlock, PageHeading, Pill, SearchBox, SelectField, UnderlineTabs, type TabItem } from "@/components/dashboard/ddni-ui"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

type TabId = "all" | "manuals" | "recordings" | "presentations" | "saved"

const TOPICS: { label: string; pattern: RegExp }[] = [
  { label: "Identity & Purpose", pattern: /identity|purpose|self/i },
  { label: "Marketplace", pattern: /marketplace|business|work|career/i },
  { label: "Holy Spirit", pattern: /spirit|gift|prayer/i },
  { label: "Leadership", pattern: /leader|influence|pioneer/i },
]

const isMedia = (resource: Resource) => /video|recording|audio|podcast|webinar/i.test(`${resource.type} ${resource.title}`)
const isPresentation = (resource: Resource) => /presentation|slides|ppt|keynote/i.test(`${resource.type} ${resource.title}`)
const isManual = (resource: Resource) => /manual|workbook|guide|notes|worksheet/i.test(`${resource.type} ${resource.title}`)

function matchCourse(resource: Resource) {
  const haystack = `${resource.title} ${resource.description}`.toLowerCase()
  return COURSES.find((course) => haystack.includes(course.title.toLowerCase()))
}

function ResourceCover({ resource, course }: { resource: Resource; course: ReturnType<typeof matchCourse> }) {
  if (course && !isMedia(resource) && !isPresentation(resource)) {
    return <CourseCover title={course.title} image={course.image} className="aspect-[4/5]" />
  }
  const media = isMedia(resource)
  const Icon = media ? Video : isPresentation(resource) ? Presentation : FileText
  return (
    <div role="img" aria-label={`${resource.title} cover`} className={cn("relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-md p-2 text-center shadow-md ring-1 ring-[#c9a14f]/30", media ? "bg-[radial-gradient(circle_at_50%_30%,#3a3f6b,#0a0f24)]" : "bg-[linear-gradient(160deg,#10294d,#071428)]")}>
      {media ? (
        <span className="grid size-12 place-items-center rounded-full border-2 border-white/80 bg-black/30 text-white"><Play className="size-5 fill-current" /></span>
      ) : (
        <Icon className="size-8 text-[#e4c276]" aria-hidden />
      )}
      <span className="ddni-serif line-clamp-3 text-[11px] font-semibold uppercase leading-tight tracking-wide text-[#e4c276]">{media ? "Recording" : resource.type}</span>
    </div>
  )
}

function ResourceCard({ resource, saved, onToggleSave }: { resource: Resource; saved: boolean; onToggleSave: () => void }) {
  const course = matchCourse(resource)
  const TypeIcon = isMedia(resource) ? Video : FileText
  return (
    <article className="ddni-card ddni-card-hover flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex gap-3 sm:gap-4">
        <div className="w-24 shrink-0 sm:w-28"><ResourceCover resource={resource} course={course} /></div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 className="ddni-serif text-base leading-snug font-bold text-foreground sm:text-lg">{resource.title}</h3>
          {course && <Pill tone="gray" className="max-w-full truncate">Course: {course.title}</Pill>}
          <ul className="flex flex-col gap-1 text-sm text-foreground/80">
            <li className="flex items-center gap-2"><TypeIcon className="size-4 shrink-0" aria-hidden />{resource.type}</li>
            {resource.createdAt && <li className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0" aria-hidden />{formatDate(resource.createdAt, { day: "numeric", month: "long", year: "numeric" })}</li>}
          </ul>
          {resource.description && <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80">{resource.description}</p>}
        </div>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2">
        <DdniButton variant="outline" size="sm" href={resource.url || undefined} target="_blank" rel="noopener noreferrer" disabled={!resource.url} title={resource.url ? undefined : "Link coming soon"}><Eye />Preview</DdniButton>
        <DdniButton size="sm" href={resource.url || undefined} target="_blank" rel="noopener noreferrer" download disabled={!resource.url} title={resource.url ? undefined : "Link coming soon"}><Download />Download</DdniButton>
        <DdniButton variant="outline" size="sm" onClick={onToggleSave} aria-pressed={saved} aria-label={saved ? `Remove ${resource.title} from saved` : `Save ${resource.title}`}><Bookmark className={saved ? "fill-current" : ""} />{saved ? "Saved" : "Save"}</DdniButton>
      </div>
    </article>
  )
}

export function LibraryView({ data, onNavigate }: DashboardViewProps) {
  const [query, setQuery] = useState("")
  const [course, setCourse] = useState("all")
  const [topic, setTopic] = useState("all")
  const [fileType, setFileType] = useState("all")
  const [tab, setTab] = useState<TabId>("all")
  const [saved, setSaved] = useState<Set<string>>(() => new Set())

  const sorted = useMemo(() => [...data.resources].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [data.resources])
  const fileTypes = useMemo(() => Array.from(new Set(data.resources.map((resource) => resource.type))).sort(), [data.resources])

  const counts = {
    all: sorted.length,
    manuals: sorted.filter(isManual).length,
    recordings: sorted.filter(isMedia).length,
    presentations: sorted.filter(isPresentation).length,
    saved: sorted.filter((resource) => saved.has(resource.id)).length,
  }
  const tabs: TabItem<TabId>[] = [
    { id: "all", label: "All Resources", icon: LayoutGrid, count: counts.all },
    { id: "manuals", label: "Course Manuals", icon: BookOpen, count: counts.manuals },
    { id: "recordings", label: "Recordings", icon: Play, count: counts.recordings },
    { id: "presentations", label: "Presentations", icon: Presentation, count: counts.presentations },
    { id: "saved", label: "Saved", icon: Bookmark, count: counts.saved },
  ]

  const visible = sorted.filter((resource) => {
    const q = query.trim().toLowerCase()
    if (q && ![resource.title, resource.description, resource.type].some((value) => value.toLowerCase().includes(q))) return false
    if (course !== "all" && matchCourse(resource)?.id !== course) return false
    if (fileType !== "all" && resource.type !== fileType) return false
    if (topic !== "all") {
      const entry = TOPICS.find((item) => item.label === topic)
      if (entry && !entry.pattern.test(`${resource.title} ${resource.description}`)) return false
    }
    if (tab === "manuals") return isManual(resource)
    if (tab === "recordings") return isMedia(resource)
    if (tab === "presentations") return isPresentation(resource)
    if (tab === "saved") return saved.has(resource.id)
    return true
  })

  const filtering = query !== "" || course !== "all" || topic !== "all" || fileType !== "all" || tab !== "all"

  function reset() {
    setQuery("")
    setCourse("all")
    setTopic("all")
    setFileType("all")
    setTab("all")
  }

  function toggleSaved(id: string) {
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading title="Resource Library" subtitle="Resources to support your learning and growth." onHome={() => onNavigate("overview")} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <SearchBox value={query} onChange={setQuery} placeholder="Search resources by title, keyword or author..." label="Search resources" className="self-center" />
        <SelectField id="library-course" label="Course" value={course} onChange={setCourse} icon={BookOpen} options={[{ value: "all", label: "All Courses" }, ...COURSES.map((item) => ({ value: item.id, label: item.title }))]} />
        <SelectField id="library-topic" label="Topic" value={topic} onChange={setTopic} icon={Tag} options={[{ value: "all", label: "All Topics" }, ...TOPICS.map((item) => ({ value: item.label, label: item.label }))]} />
        <SelectField id="library-type" label="File Type" value={fileType} onChange={setFileType} icon={FileText} options={[{ value: "all", label: "All File Types" }, ...fileTypes.map((type) => ({ value: type, label: type }))]} />
      </div>

      <UnderlineTabs label="Resource categories" items={tabs} value={tab} onChange={setTab} />

      <section className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#eadfc6] bg-[linear-gradient(90deg,#f8efdb,#faf4e6)] p-4 sm:flex-row sm:items-center sm:p-5" aria-label="Recently added">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-[#f1e2bd] text-[#a9792a]"><Star className="size-8 fill-current" aria-hidden /></span>
          <div>
            <h3 className="ddni-serif text-xl font-bold text-foreground">Recently Added</h3>
            <p className="text-sm text-foreground/80">Check out the latest resources added to the library.</p>
          </div>
        </div>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-[#8a6420] underline underline-offset-4 transition-colors hover:text-[#5f4312] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c1d3a]">View all resources<ArrowRight className="size-4" /></button>
      </section>

      {data.errors.resources && <p role="alert" className="text-sm text-[#b3261e]">{data.errors.resources}</p>}

      {data.loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <LoadingBlock key={i} className="h-72" />)}</div>
      ) : visible.length === 0 ? (
        <EmptyPanel
          icon={Library}
          title={data.resources.length ? (tab === "saved" && !filtering ? "Nothing saved yet" : "No resources match your filters") : "The library is being curated"}
          description={data.resources.length ? "Try a different search, filter or category." : "Manuals, recordings and presentations will appear here once they are published."}
          action={filtering ? <DdniButton variant="outline" onClick={reset}>Clear filters</DdniButton> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((resource) => <ResourceCard key={resource.id} resource={resource} saved={saved.has(resource.id)} onToggleSave={() => toggleSaved(resource.id)} />)}
        </div>
      )}
    </div>
  )
}
