"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EmptyState, StatusMessage, ViewHeader } from "@/components/dashboard/dashboard-ui"
import { SUPPORT_EMAIL, enrollmentFor, formatDate, type Course, type Resource } from "@/lib/dashboard-data"
import { catalogCourse } from "@/lib/courses"
import { BookOpen, CalendarDays, Check, Clock, ExternalLink, FileText, MapPin, PlayCircle, Search, UserRound, Users, Video } from "lucide-react"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

const isMedia = (type: string) => /video|recording|audio|podcast|webinar/i.test(type)

function FilterChips({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  if (options.length <= 1) return null
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">
      {options.map((option) => (
        <Button key={option} size="sm" variant={value === option ? "default" : "outline"} aria-pressed={value === option} className={value === option ? "btn-gold h-7 text-xs" : "h-7 text-xs"} onClick={() => onChange(option)}>
          {option}
        </Button>
      ))}
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-8 pl-8 text-sm" />
    </div>
  )
}

function ResourceAction({ resource }: { resource: Resource }) {
  if (!resource.url) return <span className="text-xs text-muted-foreground">Link coming soon</span>
  const Icon = isMedia(resource.type) ? PlayCircle : ExternalLink
  return (
    <Button variant="outline" size="sm" className="h-7 text-xs" render={<a href={resource.url} target="_blank" rel="noopener noreferrer" />}>
      <Icon data-icon="inline-start" />{isMedia(resource.type) ? "Watch" : "Open"}
    </Button>
  )
}

function accessCopy(course: Course, status: string | undefined) {
  if (status === "enrolled") return course.isFree ? "You’re registered. You have immediate access to this free course." : "Access granted. You’re confirmed for this course."
  if (status === "pending") return "Sign-up received. An administrator will grant access after payment is confirmed."
  if (status === "revoked") return "Access was revoked. You can request access again."
  return course.isFree ? "Sign up to get immediate access." : "Sign up to request access. An administrator will confirm paid enrolment."
}

export function InstituteView({ data, onRequestCourseAccess }: DashboardViewProps) {
  const [courseQuery, setCourseQuery] = useState("")
  const [courseFilter, setCourseFilter] = useState("All")
  const [resourceQuery, setResourceQuery] = useState("")
  const [resourceType, setResourceType] = useState("All")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null)
  const [signupMessage, setSignupMessage] = useState("")

  const resourceTypes = useMemo(() => ["All", ...Array.from(new Set(data.resources.map((r) => r.type)))], [data.resources])

  const courses = data.courses.filter((course) => {
    const q = courseQuery.trim().toLowerCase()
    const enrollment = enrollmentFor(data.enrollments, course.id)
    const matchesFilter =
      courseFilter === "All"
      || (courseFilter === "My courses" && enrollment?.status === "enrolled")
      || (courseFilter === "Completed" && false)
      || (courseFilter === "Available" && !enrollment)
    return matchesFilter && (!q || [course.title, course.instructor, course.description, course.category].some((value) => value.toLowerCase().includes(q)))
  })
  const resources = data.resources.filter((r) => {
    const q = resourceQuery.trim().toLowerCase()
    return (resourceType === "All" || r.type === resourceType) && (!q || [r.title, r.description].some((v) => v.toLowerCase().includes(q)))
  })

  async function signUp(course: Course) {
    setBusyCourseId(course.id)
    setSignupMessage("")
    const error = await onRequestCourseAccess(course)
    setBusyCourseId(null)
    setSignupMessage(error || (course.isFree ? "You now have access to this course." : "Sign-up received. We’ll grant access once payment is confirmed."))
  }

  const selectedEnrollment = selectedCourse ? enrollmentFor(data.enrollments, selectedCourse.id) : undefined
  const selectedCatalog = catalogCourse(selectedCourse?.slug)

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Home <span className="mx-2">/</span> My Courses</p>
        <ViewHeader kicker="" title="My Courses" description="Continue your journey of growth and distinction." />
      </div>

      <Tabs defaultValue="courses" className="gap-4">
        <TabsList className="h-11 rounded-lg border border-border bg-card p-1 shadow-sm">
          <TabsTrigger value="courses" className="h-9 px-5 data-[state=active]:bg-[#c69b4b] data-[state=active]:text-white">Courses{!data.loading && ` (${data.courses.length})`}</TabsTrigger>
          <TabsTrigger value="resources" className="h-9 px-5 data-[state=active]:bg-[#c69b4b] data-[state=active]:text-white">Resource library{!data.loading && ` (${data.resources.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="flex flex-col gap-5">
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:grid-cols-4">
            {[{ label: "All Courses", value: "All", count: data.courses.length, icon: BookOpen }, { label: "In Progress", value: "My courses", count: data.enrollments.filter((e) => e.status === "enrolled").length, icon: PlayCircle }, { label: "Completed", value: "Completed", count: 0, icon: Check }, { label: "Available Courses", value: "Available", count: data.courses.filter((c) => !enrollmentFor(data.enrollments, c.id)).length, icon: FileText }].map(({ label, value, count, icon: Icon }) => (
              <button key={label} type="button" onClick={() => setCourseFilter(value)} className={`flex items-center justify-center gap-2 border-b border-border px-3 py-4 text-sm font-medium transition sm:border-b-0 sm:border-r last:border-r-0 ${courseFilter === value ? "bg-[#c69b4b] text-white" : "text-foreground hover:bg-muted"}`}>
                <Icon className="size-5" /> <span>{label} ({count})</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{courses.length} courses available for your journey</p>
            <SearchInput value={courseQuery} onChange={setCourseQuery} placeholder="Search courses" />
          </div>
          {data.errors.courses && <StatusMessage tone="error">{data.errors.courses}</StatusMessage>}
          {data.errors.enrollments && <StatusMessage tone="error">{data.errors.enrollments}</StatusMessage>}
          {data.loading ? <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}</div> : courses.length === 0 ? <EmptyState icon={BookOpen} title={data.courses.length ? "No courses match your search" : "Courses are being prepared"} description={data.courses.length ? "Try a different search or filter." : "New courses from the Institute will appear here as soon as they're published."} /> : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {courses.map((course) => {
                const enrollment = enrollmentFor(data.enrollments, course.id)
                const status = enrollment?.status === "enrolled" ? "In Progress" : course.isFree ? "Available" : "Registered"
                return <Card key={course.id} className="flex flex-col rounded-xl border-border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex gap-3"><div className="h-44 w-28 shrink-0 overflow-hidden rounded-md bg-[#102337]">{course.thumbnailUrl ? <img src={course.thumbnailUrl} alt={`${course.title} cover`} className="size-full object-cover" /> : <div className="grid size-full place-items-center"><BookOpen className="size-8 text-[#f3d27a]" /></div>}</div><div className="min-w-0 flex-1"><Badge className={`mb-2 text-[10px] ${status === "Available" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{status}</Badge><h3 className="font-display text-lg leading-tight text-foreground">{course.title}</h3><p className="mt-1 text-xs text-muted-foreground">{course.category} · {course.instructor || "DDNI Faculty"}</p><div className="mt-4 space-y-2 text-xs text-muted-foreground"><p className="flex items-center gap-2"><Users className="size-4 text-foreground" /> In-person</p><p className="flex items-center gap-2"><CalendarDays className="size-4 text-foreground" /> {course.eventDate ? `Starts ${formatDate(course.eventDate)}` : "Starts TBA"}</p><p className="flex items-center gap-2"><Clock className="size-4 text-foreground" /> {course.duration || "3 sessions"}</p></div></div></div>{status === "In Progress" && <div className="mt-3 border-t border-border pt-3"><div className="flex justify-between text-xs font-semibold"><span>Course Progress</span><span>33%</span></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-full w-1/3 rounded-full bg-[#c69b4b]" /></div></div>}<Button className={`mt-3 w-full ${status === "Available" ? "btn-gold" : "bg-transparent text-[#8a6727] shadow-none hover:bg-[#c69b4b]/10"}`} variant={status === "Available" ? "default" : "outline"} onClick={() => { setSelectedCourse(course); setSignupMessage("") }}>{status === "Available" ? "Register →" : status === "In Progress" ? "Continue Learning →" : "View Course →"}</Button></Card>
              })}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><Card className="border-border p-4"><div className="flex items-center justify-between"><h3 className="font-display text-xl"><CalendarDays className="mr-2 inline size-5 text-[#b78935]" />Next Session</h3><button className="text-xs text-muted-foreground">View calendar →</button></div><div className="mt-3 flex gap-3 rounded-lg border border-border p-3"><div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-[#102337]"><img src="/courses/building-self.png" alt="Building Self cover" className="size-full object-cover" /></div><div><Badge variant="secondary" className="text-[10px]">Course 01</Badge><h4 className="mt-1 font-display text-lg">Building Self – Session 2</h4><p className="text-xs text-muted-foreground">Identity and Purpose in the Marketplace</p><p className="mt-2 text-xs text-muted-foreground">5 November 2026 · 19:00 – 21:00 · KAN Apostolic Hub</p></div></div></Card><Card className="border-border p-4"><div className="flex items-center justify-between"><h3 className="font-display text-xl">★ Recommended for You</h3><button className="text-xs text-muted-foreground">View all →</button></div><div className="mt-3 grid grid-cols-3 gap-2">{data.courses.slice(0, 3).map((course) => <button key={course.id} type="button" onClick={() => { setSelectedCourse(course); setSignupMessage("") }} className="text-left"><img src={course.thumbnailUrl || "/courses/building-self.png"} alt={`${course.title} cover`} className="h-20 w-full rounded object-cover" /><p className="mt-1 line-clamp-2 text-xs font-medium">{course.title}</p><span className="mt-2 block text-[11px] text-[#8a6727]">Learn more →</span></button>)}</div></Card></div>
        </TabsContent>

        <TabsContent value="resources" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput value={resourceQuery} onChange={setResourceQuery} placeholder="Search resources" />
            <FilterChips options={resourceTypes} value={resourceType} onChange={setResourceType} />
          </div>
          {data.errors.resources && <StatusMessage tone="error">{data.errors.resources}</StatusMessage>}
          {data.loading ? <Skeleton className="h-48 rounded-xl" /> : resources.length === 0 ? (
            <EmptyState icon={FileText} title={data.resources.length ? "No resources match your search" : "The library is being curated"} description={data.resources.length ? "Try a different search or type." : "Guides, recordings and downloads will appear here once published."} />
          ) : (
            <>
              <Card className="hidden py-0 md:block">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Added</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="max-w-md whitespace-normal">
                          <p className="font-medium text-foreground">{resource.title}</p>
                          {resource.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{resource.description}</p>}
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{resource.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(resource.createdAt)}</TableCell>
                        <TableCell className="text-right"><ResourceAction resource={resource} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              <div className="flex flex-col gap-3 md:hidden">
                {resources.map((resource) => (
                  <Card key={resource.id} size="sm">
                    <CardContent className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-foreground">{resource.title}</p><Badge variant="secondary" className="shrink-0 text-[10px]">{resource.type}</Badge></div>
                      {resource.description && <p className="text-xs text-muted-foreground">{resource.description}</p>}
                      <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{formatDate(resource.createdAt)}</span><ResourceAction resource={resource} /></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={selectedCourse !== null} onOpenChange={(open) => { if (!open) { setSelectedCourse(null); setSignupMessage("") } }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selectedCourse && (
            <>
              <div className="aspect-[16/9] w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#132c40] to-[#0c1e2c]">
                {selectedCourse.thumbnailUrl ? <img src={selectedCourse.thumbnailUrl} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center"><BookOpen className="size-10 text-[#f3d27a]/60" /></div>}
              </div>
              <SheetHeader className="gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="w-fit text-[10px]">{selectedCourse.isFree ? "Free" : "Paid"}</Badge>
                  {selectedEnrollment?.status === "enrolled" && <Badge className="w-fit text-[10px]">Access granted</Badge>}
                  {selectedEnrollment?.status === "pending" && <Badge variant="secondary" className="w-fit text-[10px]">Awaiting access</Badge>}
                </div>
                <SheetTitle className="font-display text-xl">{selectedCourse.title}</SheetTitle>
                <SheetDescription className="whitespace-pre-line">{selectedCourse.description || "Full course details will be shared by the Institute team."}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4 text-sm text-muted-foreground">
                {selectedCourse.instructor && <p className="flex items-center gap-2"><UserRound className="size-4 text-[#f3d27a]" />{selectedCourse.instructor}</p>}
                {selectedCourse.eventDate && <p className="flex items-center gap-2"><CalendarDays className="size-4 text-[#f3d27a]" />{formatDate(selectedCourse.eventDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) || selectedCourse.eventDate}</p>}
                {selectedCourse.duration && <p className="flex items-center gap-2"><Clock className="size-4 text-[#f3d27a]" />{selectedCourse.duration}</p>}
                {selectedCourse.price && <p className="flex items-center gap-2"><span className="text-[#f3d27a]">{selectedCourse.price}</span></p>}
              </div>
              {selectedCatalog?.formats.length ? (
                <div className="flex flex-col gap-3 px-4">
                  {selectedCatalog.formats.map((format) => (
                    <div key={format.label} className="rounded-xl border border-border p-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#dcb567]">{format.label}</p>
                        <p className="text-sm font-medium">{format.price}</p>
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <li className="flex gap-2"><CalendarDays className="mt-0.5 size-3.5 shrink-0 text-[#f3d27a]" />{format.seating}</li>
                        <li className="flex gap-2"><Clock className="mt-0.5 size-3.5 shrink-0 text-[#f3d27a]" />{format.time}</li>
                        <li className="flex gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[#f3d27a]" />{format.location.value}</li>
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="px-4 text-sm text-muted-foreground">{accessCopy(selectedCourse, selectedEnrollment?.status)}</p>
              {signupMessage && <div className="px-4"><StatusMessage tone={signupMessage.startsWith("Unable") || signupMessage.startsWith("Please") ? "error" : "success"}>{signupMessage}</StatusMessage></div>}
              <SheetFooter>
                {selectedEnrollment?.status === "enrolled" ? (
                  <Button className="btn-gold" disabled>You have access</Button>
                ) : selectedEnrollment?.status === "pending" ? (
                  <Button className="btn-gold" disabled>Awaiting admin access</Button>
                ) : (
                  <Button className="btn-gold" disabled={busyCourseId === selectedCourse.id} onClick={() => void signUp(selectedCourse)}>
                    {busyCourseId === selectedCourse.id ? "Signing up…" : selectedCourse.isFree ? "Sign up for free access" : selectedEnrollment?.status === "revoked" ? "Request access again" : "Sign up"}
                  </Button>
                )}
                {!selectedCourse.isFree && selectedEnrollment?.status !== "enrolled" && (
                  <Button variant="outline" render={<a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Proof of payment: ${selectedCourse.title}`)}`} />}>Send proof of payment</Button>
                )}
                <Button variant="outline" onClick={() => setSelectedCourse(null)}>Close</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
