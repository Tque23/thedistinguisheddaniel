"use client"

import { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { COURSES, type Course } from "@/lib/courses"
import { CourseDialog } from "@/components/course-dialog"

export function CourseInfo() {
  const [selected, setSelected] = useState<Course | null>(null)

  return (
    <section className="mt-12 border-t border-white/10 pt-10" aria-labelledby="course-info-title">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d2ad55]">Short Courses, 2026</p>
      <h2 id="course-info-title" className="mt-3 font-display text-3xl leading-tight">Sign up and reserve your seat in our courses.</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        Choose a course below to see the dates, pricing and how to register.
      </p>
      <ul className="mt-6 flex flex-col gap-3">
        {COURSES.map((course) => (
          <li key={course.id}>
            <button
              type="button"
              onClick={() => setSelected(course)}
              className="group flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-[#d2ad55]/50 hover:bg-white/10"
            >
              <img src={course.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" loading="lazy" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">{course.title}</span>
                <span className="block text-xs text-white/55">{course.free ? "Free · In-person" : "In-person and online"}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#d2ad55] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <CourseDialog course={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
