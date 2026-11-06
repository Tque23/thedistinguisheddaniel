"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  CalendarClock,
  Check,
  Circle,
  Clock3,
  Download,
  FileText,
  LockKeyhole,
  Play,
  Send,
  Video,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/dashboard/dashboard-ui"
import { CourseCover, DdniButton } from "@/components/dashboard/ddni-ui"
import type {
  AssessmentSubmissionResult,
  Course,
  CourseAssessment,
  CourseAssessmentAnswer,
  CourseAssessmentAttempt,
  CourseAssessmentQuestion,
  CourseLearningPath,
  CourseMaterial,
  CourseSession,
  CourseSessionCompletion,
} from "@/lib/dashboard-data"

type Props = {
  course: Course
  paths: CourseLearningPath[]
  sessions: CourseSession[]
  materials: CourseMaterial[]
  assessments: CourseAssessment[]
  questions: CourseAssessmentQuestion[]
  attempts: CourseAssessmentAttempt[]
  answers: CourseAssessmentAnswer[]
  completions: CourseSessionCompletion[]
  learningError?: string
  onBack: () => void
  onSetSessionCompletion: (sessionId: string, complete: boolean) => Promise<string | null>
  onSubmitAssessment: (
    assessmentId: string,
    answers: { questionId: string; answer: string }[],
  ) => Promise<{ result: AssessmentSubmissionResult } | { error: string }>
}

const UNASSIGNED_PATH = "__unassigned__"

function orderedSessions(sessions: CourseSession[]) {
  return [...sessions].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
}

function lessonLockReason(session: CourseSession, pathSessions: CourseSession[], completed: Set<string>) {
  if (!session.required) return null
  const prior = orderedSessions(pathSessions).filter((item) =>
    item.required
    && (item.position < session.position || (item.position === session.position && item.id.localeCompare(session.id) < 0)),
  )
  const missing = prior.find((item) => !completed.has(item.id))
  return missing ? `Complete “${missing.title}” first.` : null
}

function nextLesson(sessions: CourseSession[], completed: Set<string>) {
  const ordered = orderedSessions(sessions)
  return ordered.find((session) =>
    !completed.has(session.id)
    && lessonLockReason(session, ordered.filter((item) => item.pathId === session.pathId), completed) === null,
  ) ?? ordered.find((session) => !completed.has(session.id)) ?? ordered.at(-1)
}

function assessmentLockReason(
  assessment: CourseAssessment,
  sessions: CourseSession[],
  completed: Set<string>,
  now: number,
) {
  if (assessment.opensAt && new Date(assessment.opensAt).getTime() > now) {
    return `Opens ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(assessment.opensAt))}.`
  }
  if (assessment.closesAt && new Date(assessment.closesAt).getTime() <= now) {
    return "This assessment is closed."
  }

  const required = orderedSessions(sessions).filter((session) => session.required)
  const target = assessment.sessionId
    ? sessions.find((session) => session.id === assessment.sessionId)
    : undefined
  const prerequisites = assessment.sessionId
    ? target
      ? required.filter((session) =>
        session.pathId === target.pathId
        && (session.position < target.position || (session.position === target.position && session.id.localeCompare(target.id) < 0)),
      )
      : []
    : required.filter((session) => assessment.pathId === null || session.pathId === assessment.pathId)
  const missing = prerequisites.filter((session) => !completed.has(session.id))
  if (missing.length === 0) return null
  const firstMissing = missing[0]
  if (missing.length === 1) {
    return `Complete “${firstMissing.title}” first.`
  }
  const remainingLabel = assessment.sessionId
    ? " and other earlier required lessons"
    : assessment.pathId
      ? " and all other required lessons in this path"
      : " and all other required lessons"
  return `Complete “${firstMissing.title}”${remainingLabel} first.`
}

function progressFor(sessions: CourseSession[], completed: Set<string>) {
  const complete = sessions.filter((session) => completed.has(session.id)).length
  return { complete, total: sessions.length, percent: sessions.length ? Math.round((complete / sessions.length) * 100) : 0 }
}

export function CourseLearningWorkspace({
  course,
  paths,
  sessions,
  materials,
  assessments,
  questions,
  attempts,
  answers,
  completions,
  learningError,
  onBack,
  onSetSessionCompletion,
  onSubmitAssessment,
}: Props) {
  const courseSessions = useMemo(
    () => orderedSessions(sessions.filter((session) => session.courseId === course.id)),
    [sessions, course.id],
  )
  const coursePaths = paths.filter((path) => path.courseId === course.id)
  const unassignedSessions = courseSessions.filter((session) =>
    session.pathId === null || !coursePaths.some((path) => path.id === session.pathId),
  )
  const courseMaterials = materials.filter((material) => material.courseId === course.id)
  const courseAssessments = assessments.filter((assessment) => assessment.courseId === course.id)
  const completedSessionIds = useMemo(
    () => new Set(completions.map((completion) => completion.sessionId)),
    [completions],
  )
  const initialLesson = nextLesson(courseSessions, completedSessionIds)
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialLesson?.id ?? null)
  const [busySessionId, setBusySessionId] = useState<string | null>(null)
  const [sessionMessage, setSessionMessage] = useState("")
  const now = Date.now()
  const currentLesson = courseSessions.find((session) => session.id === selectedSessionId)
  const selectedPath = coursePaths.find((path) => path.id === selectedPathId)
  const selectedPathSessions = selectedPathId === UNASSIGNED_PATH
    ? unassignedSessions
    : courseSessions.filter((session) => session.pathId === selectedPathId)
  const courseProgress = progressFor(courseSessions, completedSessionIds)
  const courseMaterialsOnly = courseMaterials.filter((material) => material.sessionId === null)
  const nextLessonToResume = nextLesson(courseSessions, completedSessionIds)
  const courseStatus = courseProgress.total === 0
    ? "Upcoming"
    : courseProgress.complete === courseProgress.total
      ? "Completed"
      : courseProgress.complete > 0
        ? "In progress"
        : "Not started"
  const finalAssessments = courseAssessments.filter((assessment) => assessment.sessionId === null && assessment.pathId === null)
  const selectedPathAssessments = selectedPath
    ? courseAssessments.filter((assessment) => assessment.sessionId === null && assessment.pathId === selectedPath.id)
    : []

  function choosePath(pathId: string | null) {
    const pathSessions = pathId === UNASSIGNED_PATH
      ? unassignedSessions
      : courseSessions.filter((session) => session.pathId === pathId)
    const next = nextLesson(pathSessions, completedSessionIds)
    setSelectedPathId(pathId)
    setSelectedSessionId(next?.id ?? null)
    setSessionMessage("")
  }

  function continueLearning() {
    const next = nextLesson(courseSessions, completedSessionIds)
    if (!next) return
    choosePath(next.pathId && coursePaths.some((path) => path.id === next.pathId) ? next.pathId : UNASSIGNED_PATH)
    setSelectedSessionId(next.id)
  }

  async function toggleCompletion(sessionId: string) {
    const complete = !completedSessionIds.has(sessionId)
    setBusySessionId(sessionId)
    setSessionMessage("")
    try {
      const error = await onSetSessionCompletion(sessionId, complete)
      if (error) {
        setSessionMessage(error)
        return
      }
      setSessionMessage(complete
        ? "Lesson marked complete. Your course progress has been updated."
        : "Lesson marked incomplete. Your course progress has been updated.")
      if (complete) {
        const afterCompletion = new Set(completedSessionIds).add(sessionId)
        const pathSessions = courseSessions.filter((session) => session.pathId === currentLesson?.pathId)
        const next = nextLesson(pathSessions, afterCompletion)
        if (next && next.id !== sessionId) setSelectedSessionId(next.id)
      }
    } catch (error) {
      console.error("[dashboard] lesson completion interaction failed", error)
      setSessionMessage("Unable to update your course progress. Please try again.")
    } finally {
      setBusySessionId(null)
    }
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="course-workspace-title">
      <Button type="button" variant="ghost" className="min-h-11 w-fit -ms-3" onClick={onBack}>
        <ArrowLeft data-icon="inline-start" />My courses
      </Button>

      <header className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:p-7">
        <div className="w-28 shrink-0 sm:w-36">
          <CourseCover title={course.title} code="" image={course.thumbnailUrl} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Course workspace</p>
          <h2 id="course-workspace-title" className="mt-2 text-balance font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{course.title}</h2>
          {course.instructor && <p className="mt-1 text-sm text-muted-foreground">With {course.instructor}</p>}
          {course.description && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{course.description}</p>}
        </div>
      </header>

      <div className="grid gap-5 rounded-2xl border border-border/70 bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Your learning progress</h3>
              <Badge variant={courseStatus === "Completed" ? "default" : courseStatus === "In progress" ? "secondary" : "outline"}>
                {courseStatus}
              </Badge>
            </div>
            <p className="tabular-nums text-sm font-semibold text-foreground" aria-live="polite">
              {courseProgress.complete} of {courseProgress.total} lessons complete
            </p>
          </div>
          <div
            role="progressbar"
            aria-label={`${course.title} lesson progress`}
            aria-valuenow={courseProgress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${courseProgress.percent}%` }} />
          </div>
          {courseProgress.total > 0 && courseProgress.complete < courseProgress.total && nextLessonToResume && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Next lesson:</span> {nextLessonToResume.title}
            </p>
          )}
          {courseProgress.total > 0 && courseProgress.complete === courseProgress.total && (
            <p className="mt-2 text-xs font-medium text-primary">All lessons completed. You can review materials or complete any final assessments below.</p>
          )}
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Progress is member-reported. Lesson viewing is not tracked.</p>
        </div>
        {courseSessions.length > 0 && (
          <DdniButton size="lg" className="w-full sm:w-auto" onClick={continueLearning}>
            {courseProgress.complete === courseProgress.total ? "Review lessons" : "Continue learning"}
            <ArrowRight />
          </DdniButton>
        )}
      </div>

      {learningError && <StatusMessage tone="error">{learningError} Reload the page to try again.</StatusMessage>}
      {sessionMessage && (
        <StatusMessage tone={sessionMessage.startsWith("Unable") || sessionMessage.startsWith("Please") ? "error" : "success"}>
          {sessionMessage}
        </StatusMessage>
      )}

      {selectedPathId !== null ? (
        <div className="flex flex-col gap-5">
          <Button type="button" variant="outline" className="min-h-11 w-fit" onClick={() => choosePath(null)}>
            <ArrowLeft data-icon="inline-start" />All learning paths
          </Button>
          <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{selectedPath ? "Learning path" : "Course lessons"}</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">{selectedPath?.title ?? "Course lessons"}</h3>
                {selectedPath?.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{selectedPath.description}</p>}
              </div>
              <PathProgress sessions={selectedPathSessions} completed={completedSessionIds} />
            </div>
          </div>
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(15rem,0.82fr)_minmax(0,1.18fr)]">
            <LessonList
              sessions={selectedPathSessions}
              completed={completedSessionIds}
              selectedSessionId={selectedSessionId}
              onSelect={setSelectedSessionId}
            />
            <LessonDetail
              session={currentLesson && currentLesson.pathId === (selectedPathId === UNASSIGNED_PATH ? null : selectedPathId) ? currentLesson : null}
              sessions={courseSessions}
              materials={courseMaterials}
              assessments={courseAssessments}
              questions={questions}
              attempts={attempts}
              answers={answers}
              completed={completedSessionIds}
              now={now}
              busySessionId={busySessionId}
              onToggleCompletion={toggleCompletion}
              onSubmitAssessment={onSubmitAssessment}
            />
          </div>
          {selectedPathAssessments.length > 0 && (
            <section aria-label={`${selectedPath?.title ?? "Learning path"} final assessments`} className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Path checkpoint</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-foreground">{selectedPath?.title ?? "Learning path"} final assessments</h3>
              </div>
              {selectedPathAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  sessions={courseSessions}
                  completed={completedSessionIds}
                  questions={questions.filter((question) => question.assessmentId === assessment.id)}
                  attempts={attempts.filter((attempt) => attempt.assessmentId === assessment.id)}
                  answers={answers}
                  now={now}
                  onSubmit={onSubmitAssessment}
                />
              ))}
            </section>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-labelledby="learning-paths-title" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Course outline</p>
                <h3 id="learning-paths-title" className="mt-1 font-display text-xl font-semibold text-foreground">Choose a learning path</h3>
              </div>
              {courseProgress.total > 0 && <span className="text-sm text-muted-foreground">{courseProgress.percent}% complete</span>}
            </div>
            {coursePaths.length === 0 && courseSessions.length > 0 && unassignedSessions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Learning paths are being prepared for this course.
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {coursePaths.map((path) => {
                const pathSessions = courseSessions.filter((session) => session.pathId === path.id)
                const progress = progressFor(pathSessions, completedSessionIds)
                return (
                  <article key={path.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-foreground">{path.title}</h4>
                        {path.description && <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{path.description}</p>}
                      </div>
                      <BookOpen className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                        <span>{progress.complete} of {progress.total} lessons</span>
                        <span className="tabular-nums">{progress.percent}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
                      </div>
                    </div>
                    <Button type="button" variant="outline" className="min-h-11 w-full justify-between" onClick={() => choosePath(path.id)}>
                      {progress.complete > 0 ? progress.complete === progress.total ? "Review path" : "Continue path" : "Start path"}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  </article>
                )
              })}
              {unassignedSessions.length > 0 && (
                <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-foreground">Course lessons</h4>
                      <p className="mt-1 text-sm text-muted-foreground">Lessons not assigned to a published learning path.</p>
                    </div>
                    <BookOpen className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  </div>
                  <PathProgress sessions={unassignedSessions} completed={completedSessionIds} />
                  <Button type="button" variant="outline" className="min-h-11 w-full justify-between" onClick={() => choosePath(UNASSIGNED_PATH)}>
                    {unassignedSessions.every((session) => completedSessionIds.has(session.id)) ? "Review lessons" : "Start lessons"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </article>
              )}
            </div>
          </section>

          {courseMaterialsOnly.length > 0 && (
            <MaterialList title="Course materials" materials={courseMaterialsOnly} />
          )}
          {finalAssessments.length > 0 && (
            <section aria-labelledby="final-assessments-title" className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Course checkpoint</p>
                <h3 id="final-assessments-title" className="mt-1 font-display text-xl font-semibold text-foreground">Final assessments</h3>
              </div>
              {finalAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  sessions={courseSessions}
                  completed={completedSessionIds}
                  questions={questions.filter((question) => question.assessmentId === assessment.id)}
                  attempts={attempts.filter((attempt) => attempt.assessmentId === assessment.id)}
                  answers={answers}
                  now={now}
                  onSubmit={onSubmitAssessment}
                />
              ))}
            </section>
          )}
        </div>
      )}

      {!selectedPath && courseSessions.length === 0 && !learningError && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Lessons for this course are not available yet. The Institute team will add them here.
        </p>
      )}
    </section>
  )
}

function PathProgress({ sessions, completed }: { sessions: CourseSession[]; completed: Set<string> }) {
  const progress = progressFor(sessions, completed)
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="tabular-nums font-medium text-foreground">{progress.complete} of {progress.total}</span>
      <span>lessons complete</span>
    </div>
  )
}

function LessonList({
  sessions,
  completed,
  selectedSessionId,
  onSelect,
}: {
  sessions: CourseSession[]
  completed: Set<string>
  selectedSessionId: string | null
  onSelect: (id: string) => void
}) {
  const ordered = orderedSessions(sessions)
  return (
    <nav aria-label="Lessons in this path" className="h-fit overflow-hidden rounded-2xl border border-border/70 bg-card">
      <h4 className="border-b border-border/70 px-4 py-3 text-sm font-semibold">Lessons</h4>
      <ol className="divide-y divide-border/60">
        {ordered.map((session, index) => {
          const isComplete = completed.has(session.id)
          const lockReason = lessonLockReason(session, ordered, completed)
          const locked = Boolean(lockReason)
          const state = isComplete ? "Complete" : locked ? "Locked" : selectedSessionId === session.id ? "In progress" : "Ready"
          const Icon = isComplete ? Check : locked ? LockKeyhole : selectedSessionId === session.id ? Play : Circle
          return (
            <li key={session.id}>
              <button
                type="button"
                disabled={locked}
                aria-current={selectedSessionId === session.id ? "step" : undefined}
                aria-label={`Lesson ${index + 1}: ${session.title}, ${state}${lockReason ? `. ${lockReason}` : ""}`}
                title={lockReason || undefined}
                onClick={() => onSelect(session.id)}
                className={`flex min-h-14 w-full items-start gap-3 px-4 py-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-65 ${selectedSessionId === session.id ? "bg-primary/8" : "hover:bg-muted/60"}`}
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${isComplete ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{session.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{state}{!session.required && !isComplete ? " · Optional" : ""}</span>
                </span>
                {session.durationMinutes > 0 && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{session.durationMinutes} min</span>}
              </button>
            </li>
          )
        })}
      </ol>
      {ordered.length === 0 && <p className="p-4 text-sm text-muted-foreground">Lessons will be added to this path soon.</p>}
    </nav>
  )
}

function LessonDetail({
  session,
  sessions,
  materials,
  assessments,
  questions,
  attempts,
  answers,
  completed,
  now,
  busySessionId,
  onToggleCompletion,
  onSubmitAssessment,
}: {
  session: CourseSession | null
  sessions: CourseSession[]
  materials: CourseMaterial[]
  assessments: CourseAssessment[]
  questions: CourseAssessmentQuestion[]
  attempts: CourseAssessmentAttempt[]
  answers: CourseAssessmentAnswer[]
  completed: Set<string>
  now: number
  busySessionId: string | null
  onToggleCompletion: (id: string) => void
  onSubmitAssessment: Props["onSubmitAssessment"]
}) {
  if (!session) {
    return <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Choose a lesson to see its content.</div>
  }

  const lessonMaterials = materials.filter((material) => material.sessionId === session.id)
  const lessonAssessments = assessments.filter((assessment) => assessment.sessionId === session.id)
  const isComplete = completed.has(session.id)

  return (
    <article className="flex min-w-0 flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={isComplete ? "default" : "outline"}>{isComplete ? "Complete" : session.required ? "Required lesson" : "Optional lesson"}</Badge>
          {session.durationMinutes > 0 && <Badge variant="secondary"><Clock3 className="me-1 size-3.5" aria-hidden="true" />{session.durationMinutes} min</Badge>}
        </div>
        <h3 className="mt-3 text-balance font-display text-xl font-semibold text-foreground">{session.title}</h3>
        {session.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{session.description}</p>}
      </div>

      {session.videoUrl && (
        <a href={session.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <Video className="size-4 text-primary" aria-hidden="true" />Open lesson video
        </a>
      )}
      {lessonMaterials.length > 0 && <MaterialList title="Lesson materials" materials={lessonMaterials} />}

      <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
        <p className="text-xs text-muted-foreground">Mark this lesson complete when you have finished it. Completion is self-reported.</p>
        <Button
          type="button"
          variant={isComplete ? "outline" : "default"}
          className="min-h-11 w-fit"
          disabled={busySessionId === session.id}
          onClick={() => onToggleCompletion(session.id)}
        >
          {busySessionId === session.id ? "Saving…" : isComplete ? "Mark incomplete" : "Mark lesson complete"}
        </Button>
      </div>

      {lessonAssessments.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-border/60 pt-4" aria-label="Lesson assessments">
          {lessonAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              sessions={sessions}
              completed={completed}
              questions={questions.filter((question) => question.assessmentId === assessment.id)}
              attempts={attempts.filter((attempt) => attempt.assessmentId === assessment.id)}
              answers={answers}
              now={now}
              onSubmit={onSubmitAssessment}
            />
          ))}
        </section>
      )}
    </article>
  )
}

function MaterialList({ title, materials }: { title: string; materials: CourseMaterial[] }) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="flex flex-col gap-2">
        {materials.map((material) => (
          <li key={material.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-border/70 p-3">
            <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{material.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{material.resourceType}</p>
              {material.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{material.description}</p>}
            </div>
            <a href={material.url} target="_blank" rel="noopener noreferrer" download className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <Download className="size-4" aria-hidden="true" />Open
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AssessmentCard({
  assessment,
  sessions,
  completed,
  questions,
  attempts,
  answers,
  now,
  onSubmit,
}: {
  assessment: CourseAssessment
  sessions: CourseSession[]
  completed: Set<string>
  questions: CourseAssessmentQuestion[]
  attempts: CourseAssessmentAttempt[]
  answers: CourseAssessmentAnswer[]
  now: number
  onSubmit: Props["onSubmitAssessment"]
}) {
  const [inProgress, setInProgress] = useState(false)
  const lockReason = assessmentLockReason(assessment, sessions, completed, now)
  const remaining = Math.max(assessment.maxAttempts - attempts.length, 0)
  const latestAttempt = [...attempts].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
  const passed = latestAttempt?.status === "graded"
    && latestAttempt.maxScore > 0
    && (latestAttempt.score / latestAttempt.maxScore) * 100 >= assessment.passingScore

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground">{assessment.title}</h4>
            <AssessmentState latestAttempt={latestAttempt} passed={passed} inProgress={inProgress} remaining={remaining} />
          </div>
          {assessment.instructions && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{assessment.instructions}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            {attempts.length} of {assessment.maxAttempts} attempts used · Pass mark {assessment.passingScore}%
          </p>
        </div>
        {lockReason && <LockKeyhole className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
      </div>

      {latestAttempt && (
        <div className="rounded-xl bg-muted/50 p-3 text-sm">
          <p className="font-medium text-foreground">
            {latestAttempt.status === "pending_review"
              ? "Awaiting review"
              : passed
                ? `Passed · ${latestAttempt.score} of ${latestAttempt.maxScore}`
                : `Try again · ${latestAttempt.score} of ${latestAttempt.maxScore}`}
          </p>
          {answers.filter((answer) => answer.attemptId === latestAttempt.id && answer.feedback).map((answer) => (
            <p key={answer.id} className="mt-2 text-muted-foreground">{answer.feedback}</p>
          ))}
        </div>
      )}

      {lockReason ? (
        <p className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed text-muted-foreground">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{lockReason}
        </p>
      ) : passed ? (
        <p className="flex items-center gap-2 text-sm font-medium text-primary"><BookOpenCheck className="size-4" aria-hidden="true" />Assessment passed.</p>
      ) : latestAttempt?.status === "pending_review" ? (
        <p className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed text-muted-foreground">
          <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden="true" />Your submission is awaiting instructor review. You will see your score and feedback here once it is graded.
        </p>
      ) : remaining === 0 ? (
        <p className="text-sm text-muted-foreground">No attempts remain. Contact the Institute team if you need help.</p>
      ) : questions.length === 0 ? (
        <StatusMessage tone="error">Assessment questions could not be loaded. Reload the page before continuing.</StatusMessage>
      ) : (
        <AssessmentForm
          assessment={assessment}
          questions={questions}
          remaining={remaining}
          onDraftChange={setInProgress}
          onSubmit={onSubmit}
        />
      )}
    </article>
  )
}

function AssessmentState({
  latestAttempt,
  passed,
  inProgress,
  remaining,
}: {
  latestAttempt?: CourseAssessmentAttempt
  passed: boolean
  inProgress: boolean
  remaining: number
}) {
  const state = passed ? "Passed" : latestAttempt?.status === "pending_review"
    ? "Awaiting review"
    : latestAttempt ? remaining > 0 ? "Try again" : "Attempts exhausted" : inProgress ? "In progress" : "Not started"
  const variant = passed ? "default" : latestAttempt?.status === "pending_review" ? "secondary" : "outline"
  return (
    <Badge variant={variant}>
      {state === "Awaiting review" && <CalendarClock className="me-1 size-3.5" aria-hidden="true" />}
      {state}
    </Badge>
  )
}

function AssessmentForm({
  assessment,
  questions,
  remaining,
  onDraftChange,
  onSubmit,
}: {
  assessment: CourseAssessment
  questions: CourseAssessmentQuestion[]
  remaining: number
  onDraftChange: (inProgress: boolean) => void
  onSubmit: Props["onSubmitAssessment"]
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const hasDraft = Object.values(values).some(Boolean)

  useEffect(() => onDraftChange(hasDraft), [hasDraft, onDraftChange])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (questions.some((question) => !values[question.id]?.trim())) {
      setStatus({ tone: "error", text: "Answer every question before submitting." })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const result = await onSubmit(assessment.id, questions.map((question) => ({
        questionId: question.id,
        answer: values[question.id].trim(),
      })))
      if ("error" in result) {
        setStatus({ tone: "error", text: result.error })
        return
      }
      setValues({})
      const { score, maxScore, needsReview, attemptsUsed, attemptsAllowed } = result.result
      setStatus({
        tone: "success",
        text: needsReview
          ? `Submitted for review. Automatic score: ${score} of ${maxScore}. Attempt ${attemptsUsed} of ${attemptsAllowed}.`
          : `Submitted. Score: ${score} of ${maxScore}. Attempt ${attemptsUsed} of ${attemptsAllowed}.`,
      })
    } catch (error) {
      console.error("[dashboard] assessment submission interaction failed", error)
      setStatus({ tone: "error", text: "Unable to submit your assessment. Please try again." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {status && <StatusMessage tone={status.tone}>{status.text}</StatusMessage>}
      <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
        {questions.map((question, index) => (
          <fieldset key={question.id} className="min-w-0 rounded-xl border border-border p-3 sm:p-4">
            <legend className="max-w-full px-1 text-sm font-medium text-foreground">
              {index + 1}. {question.prompt} <span className="text-xs text-muted-foreground">({question.points} {question.points === 1 ? "point" : "points"})</span>
            </legend>
            {question.questionType === "written" ? (
              <label className="mt-2 block">
                <span className="sr-only">Response to question {index + 1}</span>
                <textarea
                  name={`answer-${question.id}`}
                  className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-base sm:text-sm"
                  value={values[question.id] || ""}
                  maxLength={5000}
                  onChange={(event) => setValues((current) => ({ ...current, [question.id]: event.target.value }))}
                />
              </label>
            ) : (
              <div className="mt-2 flex flex-col gap-1">
                {question.options.map((option, optionIndex) => {
                  const id = `${assessment.id}-${question.id}-${optionIndex}`
                  return (
                    <label key={id} htmlFor={id} className="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted/60">
                      <input
                        id={id}
                        type="radio"
                        name={`answer-${question.id}`}
                        value={option}
                        checked={values[question.id] === option}
                        onChange={() => setValues((current) => ({ ...current, [question.id]: option }))}
                      />
                      {option}
                    </label>
                  )
                })}
              </div>
            )}
          </fieldset>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          {hasDraft && <span className="text-xs text-muted-foreground">In progress · answers are not saved until submitted.</span>}
          <Button type="submit" className="min-h-11" disabled={busy}>
            <Send data-icon="inline-start" />{busy ? "Submitting…" : `Submit assessment (${remaining} ${remaining === 1 ? "attempt" : "attempts"} left)`}
          </Button>
        </div>
      </form>
    </>
  )
}
