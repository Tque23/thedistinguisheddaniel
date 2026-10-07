"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { CalendarDays, Clock, MapPin, X } from "lucide-react"
import { REGISTRATION_EMAIL, type Course } from "@/lib/courses"

interface CourseDialogProps {
  course: Course | null
  onClose: () => void
}

export function CourseDialog({ course, onClose }: CourseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (course && !dialog.open) dialog.showModal()
    if (!course && dialog.open) dialog.close()
  }, [course])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="course-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className="m-auto w-[min(92vw,720px)] max-h-[90vh] overflow-y-auto rounded-2xl border border-[#d2ad55]/30 bg-[#0a1c2a] p-0 text-left text-white shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      {course && (
        <div>
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <img src={course.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1c2a] via-[#0a1c2a]/40 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close course information"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-6 px-5 pb-6 pt-2 sm:px-8 sm:pb-8">
            <header>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d2ad55]">{course.badge}</p>
              <h2 id="course-dialog-title" className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">{course.title}</h2>
            </header>

            <p className="text-sm leading-relaxed text-white/75">{course.description}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              {course.formats.map((format) => (
                <section key={format.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d2ad55]">{format.label}</h3>
                    <p className="font-serif text-2xl">{format.price}</p>
                  </div>
                  {format.includes && <p className="mt-2 text-xs leading-relaxed text-white/60">{format.includes}</p>}
                  <ul className="mt-4 space-y-2 text-sm text-white/85">
                    <li className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#d2ad55]" aria-hidden="true" /><span>{format.seating}</span></li>
                    <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#d2ad55]" aria-hidden="true" /><span>{format.time}</span></li>
                    <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d2ad55]" aria-hidden="true" /><span>{format.location.label}: {format.location.value}</span></li>
                  </ul>
                </section>
              ))}
            </div>

            <aside className="rounded-xl border border-[#d2ad55]/40 bg-[#d2ad55]/10 p-4 text-sm leading-relaxed text-white/85">
              <p className="font-semibold text-[#f3d27a]">How to register</p>
              <p className="mt-2">
                {course.free
                  ? "This course is free. Sign up and email "
                  : "Send your proof of payment to "}
                <a className="text-[#f3d27a] underline" href={`mailto:${REGISTRATION_EMAIL}?subject=${encodeURIComponent(`${course.title} registration`)}`}>{REGISTRATION_EMAIL}</a>
                {course.free ? " to confirm your seat." : " and receive your registration confirmation."}
              </p>
              <p className="mt-2">
                <strong className="font-semibold text-white">Already signed up?</strong> Please share the email address you signed up with, along with your name and surname, as your reference.
              </p>
            </aside>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center justify-center rounded-full bg-[#970024] px-6 py-3 text-sm font-semibold transition hover:bg-[#b0002d]"
              >
                Sign up to register
              </Link>
              <button type="button" onClick={onClose} className="text-sm text-white/60 transition hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
