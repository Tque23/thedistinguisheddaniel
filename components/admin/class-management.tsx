"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { ArrowLeft, BookOpen, Check, FileText, Pencil, Plus, Trash2 } from "lucide-react"
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
type Enrollment = TableRows["course_enrollments"]["Row"]
type Completion = TableRows["course_session_completions"]["Row"]
type CourseOption = { id: string; title: string }
type MemberOption = { id: string; email?: string }
type Area = "outline" | "reviews"
type CurriculumTool = "sessions" | "paths" | "materials" | "assessments"
type QuestionDraft = {
  prompt: string
  questionType: AssessmentQuestionSubmission["questionType"]
  optionsText: string
  correctAnswer: string
  points: string
}

const areas: { id: Area; label: string }[] = [
  { id: "outline", label: "Course outline" },
  { id: "reviews", label: "Grading queue" },
]
const tabsClass = "flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
const emptyQuestion: QuestionDraft = { prompt: "", questionType: "multiple_choice", optionsText: "Option 1\nOption 2", correctAnswer: "Option 1", points: "1" }

function dateTimeLocalValue(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function localDateTimeToIso(value: string) {
  return value ? new Date(value).toISOString() : null
}

export function ClassManagement({ courses, members, onAssessmentGraded }: { courses: CourseOption[]; members: MemberOption[]; onAssessmentGraded?: () => void }) {
  const [activeArea, setActiveArea] = useState<Area>("outline")
  const [curriculumTool, setCurriculumTool] = useState<CurriculumTool | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "")
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [sessions, setSessions] = useState<CourseSession[]>([])
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null)
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null)
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null)
  const [newSessionPathId, setNewSessionPathId] = useState("")
  const [newMaterialSessionId, setNewMaterialSessionId] = useState("")
  const [newAssessmentSessionId, setNewAssessmentSessionId] = useState("")
  const [newAssessmentPathId, setNewAssessmentPathId] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    try {
      const client = createClient()
      const [pathResult, sessionResult, materialResult, assessmentResult, questionResult, keyResult, attemptResult, answerResult, enrollmentResult, completionResult] = await Promise.all([
        client.from("course_learning_paths").select("*").order("created_at", { ascending: false }),
        client.from("course_sessions").select("*").order("course_id").order("position"),
        client.from("course_materials").select("*").order("course_id").order("position"),
        client.from("course_assessments").select("*").order("created_at", { ascending: false }),
        client.from("course_assessment_questions").select("*").order("position"),
        client.from("course_assessment_answer_keys").select("*"),
        client.from("course_assessment_attempts").select("*").order("submitted_at", { ascending: false }),
        client.from("course_assessment_answers").select("*"),
        client.from("course_enrollments").select("*").order("created_at", { ascending: false }),
        client.from("course_session_completions").select("*"),
      ])
      const failure = pathResult.error || sessionResult.error || materialResult.error || assessmentResult.error
        || questionResult.error || keyResult.error || attemptResult.error || answerResult.error
        || enrollmentResult.error || completionResult.error
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
      setEnrollments(enrollmentResult.data || [])
      setCompletions(completionResult.data || [])
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
  const courseAssessmentIds = new Set(courseAssessments.map((assessment) => assessment.id))
  const pendingAttempts = attempts.filter((attempt) => attempt.status === "pending_review" && courseAssessmentIds.has(attempt.assessment_id))
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
          <CardDescription>Arrange a course from path to lesson, attach resources and assessments, and follow learner progress.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Field id="class-course" label="Course">
            <select id="class-course" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-xl" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </Field>
          {selectedCourse && <p className="text-sm text-muted-foreground">{courseSessions.filter((session) => session.published).length} published lessons · {pendingAttempts.length} responses awaiting review</p>}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/70 p-2" role="group" aria-label="Course workspace views">
        {areas.map((area) => (
          <button key={area.id} type="button" aria-pressed={activeArea === area.id} className={`${tabsClass} ${activeArea === area.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} onClick={() => { setActiveArea(area.id); setCurriculumTool(null); setStatus(null) }}>
            {area.label}{area.id === "reviews" && pendingAttempts.length > 0 ? ` (${pendingAttempts.length})` : ""}
          </button>
        ))}
      </div>

      {loadError && <StatusMessage tone="error">{loadError} <Button size="sm" variant="outline" onClick={() => void loadData()}>Reload class data</Button></StatusMessage>}
      {status && <StatusMessage tone={status.tone}>{status.text}</StatusMessage>}
      {loading ? <p role="status" className="text-sm text-muted-foreground">Loading course workspace…</p> : (
        <>
          {activeArea === "outline" && !curriculumTool && selectedCourse && <>
            <CurriculumOutline
              course={selectedCourse}
              paths={coursePaths}
              sessions={courseSessions}
              materials={courseMaterials}
              assessments={courseAssessments}
              questions={questions}
              onEditPath={(path) => { setEditingPath(path); setCurriculumTool("paths") }}
              onEditSession={(session) => { setEditingSession(session); setCurriculumTool("sessions") }}
              onEditMaterial={(material) => { setEditingMaterial(material); setCurriculumTool("materials") }}
              onEditAssessment={(assessment) => { setEditingAssessment(assessment); setCurriculumTool("assessments") }}
              onAddSession={(pathId) => { setEditingSession(null); setNewSessionPathId(pathId || ""); setCurriculumTool("sessions") }}
              onAddMaterial={(sessionId) => { setEditingMaterial(null); setNewMaterialSessionId(sessionId || ""); setCurriculumTool("materials") }}
              onAddAssessment={(sessionId, pathId) => {
                setEditingAssessment(null)
                setNewAssessmentSessionId(sessionId || "")
                setNewAssessmentPathId(pathId || "")
                setCurriculumTool("assessments")
              }}
            />
            <MemberProgressPanel
              paths={coursePaths}
              sessions={courseSessions.filter((session) => session.published)}
              enrollments={enrollments.filter((enrollment) => enrollment.course_id === selectedCourseId)}
              completions={completions}
              attempts={attempts}
              assessments={courseAssessments}
              members={memberById}
            />
          </>}
          {activeArea === "outline" && curriculumTool === "sessions" && <>
            <Button type="button" variant="outline" className="w-fit" onClick={() => setCurriculumTool(null)}><ArrowLeft data-icon="inline-start" />Back to outline</Button>
            <SessionsPanel
            courseId={selectedCourseId}
            sessions={courseSessions}
            paths={coursePaths}
            newPathId={newSessionPathId}
            editing={editingSession}
            busy={busy}
            onEdit={setEditingSession}
            onSave={(input) => finishAction(() => saveCourseSession(input), "Session saved.")}
            onDelete={async (id) => {
              if (!window.confirm("Delete this session? Its materials and assessment links will be removed; member progress will prevent deletion.")) return
              await finishAction(() => deleteCourseSession(id), "Session removed.")
            }}
            onPublish={(id, published) => finishAction(() => setLearningItemPublished("session", id, published), published ? "Session published." : "Session hidden.")}
          />
          </>}
          {activeArea === "outline" && curriculumTool === "paths" && <>
            <Button type="button" variant="outline" className="w-fit" onClick={() => setCurriculumTool(null)}><ArrowLeft data-icon="inline-start" />Back to outline</Button>
            <PathsPanel
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
          />
          </>}
          {activeArea === "outline" && curriculumTool === "materials" && <>
            <Button type="button" variant="outline" className="w-fit" onClick={() => setCurriculumTool(null)}><ArrowLeft data-icon="inline-start" />Back to outline</Button>
            <MaterialsPanel
            courseId={selectedCourseId}
            sessions={courseSessions}
            materials={courseMaterials}
            newSessionId={newMaterialSessionId}
            editing={editingMaterial}
            busy={busy}
            onEdit={setEditingMaterial}
            onSave={(input) => finishAction(() => saveCourseMaterial(input), "Material saved.")}
            onDelete={async (id) => {
              if (!window.confirm("Delete this material? Members will no longer be able to open it.")) return
              await finishAction(() => deleteCourseMaterial(id), "Material removed.")
            }}
            onPublish={(id, published) => finishAction(() => setLearningItemPublished("material", id, published), published ? "Material published." : "Material hidden.")}
          />
          </>}
          {activeArea === "outline" && curriculumTool === "assessments" && <>
            <Button type="button" variant="outline" className="w-fit" onClick={() => setCurriculumTool(null)}><ArrowLeft data-icon="inline-start" />Back to outline</Button>
            <AssessmentsPanel
            courseId={selectedCourseId}
            sessions={courseSessions}
            paths={coursePaths}
            assessments={courseAssessments}
            newSessionId={newAssessmentSessionId}
            newPathId={newAssessmentPathId}
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
          />
          </>}
          {activeArea === "reviews" && <ReviewPanel
            attempts={pendingAttempts}
            assessments={assessments}
            questions={questions}
            answers={answers}
            members={memberById}
            busy={busy}
            onGrade={async (id, grades) => {
              const saved = await finishAction(() => gradeAssessmentAttempt(id, grades), "Assessment grading saved.")
              if (saved) onAssessmentGraded?.()
              return saved
            }}
          />}
        </>
      )}
    </div>
  )
}

function CurriculumOutline({
  course,
  paths,
  sessions,
  materials,
  assessments,
  questions,
  onEditPath,
  onEditSession,
  onEditMaterial,
  onEditAssessment,
  onAddSession,
  onAddMaterial,
  onAddAssessment,
}: {
  course: CourseOption
  paths: LearningPath[]
  sessions: CourseSession[]
  materials: CourseMaterial[]
  assessments: Assessment[]
  questions: Question[]
  onEditPath: (path: LearningPath | null) => void
  onEditSession: (session: CourseSession | null) => void
  onEditMaterial: (material: CourseMaterial | null) => void
  onEditAssessment: (assessment: Assessment | null) => void
  onAddSession: (pathId?: string) => void
  onAddMaterial: (sessionId?: string) => void
  onAddAssessment: (sessionId?: string, pathId?: string) => void
}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const ordered = [...sessions].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  const pathSessions = (pathId: string) => ordered.filter((session) => session.path_id === pathId)
  const unassigned = ordered.filter((session) => !paths.some((path) => path.id === session.path_id))

  function materialList(sessionId: string | null) {
    const list = materials.filter((material) => material.session_id === sessionId)
    if (!list.length) return <p className="text-xs text-muted-foreground">No resources attached.</p>
    return (
      <ul className="flex flex-col gap-1">
        {list.map((material) => (
          <li key={material.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 truncate text-muted-foreground"><FileText className="size-3.5 shrink-0" aria-hidden />{material.title}{!material.published && " · Draft"}</span>
            <Button type="button" size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={() => onEditMaterial(material)}>Edit</Button>
          </li>
        ))}
      </ul>
    )
  }

  function assessmentList(sessionId: string | null, pathId: string | null = null) {
    const list = assessments.filter((assessment) =>
      assessment.session_id === sessionId && (sessionId !== null || assessment.path_id === pathId),
    )
    if (!list.length) return <p className="text-xs text-muted-foreground">No assessment attached.</p>
    return (
      <ul className="flex flex-col gap-1">
        {list.map((assessment) => (
          <li key={assessment.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate text-muted-foreground">{assessment.title} · {questions.filter((question) => question.assessment_id === assessment.id).length} questions{!assessment.published && " · Draft"}</span>
            <Button type="button" size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={() => onEditAssessment(assessment)}>Edit</Button>
          </li>
        ))}
      </ul>
    )
  }

  function lessonRow(session: CourseSession, index: number) {
    return (
      <li key={session.id} className="rounded-xl border border-border/70 bg-background p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
            <div className="min-w-0">
              <p className="font-medium text-foreground">{session.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {session.required ? "Required" : "Optional"} · {session.published ? "Published" : "Draft"} · Order {session.position}
                {session.starts_at && ` · ${formatDate(session.starts_at, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" className="min-h-9" onClick={() => onEditSession(session)}><Pencil data-icon="inline-start" />Edit lesson</Button>
        </div>
        <div className="mt-4 grid gap-4 border-t border-border/60 pt-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resources</p>
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => onAddMaterial(session.id)}>Add resource</Button>
            </div>
            {materialList(session.id)}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assessments</p>
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => onAddAssessment(session.id)}>Add assessment</Button>
            </div>
            {assessmentList(session.id)}
          </div>
        </div>
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{course.title} curriculum</CardTitle>
          <CardDescription>Build the learner experience in order: learning path → lessons → resources and assessments. Required lessons unlock in sequence.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" className="min-h-11" onClick={() => onEditPath(null)}><Plus data-icon="inline-start" />Add learning path</Button>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => onAddSession()}><Plus data-icon="inline-start" />Add lesson</Button>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => onAddMaterial()}><Plus data-icon="inline-start" />Add course resource</Button>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => onAddAssessment()}><Plus data-icon="inline-start" />Add final assessment</Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {paths.map((path) => {
          const lessons = pathSessions(path.id)
          return (
            <Card key={path.id}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2"><BookOpen className="size-4 text-primary" aria-hidden />{path.title}</CardTitle>
                  <CardDescription className="mt-1">{path.description || "No path description yet."} · {path.published ? "Published" : "Draft"} · {lessons.length} lessons</CardDescription>
                </div>
                <Button type="button" size="sm" variant="outline" className="min-h-9 shrink-0" onClick={() => onEditPath(path)}><Pencil data-icon="inline-start" />Edit path</Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ol className="flex flex-col gap-3">{lessons.map(lessonRow)}</ol>
                <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Path final assessment</p>
                    <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => onAddAssessment(undefined, path.id)}>Add path final assessment</Button>
                  </div>
                  {assessmentList(null, path.id)}
                </div>
                <Button type="button" variant="ghost" className="min-h-10 self-start" onClick={() => onAddSession(path.id)}><Plus data-icon="inline-start" />Add lesson to this path</Button>
              </CardContent>
            </Card>
          )
        })}
        {unassigned.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lessons without a learning path</CardTitle>
              <CardDescription>These lessons remain visible in the course outline but are not part of a path.</CardDescription>
            </CardHeader>
            <CardContent><ol className="flex flex-col gap-3">{unassigned.map(lessonRow)}</ol></CardContent>
          </Card>
        )}
        {paths.length === 0 && unassigned.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Start by adding a learning path, then place ordered lessons and their resources or assessments inside it.</p>
        )}
        {materials.filter((material) => material.session_id === null).length > 0 && (
          <Card>
            <CardHeader><CardTitle>Course-wide resources</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">{materialList(null)}</CardContent>
          </Card>
        )}
        {assessments.some((assessment) => assessment.session_id === null && assessment.path_id === null) && (
          <Card>
            <CardHeader><CardTitle>Final assessments</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">{assessmentList(null, null)}</CardContent>
          </Card>
        )}
      </div>

      <details className="rounded-xl border border-border bg-card">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Member preview
          <span className="text-xs font-normal text-muted-foreground">See how lesson order and gates will be explained</span>
        </summary>
        <div className="border-t border-border p-4">
          {previewOpen ? (
            <div className="flex flex-col gap-3">
              {paths.map((path) => (
                <section key={path.id} className="rounded-xl border border-border/70 p-4">
                  <h4 className="font-semibold">{path.title}</h4>
                  <ol className="mt-3 flex flex-col gap-2">
                    {pathSessions(path.id).map((session, index, list) => {
                      const priorRequired = list.slice(0, index).some((item) => item.required)
                      const state = !session.published ? "Not published" : !session.required ? "Ready · optional" : priorRequired ? "Locked · complete earlier required lessons" : "Ready"
                      return <li key={session.id} className="flex items-start gap-2 text-sm"><span className={session.published ? "text-primary" : "text-muted-foreground"} aria-hidden>{priorRequired && session.required ? "○" : "✓"}</span><span>{session.title}<span className="ms-2 text-xs text-muted-foreground">{state}</span></span></li>
                    })}
                  </ol>
                </section>
              ))}
              {paths.flatMap((path) => assessments
                .filter((assessment) => assessment.session_id === null && assessment.path_id === path.id)
                .map((assessment) => (
                  <p key={assessment.id} className="rounded-lg bg-muted/50 p-3 text-sm">“{assessment.title}” · Opens after all required lessons in {path.title} · Pass mark {assessment.passing_score}%.</p>
                )))}
              {assessments.filter((assessment) => assessment.session_id === null && assessment.path_id === null).map((assessment) => (
                <p key={assessment.id} className="rounded-lg bg-muted/50 p-3 text-sm">Final assessment “{assessment.title}” · Opens after all required lessons · Pass mark {assessment.passing_score}%.</p>
              ))}
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>Load member preview</Button>
          )}
        </div>
      </details>
    </div>
  )
}

function MemberProgressPanel({
  paths,
  sessions,
  enrollments,
  completions,
  attempts,
  assessments,
  members,
}: {
  paths: LearningPath[]
  sessions: CourseSession[]
  enrollments: Enrollment[]
  completions: Completion[]
  attempts: Attempt[]
  assessments: Assessment[]
  members: Map<string, MemberOption>
}) {
  const active = enrollments.filter((enrollment) => enrollment.status === "enrolled")
  const requiredSessions = sessions.filter((session) => session.required)
  const assessmentIds = new Set(assessments.map((assessment) => assessment.id))
  const pendingByMember = new Map<string, number>()
  attempts.forEach((attempt) => {
    if (attempt.status === "pending_review" && assessmentIds.has(attempt.assessment_id)) {
      pendingByMember.set(attempt.user_id, (pendingByMember.get(attempt.user_id) ?? 0) + 1)
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learner progress</CardTitle>
        <CardDescription>Progress is based on member-reported completions. Written work awaiting review is flagged for follow-up.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No members are enrolled in this course yet.</p>
        ) : active.map((enrollment) => {
          const completeIds = new Set(completions.filter((completion) => completion.user_id === enrollment.user_id).map((completion) => completion.session_id))
          const completeCount = requiredSessions.filter((session) => completeIds.has(session.id)).length
          const name = members.get(enrollment.user_id)?.email || "Member"
          const awaiting = pendingByMember.get(enrollment.user_id) ?? 0
          return (
            <article key={enrollment.id} className="rounded-xl border border-border/70 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="break-all text-sm font-medium text-foreground">{name}</p>
                <p className="text-sm tabular-nums text-muted-foreground">{completeCount} of {requiredSessions.length} required lessons</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${name} required lesson progress`} aria-valuenow={requiredSessions.length ? Math.round((completeCount / requiredSessions.length) * 100) : 0} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${requiredSessions.length ? Math.round((completeCount / requiredSessions.length) * 100) : 0}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {paths.map((path) => {
                  const pathRequired = requiredSessions.filter((session) => session.path_id === path.id)
                  const pathComplete = pathRequired.filter((session) => completeIds.has(session.id)).length
                  return <span key={path.id}>{path.title}: {pathComplete}/{pathRequired.length}</span>
                })}
                {awaiting > 0 && <span className="font-medium text-amber-800">{awaiting} written {awaiting === 1 ? "response" : "responses"} awaiting review</span>}
              </div>
            </article>
          )
        })}
      </CardContent>
    </Card>
  )
}

function SessionsPanel({
  courseId, sessions, paths, newPathId, editing, busy, onEdit, onSave, onDelete, onPublish,
}: {
  courseId: string
  sessions: CourseSession[]
  paths: LearningPath[]
  newPathId: string
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
  const [required, setRequired] = useState(true)
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [deliveryMode, setDeliveryMode] = useState<"in-person" | "online">("in-person")
  const [location, setLocation] = useState("")
  const [published, setPublished] = useState(false)
  useEffect(() => {
    setTitle(editing?.title || "")
    setDescription(editing?.description || "")
    setVideoUrl(editing?.video_url || "")
    setDuration(String(editing?.duration_minutes ?? 0))
    setPosition(String(editing?.position ?? sessions.length))
    setPathId(editing?.path_id || newPathId)
    setRequired(editing?.required !== false)
    setStartsAt(dateTimeLocalValue(editing?.starts_at))
    setEndsAt(dateTimeLocalValue(editing?.ends_at))
    setDeliveryMode(editing?.delivery_mode === "online" ? "online" : "in-person")
    setLocation(editing?.location || "")
    setPublished(editing?.published || false)
  }, [editing, sessions.length, newPathId])

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
      required,
      startsAt: localDateTimeToIso(startsAt),
      endsAt: localDateTimeToIso(endsAt),
      deliveryMode,
      location,
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
            <label className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
              Required for course progress and final assessments
            </label>
            <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-3">
              <legend className="px-1 text-sm font-medium">Schedule (optional)</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="session-start" label="Starts at">
                  <Input id="session-start" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
                </Field>
                <Field id="session-end" label="Ends at">
                  <Input id="session-end" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
                </Field>
              </div>
              <Field id="session-mode" label="Format">
                <select id="session-mode" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={deliveryMode} onChange={(event) => setDeliveryMode(event.target.value as "in-person" | "online")}>
                  <option value="in-person">In person</option><option value="online">Online</option>
                </select>
              </Field>
              <Field id="session-location" label="Location or joining details">
                <Input id="session-location" maxLength={240} value={location} onChange={(event) => setLocation(event.target.value)} />
              </Field>
              <p className="text-xs leading-relaxed text-muted-foreground">Add both dates and times, or leave both empty. The calendar uses this schedule.</p>
            </fieldset>
            <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />Publish session to enrolled members</label>
            <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save session" : "Add session"}</Button>{editing && <Button type="button" variant="outline" onClick={() => onEdit(null)}>Cancel</Button>}</div>
          </form>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Sessions</CardTitle><CardDescription>Members see published sessions in this order.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">
        {sessions.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No sessions yet. Add the first lesson using the form.</p>}
        {sessions.map((session) => <ItemRow key={session.id} icon={BookOpen} title={session.title} detail={`${session.duration_minutes} min · Order ${session.position} · ${session.required ? "Required" : "Optional"}${session.starts_at ? ` · Scheduled ${formatDate(session.starts_at, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}`} published={session.published} onEdit={() => onEdit(session)} onDelete={() => onDelete(session.id)} onPublish={() => onPublish(session.id, !session.published)} />)}
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
  courseId, sessions, materials, newSessionId, editing, busy, onEdit, onSave, onDelete, onPublish,
}: {
  courseId: string
  sessions: CourseSession[]
  materials: CourseMaterial[]
  newSessionId: string
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
    setSessionId(editing?.session_id || newSessionId)
    setPosition(String(editing?.position ?? materials.length))
    setPublished(editing?.published || false)
  }, [editing, materials.length, newSessionId])

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
  courseId, sessions, paths, assessments, newSessionId, newPathId, questions, answerKeys, attempts, editing, busy, onEdit, onSave, onDelete, onPublish,
}: {
  courseId: string
  sessions: CourseSession[]
  paths: LearningPath[]
  assessments: Assessment[]
  newSessionId: string
  newPathId: string
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
  const [pathId, setPathId] = useState("")
  const [maxAttempts, setMaxAttempts] = useState("3")
  const [opensAt, setOpensAt] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [passingScore, setPassingScore] = useState("70")
  const [published, setPublished] = useState(false)
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([{ ...emptyQuestion }])
  const editingHasAttempts = Boolean(editing && attempts.some((attempt) => attempt.assessment_id === editing.id))
  useEffect(() => {
    setTitle(editing?.title || "")
    setInstructions(editing?.instructions || "")
    setSessionId(editing?.session_id || newSessionId)
    setPathId(editing?.path_id || newPathId)
    setMaxAttempts(String(editing?.max_attempts ?? 3))
    setOpensAt(dateTimeLocalValue(editing?.opens_at))
    setClosesAt(dateTimeLocalValue(editing?.closes_at))
    setPassingScore(String(editing?.passing_score ?? 70))
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
  }, [editing, questions, answerKeys, newSessionId, newPathId])

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
      pathId: sessionId ? null : pathId || null,
      title,
      instructions,
      maxAttempts: Number(maxAttempts),
      opensAt: localDateTimeToIso(opensAt),
      closesAt: localDateTimeToIso(closesAt),
      passingScore: Number(passingScore),
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
          <Field id="assessment-session" label="Attach to a lesson (optional)"><select id="assessment-session" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={sessionId} onChange={(event) => { setSessionId(event.target.value); setPathId("") }}><option value="">No specific lesson</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}</select></Field>
          <Field id="assessment-path" label="Final assessment path (optional)"><select id="assessment-path" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60" value={pathId} disabled={Boolean(sessionId)} onChange={(event) => setPathId(event.target.value)}><option value="">Entire course</option>{paths.map((path) => <option key={path.id} value={path.id}>{path.title}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">A path final assessment unlocks after all required lessons in that path.</p></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="assessment-attempts" label="Maximum attempts"><Input id="assessment-attempts" type="number" min={1} max={50} step={1} required value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} /></Field>
            <Field id="assessment-pass-mark" label="Passing score (%)"><Input id="assessment-pass-mark" type="number" min={0} max={100} step={1} required value={passingScore} onChange={(event) => setPassingScore(event.target.value)} /></Field>
          </div>
          <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-3">
            <legend className="px-1 text-sm font-medium">Availability window (optional)</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="assessment-opens" label="Opens at"><Input id="assessment-opens" type="datetime-local" value={opensAt} onChange={(event) => setOpensAt(event.target.value)} /></Field>
              <Field id="assessment-closes" label="Closes at"><Input id="assessment-closes" type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} /></Field>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">Leave both dates empty for no deadline. Add both dates to set a window.</p>
          </fieldset>
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
      <Card><CardHeader><CardTitle>Assessments</CardTitle><CardDescription>Set required lesson gates, an optional open/close window, an attempt limit, and a passing score.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">
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
