"use client"

import { useMemo, useState, type FormEvent } from "react"
import { BookOpenCheck, Check, Circle, Download, FileText, RotateCcw, Send, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/dashboard/dashboard-ui"
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
  onSetSessionCompletion: (sessionId: string, complete: boolean) => Promise<string | null>
  onSubmitAssessment: (
    assessmentId: string,
    answers: { questionId: string; answer: string }[],
  ) => Promise<{ result: AssessmentSubmissionResult } | { error: string }>
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
  onSetSessionCompletion,
  onSubmitAssessment,
}: Props) {
  const [busySessionId, setBusySessionId] = useState<string | null>(null)
  const [sessionMessage, setSessionMessage] = useState("")
  const completedSessionIds = useMemo(() => new Set(completions.map((completion) => completion.sessionId)), [completions])
  const courseSessions = sessions.filter((session) => session.courseId === course.id)
  const courseMaterials = materials.filter((material) => material.courseId === course.id)
  const courseAssessments = assessments.filter((assessment) => assessment.courseId === course.id)
  const courseAttempts = attempts.filter((attempt) => courseAssessments.some((assessment) => assessment.id === attempt.assessmentId))
  const percent = courseSessions.length ? Math.round((courseSessions.filter((session) => completedSessionIds.has(session.id)).length / courseSessions.length) * 100) : 0

  async function toggleCompletion(sessionId: string) {
    const complete = !completedSessionIds.has(sessionId)
    setBusySessionId(sessionId)
    setSessionMessage("")
    try {
      const error = await onSetSessionCompletion(sessionId, complete)
      setSessionMessage(error || (complete ? "Session marked complete." : "Session marked incomplete."))
    } catch (error) {
      console.error("[dashboard] session completion interaction failed", error)
      setSessionMessage("Unable to update your course progress. Please try again.")
    } finally {
      setBusySessionId(null)
    }
  }

  return (
    <section className="flex flex-col gap-6 border-t border-border/70 px-4 py-6" aria-labelledby="course-learning-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="course-learning-title" className="font-display text-lg font-semibold">Course learning</h3>
          <p className="mt-1 text-sm text-muted-foreground">Complete each session to track your progress.</p>
        </div>
        <p className="text-sm font-semibold" aria-live="polite">{percent}% complete</p>
      </div>
      <div role="progressbar" aria-label={`${course.title} lesson progress`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${percent}%` }} />
      </div>
      {learningError && <StatusMessage tone="error">{learningError} Reload the page to try again.</StatusMessage>}
      {sessionMessage && <StatusMessage tone={sessionMessage.startsWith("Unable") ? "error" : "success"}>{sessionMessage}</StatusMessage>}

      <div className="flex flex-col gap-3">
        <h4 className="font-semibold">Sessions</h4>
        {courseSessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Course sessions are not available yet.</p>
        ) : courseSessions.map((session) => {
          const path = paths.find((item) => item.id === session.pathId)
          const complete = completedSessionIds.has(session.id)
          return (
            <article key={session.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-start">
              <span className="mt-0.5 shrink-0 text-primary" aria-hidden="true">{complete ? <Check className="size-5" /> : <Circle className="size-5" />}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{session.title}</p>
                {path && <p className="mt-1 text-xs text-muted-foreground">{path.title}</p>}
                {session.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{session.description}</p>}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {session.durationMinutes > 0 && <span>{session.durationMinutes} min</span>}
                  {session.videoUrl && <a className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4" href={session.videoUrl} target="_blank" rel="noopener noreferrer"><Video className="size-3.5" aria-hidden="true" />Open session video</a>}
                </div>
              </div>
              <Button type="button" variant={complete ? "outline" : "default"} className="min-h-10 shrink-0" disabled={busySessionId === session.id} onClick={() => void toggleCompletion(session.id)}>
                {busySessionId === session.id ? "Saving…" : complete ? "Mark incomplete" : "Mark complete"}
              </Button>
            </article>
          )
        })}
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="font-semibold">Course materials</h4>
        {courseMaterials.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No course materials are available yet.</p>
        ) : courseMaterials.map((material) => (
          <article key={material.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-border p-4">
            <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{material.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{material.resourceType}</p>
              {material.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{material.description}</p>}
            </div>
            <a className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" href={material.url} target="_blank" rel="noopener noreferrer" download>
              <Download className="size-4" aria-hidden="true" />Open
            </a>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="font-semibold">Assessments</h4>
        {courseAssessments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Assessments are not available yet.</p>
        ) : courseAssessments.map((assessment) => (
          <AssessmentForm
            key={assessment.id}
            assessment={assessment}
            questions={questions.filter((question) => question.assessmentId === assessment.id)}
            attempts={courseAttempts.filter((attempt) => attempt.assessmentId === assessment.id)}
            answers={answers}
            onSubmit={onSubmitAssessment}
          />
        ))}
      </div>
    </section>
  )
}

function AssessmentForm({
  assessment,
  questions,
  attempts,
  answers,
  onSubmit,
}: {
  assessment: CourseAssessment
  questions: CourseAssessmentQuestion[]
  attempts: CourseAssessmentAttempt[]
  answers: CourseAssessmentAnswer[]
  onSubmit: Props["onSubmitAssessment"]
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const latestAttempt = attempts[0]
  const attemptAnswers = latestAttempt ? answers.filter((answer) => answer.attemptId === latestAttempt.id) : []
  const remaining = Math.max(assessment.maxAttempts - attempts.length, 0)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (questions.length === 0 || questions.some((question) => !values[question.id]?.trim())) {
      setStatus({ tone: "error", text: "Answer every question before submitting." })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const result = await onSubmit(assessment.id, questions.map((question) => ({ questionId: question.id, answer: values[question.id].trim() })))
      if ("error" in result) {
        setStatus({ tone: "error", text: result.error })
        return
      }
      setValues({})
      const { score, maxScore, needsReview, attemptsUsed, attemptsAllowed } = result.result
      setStatus({
        tone: "success",
        text: needsReview
          ? `Submitted for review. Your automatic score is ${score} of ${maxScore}. Attempt ${attemptsUsed} of ${attemptsAllowed}.`
          : `Assessment scored ${score} of ${maxScore}. Attempt ${attemptsUsed} of ${attemptsAllowed}.`,
      })
    } catch (error) {
      console.error("[dashboard] assessment submission interaction failed", error)
      setStatus({ tone: "error", text: "Unable to submit your assessment. Please try again." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div>
        <h5 className="font-medium">{assessment.title}</h5>
        {assessment.instructions && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{assessment.instructions}</p>}
      </div>
      {latestAttempt && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="font-medium">Latest attempt: {latestAttempt.status === "graded" ? `${latestAttempt.score} of ${latestAttempt.maxScore}` : "Awaiting review"}</p>
          {attemptAnswers.map((answer) => answer.feedback && (
            <p key={answer.id} className="mt-2 text-muted-foreground">{answer.feedback}</p>
          ))}
        </div>
      )}
      {status && <StatusMessage tone={status.tone}>{status.text}</StatusMessage>}
      {remaining > 0 ? (
        <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
          {questions.map((question, index) => (
            <fieldset key={question.id} className="min-w-0 rounded-lg border border-border p-3">
              <legend className="max-w-full px-1 text-sm font-medium">{index + 1}. {question.prompt} <span className="text-xs text-muted-foreground">({question.points} {question.points === 1 ? "point" : "points"})</span></legend>
              {question.questionType === "written" ? (
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-input bg-background p-3 text-base sm:text-sm"
                  value={values[question.id] || ""}
                  maxLength={5000}
                  aria-label={`Response to ${question.prompt}`}
                  onChange={(event) => setValues((current) => ({ ...current, [question.id]: event.target.value }))}
                />
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  {question.options.map((option) => (
                    <label key={option} className="flex min-h-10 items-center gap-2 text-sm">
                      <input type="radio" name={`${assessment.id}-${question.id}`} value={option} checked={values[question.id] === option} onChange={() => setValues((current) => ({ ...current, [question.id]: option }))} />
                      {option}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          ))}
          <Button type="submit" className="w-fit" disabled={busy || questions.length === 0}>
            <Send data-icon="inline-start" />{busy ? "Submitting…" : `Submit assessment (${remaining} ${remaining === 1 ? "attempt" : "attempts"} left)`}
          </Button>
        </form>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><BookOpenCheck className="size-4" aria-hidden="true" />You have used all {assessment.maxAttempts} attempts. <RotateCcw className="size-4" aria-hidden="true" /></p>
      )}
    </article>
  )
}
