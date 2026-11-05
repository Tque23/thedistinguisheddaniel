"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { BookOpen, Check, FileText, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, StatusMessage } from "@/components/dashboard/dashboard-ui"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import {
  deleteCourseAssessment,
  deleteCourseMaterial,
  deleteCourseSession,
  deleteLearningPath,
  gradeAssessmentAttempt,
  saveCourseAssessment,
  saveCourseMaterial,
  saveCourseSession,
  saveLearningPath,
  setLearningItemPublished,
  type AssessmentQuestionSubmission,
  type AssessmentGradeSubmission,
} from "@/src/app/admin/actions"
import { formatDate } from "@/lib/dashboard-data"

type TableRows = Database["public"]["Tables"]
type LearningPath = TableRows["course_learning_paths"]["Row"]
type CourseSession = TableRows["course_sessions"]["Row"]
type CourseMaterial = TableRows["course_materials"]["Row"]
type Assessment = TableRows["course_assessments"]["Row"]
type Question = TableRows["course_assessment_questions"]["Row"]
type Attempt = TableRows["course_assessment_attempts"]["Row"]
type Answer = TableRows["course_assessment_answers"]["Row"]
type AnswerKey = TableRows["course_assessment_answer_keys"]["Row"]
type CourseOption = { id: string; title: string }
type MemberOption = { id: string; email?: string }
type Area = "sessions" | "paths" | "materials" | "assessments" | "reviews"
type QuestionDraft = {
  prompt: string
  questionType: AssessmentQuestionSubmission["questionType"]
  optionsText: string
  correctAnswer: string
  points: string
}

const areas: { id: Area; label: string }[] = [
  { id: "sessions", label: "Sessions" },
  { id: "paths", label: "Learning paths" },
  { id: "materials", label: "Materials" },
  { id: "assessments", label: "Assessments" },
  { id: "reviews", label: "Grading queue" },
]
const tabsClass = "flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
const emptyQuestion: QuestionDraft = { prompt: "", questionType: "multiple_choice", optionsText: "Option 1\nOption 2", correctAnswer: "Option 1", points: "1" }

export function ClassManagement({ courses, members }: { courses: CourseOption[]; members: MemberOption[] }) {
  const [activeArea, setActiveArea] = useState<Area>("sessions")
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "")
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [sessions, setSessions] = useState<CourseSession[]>([])
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null)
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null)
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    try {
      const client = createClient()
      const [pathResult, sessionResult, materialResult, assessmentResult, questionResult, keyResult, attemptResult, answerResult] = await Promise.all([
        client.from("course_learning_paths").select("*").order("created_at", { ascending: false }),
        client.from("course_sessions").select("*").order("course_id").order("position"),
        client.from("course_materials").select("*").order("course_id").order("position"),
        client.from("course_assessments").select("*").order("created_at", { ascending: false }),
        client.from("course_assessment_questions").select("*").order("position"),
        client.from("course_assessment_answer_keys").select("*"),
        client.from("course_assessment_attempts").select("*").order("submitted_at", { ascending: false }),
        client.from("course_assessment_answers").select("*"),
      ])
      const failure = pathResult.error || sessionResult.error || materialResult.error || assessmentResult.error
        || questionResult.error || keyResult.error || attemptResult.error || answerResult.error
      if (failure) {
        console.error("[admin] class management load failed", failure)
        setLoadError("Unable to load class data. Confirm the latest Supabase migration is applied, then reload.")
        return
      }
      setPaths(pathResult.data || [])
      setSessions(sessionResult.data || [])
      setMaterials(materialResult.data || [])
      setAssessments(assessmentResult.data || [])
      setQuestions(questionResult.data || [])
      setAnswerKeys(keyResult.data || [])
      setAttempts(attemptResult.data || [])
      setAnswers(answerResult.data || [])
    } catch (error) {
      console.error("[admin] class management load failed", error)
      setLoadError("Unable to load class data. Reload the page and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedCourseId && courses[0]) setSelectedCourseId(courses[0].id)
  }, [courses, selectedCourseId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const selectedCourse = courses.find((course) => course.id === selectedCourseId)
  const courseSessions = sessions.filter((session) => session.course_id === selectedCourseId)
  const coursePaths = paths.filter((path) => path.course_id === selectedCourseId)
  const courseMaterials = materials.filter((material) => material.course_id === selectedCourseId)
  const courseAssessments = assessments.filter((assessment) => assessment.course_id === selectedCourseId)
  const pendingAttempts = attempts.filter((attempt) => attempt.status === "pending_review")
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])

  async function finishAction<T extends { error?: string }>(action: () => Promise<T>, success: string) {
    setBusy(true)
    setStatus(null)
    try {
      const result = await action()
      if (result.error) {
        setStatus({ tone: "error", text: result.error })
        return false
      }
      setStatus({ tone: "success", text: success })
      await loadData()
      return true
    } catch (error) {
      console.error("[admin] class management action failed", error)
      setStatus({ tone: "error", text: "Unable to save these changes. Please try again." })
      return false
    } finally {
      setBusy(false)
    }
  }

  if (courses.length === 0) {
    return <Card><CardContent className="p-6"><p className="font-medium">Create a course before managing class content.</p><p className="mt-1 text-sm text-muted-foreground">Add a course in Content to start building sessions and assessments.</p></CardContent></Card>
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Course workspace</CardTitle>
          <CardDescription>Build lessons and materials, track member completion, and grade written assessment responses.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Field id="class-course" label="Course">
            <select id="class-course" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-xl" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </Field>
          {selectedCourse && <p className="text-sm text-muted-foreground">{sessions.filter((session) => session.course_id === selectedCourseId && session.published).length} published sessions · {pendingAttempts.length} responses awaiting review</p>}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/70 p-2" role="group" aria-label="Course workspace views">
        {areas.map((area) => (
          <button key={area.id} type="button" aria-pressed={activeArea === area.id} className={`${tabsClass} ${activeArea === area.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} onClick={() => { setActiveArea(area.id); setStatus(null) }}>
            {area.label}{area.id === "reviews" && pendingAttempts.length > 0 ? ` (${pendingAttempts.length})` : ""}
          </button>
        ))}
      </div>

      {loadError && <StatusMessage tone="error">{loadError} <Button size="sm" variant="outline" onClick={() => void loadData()}>Reload class data</Button></StatusMessage>}
      {status && <StatusMessage tone={status.tone}>{status.text}</StatusMessage>}
      {loading ? <p role="status" className="text-sm text-muted-foreground">Loading course workspace…</p> : (
        <>
          {activeArea === "sessions" && <SessionsPanel
            courseId={selectedCourseId}
            sessions={courseSessions}
            paths={coursePaths}
            editing={editingSession}
            busy={busy}
            onEdit={setEditingSession}
            onSave={(input) => finishAction(() => saveCourseSession(input), "Session saved.")}
            onDelete={async (id) => {
              if (!window.confirm("Delete this session? Its materials and assessment links will be removed; member progress will prevent deletion.")) return
              await finishAction(() => deleteCourseSession(id), "Session removed.")
            }}
            onPublish={(id, published) => finishAction(() => setLearningItemPublished("session", id, published), published ? "Session published." : "Session hidden.")}
          />}
          {activeArea === "paths" && <PathsPanel
            courseId={selectedCourseId}
            paths={coursePaths}
            editing={editingPath}
            busy={busy}
            onEdit={setEditingPath}
            onSave={(input) => finishAction(() => saveLearningPath(input), "Learning path saved.")}
            onDelete={async (id) => {
              if (!window.confirm("Delete this learning path? Its sessions will remain and become unassigned.")) return
              await finishAction(() => deleteLearningPath(id), "Learning path removed.")
            }}
            onPublish={(id, published) => finishAction(() => setLearningItemPublished("path", id, published), published ? "Learning path published." : "Learning path hidden.")}
          />}
          {activeArea === "materials" && <MaterialsPanel
            courseId={selectedCourseId}
            sessions={courseSessions}
            materials={courseMaterials}
            editing={editingMaterial}
            busy={busy}
            onEdit={setEditingMaterial}
            onSave={(input) => finishAction(() => saveCourseMaterial(input), "Material saved.")}
            onDelete={async (id) => {
              if (!window.confirm("Delete this material? Members will no longer be able to open it.")) return
              await finishAction(() => deleteCourseMaterial(id), "Material removed.")
            }}
            onPublish={(id, published) => finishAction(() => setLearningItemPublished("material", id, published), published ? "Material published." : "Material hidden.")}
          />}
          {activeArea === "assessments" && <AssessmentsPanel
            courseId={selectedCourseId}
            sessions={courseSessions}
            assessments={courseAssessments}
            questions={questions}
            answerKeys={answerKeys}
            attempts={attempts}
            editing={editingAssessment}
            busy={busy}
            onEdit={setEditingAssessment}
            onSave={(input) => finishAction(() => saveCourseAssessment(input), "Assessment saved.")}
            onDelete={async (id) => {
              if (!window.confirm("Delete this assessment? Submitted attempts are retained and prevent deletion.")) return
              await finishAction(() => deleteCourseAssessment(id), "Assessment removed.")
            }}
            onPublish={(id, published) => finishAction(() => setLearningItemPublished("assessment", id, published), published ? "Assessment published." : "Assessment hidden.")}
          />}
          {activeArea === "reviews" && <ReviewPanel
            attempts={pendingAttempts}
            assessments={assessments}
            questions={questions}
            answers={answers}
            members={memberById}
            busy={busy}
            onGrade={(id, grades) => finishAction(() => gradeAssessmentAttempt(id, grades), "Assessment grading saved.")}
          />}
        </>
      )}
    </div>
  )
}

function SessionsPanel({
  courseId, sessions, paths, editing, busy, onEdit, onSave, onDelete, onPublish,
}: {
  courseId: string
  sessions: CourseSession[]
  paths: LearningPath[]
  editing: CourseSession | null
  busy: boolean
  onEdit: (session: CourseSession | null) => void
  onSave: (input: Parameters<typeof saveCourseSession>[0]) => Promise<boolean>
  onDelete: (id: string) => void
  onPublish: (id: string, published: boolean) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [duration, setDuration] = useState("0")
  const [position, setPosition] = useState(String(sessions.length))
  const [pathId, setPathId] = useState("")
  const [published, setPublished] = useState(false)
  useEffect(() => {
    setTitle(editing?.title || "")
    setDescription(editing?.description || "")
    setVideoUrl(editing?.video_url || "")
    setDuration(String(editing?.duration_minutes ?? 0))
    setPosition(String(editing?.position ?? sessions.length))
    setPathId(editing?.path_id || "")
    setPublished(editing?.published || false)
  }, [editing, sessions.length])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = await onSave({
      id: editing?.id,
      courseId,
      pathId: pathId || null,
      title,
      description,
      videoUrl,
      durationMinutes: Number(duration),
      position: Number(position),
      published,
    })
    if (saved) onEdit(null)
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <Card className="h-fit">
        <CardHeader><CardTitle>{editing ? "Edit session" : "Add session"}</CardTitle><CardDescription>Sessions form the lessons members can complete to track progress.</CardDescription></CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
            <Field id="session-title" label="Session title"><Input id="session-title" required minLength={2} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
            <Field id="session-description" label="Description"><Textarea id="session-description" rows={4} maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
            <Field id="session-video" label="Video link"><Input id="session-video" type="url" maxLength={2048} placeholder="https://…" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="session-duration" label="Duration (minutes)"><Input id="session-duration" type="number" min={0} max={1440} step={1} value={duration} onChange={(event) => setDuration(event.target.value)} /></Field>
              <Field id="session-position" label="Order"><Input id="session-position" type="number" min={0} max={10000} step={1} value={position} onChange={(event) => setPosition(event.target.value)} /></Field>
            </div>
            <Field id="session-path" label="Learning path">
              <select id="session-path" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={pathId} onChange={(event) => setPathId(event.target.value)}>
                <option value="">No path</option>{paths.map((path) => <option key={path.id} value={path.id}>{path.title}</option>)}
              </select>
            </Field>
            <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />Publish session to enrolled members</label>
            <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save session" : "Add session"}</Button>{editing && <Button type="button" variant="outline" onClick={() => onEdit(null)}>Cancel</Button>}</div>
          </form>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Sessions</CardTitle><CardDescription>Members see published sessions in this order.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">
        {sessions.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No sessions yet. Add the first lesson using the form.</p>}
        {sessions.map((session) => <ItemRow key={session.id} icon={BookOpen} title={session.title} detail={`${session.duration_minutes} min · Order ${session.position}`} published={session.published} onEdit={() => onEdit(session)} onDelete={() => onDelete(session.id)} onPublish={() => onPublish(session.id, !session.published)} />)}
      </CardContent></Card>
    </div>
  )
}

function PathsPanel({
  courseId, paths, editing, busy, onEdit, onSave, onDelete, onPublish,
}: {
  courseId: string
  paths: LearningPath[]
  editing: LearningPath | null
  busy: boolean
  onEdit: (path: LearningPath | null) => void
  onSave: (input: Parameters<typeof saveLearningPath>[0]) => Promise<boolean>
  onDelete: (id: string) => void
  onPublish: (id: string, published: boolean) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [published, setPublished] = useState(false)
  useEffect(() => {
    setTitle(editing?.title || "")
    setDescription(editing?.description || "")
    setPublished(editing?.published || false)
  }, [editing])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = await onSave({ id: editing?.id, courseId, title, description, published })
    if (saved) onEdit(null)
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <Card className="h-fit"><CardHeader><CardTitle>{editing ? "Edit learning path" : "Add learning path"}</CardTitle><CardDescription>Assign sessions to this path from the Sessions view.</CardDescription></CardHeader><CardContent>
        <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
          <Field id="path-title" label="Path title"><Input id="path-title" required minLength={2} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
          <Field id="path-description" label="Description"><Textarea id="path-description" maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
          <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />Publish path to enrolled members</label>
          <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save path" : "Add path"}</Button>{editing && <Button type="button" variant="outline" onClick={() => onEdit(null)}>Cancel</Button>}</div>
        </form>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Learning paths</CardTitle><CardDescription>Paths organize course sessions into a guided sequence.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">
        {paths.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No learning paths yet. Add one, then assign sessions to it.</p>}
        {paths.map((path) => <ItemRow key={path.id} icon={BookOpen} title={path.title} detail={path.description || "No description"} published={path.published} onEdit={() => onEdit(path)} onDelete={() => onDelete(path.id)} onPublish={() => onPublish(path.id, !path.published)} />)}
      </CardContent></Card>
    </div>
  )
}

function MaterialsPanel({
  courseId, sessions, materials, editing, busy, onEdit, onSave, onDelete, onPublish,
}: {
  courseId: string
  sessions: CourseSession[]
  materials: CourseMaterial[]
  editing: CourseMaterial | null
  busy: boolean
  onEdit: (material: CourseMaterial | null) => void
  onSave: (input: Parameters<typeof saveCourseMaterial>[0]) => Promise<boolean>
  onDelete: (id: string) => void
  onPublish: (id: string, published: boolean) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [resourceType, setResourceType] = useState("PDF")
  const [url, setUrl] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [position, setPosition] = useState(String(materials.length))
  const [published, setPublished] = useState(false)
  useEffect(() => {
    setTitle(editing?.title || "")
    setDescription(editing?.description || "")
    setResourceType(editing?.resource_type || "PDF")
    setUrl(editing?.url || "")
    setSessionId(editing?.session_id || "")
    setPosition(String(editing?.position ?? materials.length))
    setPublished(editing?.published || false)
  }, [editing, materials.length])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = await onSave({
      id: editing?.id,
      courseId,
      sessionId: sessionId || null,
      title,
      description,
      resourceType,
      url,
      position: Number(position),
      published,
    })
    if (saved) onEdit(null)
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <Card className="h-fit"><CardHeader><CardTitle>{editing ? "Edit material" : "Add material"}</CardTitle><CardDescription>Use a full HTTPS or HTTP link to a file or learning resource.</CardDescription></CardHeader><CardContent>
        <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
          <Field id="material-title" label="Title"><Input id="material-title" required minLength={2} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
          <Field id="material-description" label="Description"><Textarea id="material-description" maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
          <Field id="material-type" label="Type"><select id="material-type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={resourceType} onChange={(event) => setResourceType(event.target.value)}>{["PDF", "Guide", "Workbook", "Video", "Recording", "Audio", "Link"].map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field id="material-url" label="Link"><Input id="material-url" type="url" required maxLength={2048} placeholder="https://…" value={url} onChange={(event) => setUrl(event.target.value)} /></Field>
          <Field id="material-session" label="Session (optional)"><select id="material-session" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={sessionId} onChange={(event) => setSessionId(event.target.value)}><option value="">Course-wide</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}</select></Field>
          <Field id="material-position" label="Order"><Input id="material-position" type="number" min={0} max={10000} step={1} value={position} onChange={(event) => setPosition(event.target.value)} /></Field>
          <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />Publish material to enrolled members</label>
          <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save material" : "Add material"}</Button>{editing && <Button type="button" variant="outline" onClick={() => onEdit(null)}>Cancel</Button>}</div>
        </form>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Course materials</CardTitle><CardDescription>Members can open published materials from their course workspace.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">
        {materials.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No materials yet. Add a link using the form.</p>}
        {materials.map((material) => <ItemRow key={material.id} icon={FileText} title={material.title} detail={`${material.resource_type} · ${sessions.find((session) => session.id === material.session_id)?.title || "Course-wide"}`} published={material.published} onEdit={() => onEdit(material)} onDelete={() => onDelete(material.id)} onPublish={() => onPublish(material.id, !material.published)} />)}
      </CardContent></Card>
    </div>
  )
}

function AssessmentsPanel({
  courseId, sessions, assessments, questions, answerKeys, attempts, editing, busy, onEdit, onSave, onDelete, onPublish,
}: {
  courseId: string
  sessions: CourseSession[]
  assessments: Assessment[]
  questions: Question[]
  answerKeys: AnswerKey[]
  attempts: Attempt[]
  editing: Assessment | null
  busy: boolean
  onEdit: (assessment: Assessment | null) => void
  onSave: (input: Parameters<typeof saveCourseAssessment>[0]) => Promise<boolean>
  onDelete: (id: string) => void
  onPublish: (id: string, published: boolean) => void
}) {
  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [maxAttempts, setMaxAttempts] = useState("3")
  const [published, setPublished] = useState(false)
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([{ ...emptyQuestion }])
  const editingHasAttempts = Boolean(editing && attempts.some((attempt) => attempt.assessment_id === editing.id))
  useEffect(() => {
    setTitle(editing?.title || "")
    setInstructions(editing?.instructions || "")
    setSessionId(editing?.session_id || "")
    setMaxAttempts(String(editing?.max_attempts ?? 3))
    setPublished(editing?.published || false)
    if (editing) {
      setQuestionDrafts(questions.filter((question) => question.assessment_id === editing.id).map((question) => {
        const key = answerKeys.find((item) => item.question_id === question.id)
        const options = Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === "string") : []
        return {
          prompt: question.prompt,
          questionType: question.question_type,
          optionsText: options.join("\n"),
          correctAnswer: key?.correct_answer || "",
          points: String(question.points),
        }
      }))
    } else {
      setQuestionDrafts([{ ...emptyQuestion }])
    }
  }, [editing, questions, answerKeys])

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestionDrafts((current) => current.map((question, itemIndex) => itemIndex === index ? { ...question, ...patch } : question))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const questionsToSave: AssessmentQuestionSubmission[] = questionDrafts.map((question) => ({
      prompt: question.prompt,
      questionType: question.questionType,
      options: question.questionType === "multiple_choice" ? question.optionsText.split("\n").map((option) => option.trim()).filter(Boolean) : question.questionType === "true_false" ? ["True", "False"] : [],
      correctAnswer: question.questionType === "written" ? null : question.correctAnswer,
      points: Number(question.points),
    }))
    const saved = await onSave({
      id: editing?.id,
      courseId,
      sessionId: sessionId || null,
      title,
      instructions,
      maxAttempts: Number(maxAttempts),
      published,
      questions: questionsToSave,
    })
    if (saved) onEdit(null)
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(19rem,0.85fr)_minmax(0,1.15fr)]">
      <Card className="h-fit"><CardHeader><CardTitle>{editing ? "Edit assessment" : "Create assessment"}</CardTitle><CardDescription>Objective questions are scored automatically. Written responses go to the grading queue.</CardDescription></CardHeader><CardContent>
        <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
          <Field id="assessment-title" label="Assessment title"><Input id="assessment-title" required minLength={2} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
          <Field id="assessment-instructions" label="Instructions"><Textarea id="assessment-instructions" maxLength={2000} value={instructions} onChange={(event) => setInstructions(event.target.value)} /></Field>
          <Field id="assessment-session" label="Session (optional)"><select id="assessment-session" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={sessionId} onChange={(event) => setSessionId(event.target.value)}><option value="">Course-wide</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}</select></Field>
          <Field id="assessment-attempts" label="Maximum attempts"><Input id="assessment-attempts" type="number" min={1} max={50} step={1} required value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} /></Field>
          <div className="flex flex-col gap-4">
            {questionDrafts.map((question, index) => {
              const options = question.optionsText.split("\n").map((option) => option.trim()).filter(Boolean)
              return <fieldset key={index} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border p-4">
                <legend className="px-1 text-sm font-semibold">Question {index + 1}</legend>
                <Field id={`question-${index}-prompt`} label="Prompt"><Textarea id={`question-${index}-prompt`} required minLength={2} maxLength={2000} value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id={`question-${index}-type`} label="Format"><select id={`question-${index}-type`} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={question.questionType} onChange={(event) => {
                    const questionType = event.target.value as QuestionDraft["questionType"]
                    updateQuestion(index, { questionType, optionsText: questionType === "true_false" ? "True\nFalse" : questionType === "multiple_choice" ? "Option 1\nOption 2" : "", correctAnswer: questionType === "true_false" ? "True" : questionType === "multiple_choice" ? "Option 1" : "" })
                  }}><option value="multiple_choice">Multiple choice</option><option value="true_false">True or false</option><option value="written">Written response</option></select></Field>
                  <Field id={`question-${index}-points`} label="Points"><Input id={`question-${index}-points`} type="number" min={1} max={100} step={1} required value={question.points} onChange={(event) => updateQuestion(index, { points: event.target.value })} /></Field>
                </div>
                {question.questionType === "multiple_choice" && <>
                  <Field id={`question-${index}-options`} label="Options (one per line)"><Textarea id={`question-${index}-options`} required value={question.optionsText} onChange={(event) => updateQuestion(index, { optionsText: event.target.value })} /></Field>
                  <Field id={`question-${index}-correct`} label="Correct answer"><select id={`question-${index}-correct`} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required value={question.correctAnswer} onChange={(event) => updateQuestion(index, { correctAnswer: event.target.value })}><option value="">Select the correct answer</option>{options.map((option, optionIndex) => <option key={`${option}-${optionIndex}`} value={option}>{option}</option>)}</select></Field>
                </>}
                {question.questionType === "true_false" && <Field id={`question-${index}-truth`} label="Correct answer"><select id={`question-${index}-truth`} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={question.correctAnswer} onChange={(event) => updateQuestion(index, { correctAnswer: event.target.value })}><option>True</option><option>False</option></select></Field>}
                {questionDrafts.length > 1 && <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setQuestionDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove question {index + 1}</Button>}
              </fieldset>
            })}
            <Button type="button" variant="outline" className="self-start" disabled={questionDrafts.length >= 100} onClick={() => setQuestionDrafts((current) => [...current, { ...emptyQuestion }])}><Plus data-icon="inline-start" />Add question</Button>
          </div>
          <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />Publish assessment to enrolled members</label>
          {editingHasAttempts && <p className="text-sm text-muted-foreground">This assessment has submissions. Its questions are locked to preserve existing results.</p>}
          <div className="flex gap-2"><Button type="submit" disabled={busy || editingHasAttempts}>{busy ? "Saving…" : editing ? "Save assessment" : "Create assessment"}</Button>{editing && <Button type="button" variant="outline" onClick={() => onEdit(null)}>Cancel</Button>}</div>
        </form>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Assessments</CardTitle><CardDescription>Members can submit up to the configured attempt limit.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">
        {assessments.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No assessments yet. Create one using the form.</p>}
        {assessments.map((assessment) => {
          const itemQuestions = questions.filter((question) => question.assessment_id === assessment.id)
          const submissions = attempts.filter((attempt) => attempt.assessment_id === assessment.id).length
          const locked = submissions > 0
          return <div key={assessment.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-2"><h3 className="min-w-0 flex-1 font-medium">{assessment.title}</h3><Badge variant={assessment.published ? "default" : "secondary"}>{assessment.published ? "Published" : "Hidden"}</Badge></div>
            <p className="text-sm text-muted-foreground">{itemQuestions.length} questions · {assessment.max_attempts} attempts · {submissions} submissions</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={locked} onClick={() => onEdit(assessment)} aria-label={locked ? `${assessment.title} is locked after submissions` : `Edit ${assessment.title}`}><Pencil data-icon="inline-start" />{locked ? "Questions locked" : "Edit"}</Button>
              <Button size="sm" variant="outline" onClick={() => onPublish(assessment.id, !assessment.published)}>{assessment.published ? "Hide" : "Publish"}</Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => onDelete(assessment.id)}><Trash2 data-icon="inline-start" />Delete</Button>
            </div>
          </div>
        })}
      </CardContent></Card>
    </div>
  )
}

function ReviewPanel({
  attempts, assessments, questions, answers, members, busy, onGrade,
}: {
  attempts: Attempt[]
  assessments: Assessment[]
  questions: Question[]
  answers: Answer[]
  members: Map<string, MemberOption>
  busy: boolean
  onGrade: (attemptId: string, grades: AssessmentGradeSubmission[]) => Promise<boolean>
}) {
  const [scores, setScores] = useState<Record<string, Record<string, string>>>({})
  const [feedback, setFeedback] = useState<Record<string, Record<string, string>>>({})
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>, attempt: Attempt, pendingAnswers: Answer[]) {
    event.preventDefault()
    setError("")
    if (pendingAnswers.some((answer) => !scores[attempt.id]?.[answer.question_id]?.trim())) {
      setError("Enter a whole-number score for each response.")
      return
    }
    const grades = pendingAnswers.map((answer) => ({
      questionId: answer.question_id,
      pointsAwarded: Number(scores[attempt.id]?.[answer.question_id]),
      feedback: feedback[attempt.id]?.[answer.question_id] || "",
    }))
    if (grades.some((grade) => !Number.isInteger(grade.pointsAwarded) || grade.pointsAwarded < 0)) {
      setError("Enter a whole-number score for each response.")
      return
    }
    const saved = await onGrade(attempt.id, grades)
    if (!saved) setError("Unable to save this assessment grade.")
  }

  if (attempts.length === 0) return <Card><CardHeader><CardTitle>Grading queue</CardTitle><CardDescription>Written responses submitted by members appear here.</CardDescription></CardHeader><CardContent><p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No written responses are waiting for review.</p></CardContent></Card>

  return (
    <div className="flex flex-col gap-4">
      <Card><CardHeader><CardTitle>Grading queue</CardTitle><CardDescription>Score each written response and add feedback before releasing the result to the member.</CardDescription></CardHeader></Card>
      {error && <StatusMessage tone="error">{error}</StatusMessage>}
      {attempts.map((attempt) => {
        const assessment = assessments.find((item) => item.id === attempt.assessment_id)
        const member = members.get(attempt.user_id)
        const writtenAnswers = answers.filter((answer) => answer.attempt_id === attempt.id && answer.is_correct === null)
        return <Card key={attempt.id}><CardHeader><CardTitle>{assessment?.title || "Assessment"}</CardTitle><CardDescription>{member?.email || `Member ${attempt.user_id.slice(0, 8)}`} · Submitted {formatDate(attempt.submitted_at)}</CardDescription></CardHeader><CardContent>
          <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event, attempt, writtenAnswers)}>
            {writtenAnswers.map((answer) => {
              const question = questions.find((item) => item.id === answer.question_id)
              return <fieldset key={answer.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
                <legend className="px-1 text-sm font-semibold">{question?.prompt || "Written response"}</legend>
                <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{answer.answer}</p>
                <p className="text-xs text-muted-foreground">Maximum: {question?.points ?? 0} points</p>
                <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                  <Field id={`grade-${attempt.id}-${answer.question_id}`} label="Points awarded">
                    <Input id={`grade-${attempt.id}-${answer.question_id}`} type="number" min={0} max={question?.points ?? 100} step={1} required value={scores[attempt.id]?.[answer.question_id] || ""} onChange={(event) => setScores((current) => ({ ...current, [attempt.id]: { ...current[attempt.id], [answer.question_id]: event.target.value } }))} />
                  </Field>
                  <Field id={`feedback-${attempt.id}-${answer.question_id}`} label="Feedback">
                    <Textarea id={`feedback-${attempt.id}-${answer.question_id}`} maxLength={1000} value={feedback[attempt.id]?.[answer.question_id] || ""} onChange={(event) => setFeedback((current) => ({ ...current, [attempt.id]: { ...current[attempt.id], [answer.question_id]: event.target.value } }))} />
                  </Field>
                </div>
              </fieldset>
            })}
            <Button type="submit" className="self-start" disabled={busy || writtenAnswers.length === 0}><Check data-icon="inline-start" />{busy ? "Saving…" : "Save grade and release result"}</Button>
          </form>
        </CardContent></Card>
      })}
    </div>
  )
}

function ItemRow({
  icon: Icon, title, detail, published, onEdit, onDelete, onPublish,
}: {
  icon: typeof BookOpen
  title: string
  detail: string
  published: boolean
  onEdit: () => void
  onDelete: () => void
  onPublish: () => void
}) {
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{title}</h3><Badge variant={published ? "default" : "secondary"}>{published ? "Published" : "Hidden"}</Badge></div><p className="mt-1 truncate text-sm text-muted-foreground">{detail}</p></div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onEdit} aria-label={`Edit ${title}`}><Pencil data-icon="inline-start" />Edit</Button>
        <Button type="button" size="sm" variant="outline" onClick={onPublish}>{published ? "Hide" : "Publish"}</Button>
        <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={onDelete} aria-label={`Delete ${title}`}><Trash2 data-icon="inline-start" />Delete</Button>
      </div>
    </article>
  )
}
