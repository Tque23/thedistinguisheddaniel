"use client"

import type React from "react"

import { useState } from "react"
import { Archive, Menu, ChevronRight } from "lucide-react"

interface Card {
  id: number
  title: string
  subtitle: string
  date: string
  dateLabel: string
  image: string
}
const cards: Card[] = [
  {
    id: 1,
    title: "Test Blog Post",
    subtitle: "A simple test post to verify everything works",
    date: "December 10, 2024",
    dateLabel: "Dec 10",
    image: "/Poster1.jpg",
  },
  {
    id: 2,
    title: "Building with Next.js 15",
    subtitle: "Server components, and the future of React",
    date: "December 9, 2024",
    dateLabel: "Dec 9",
    image: "/Poster2.jpeg",
  },
  {
    id: 3,
    title: "Design Systems at Scale",
    subtitle: "Managing consistency across large applications",
    date: "December 8, 2024",
    dateLabel: "Dec 8",
    image: "/placeholder.jpg",
  },
  {
    id: 4,
    title: "Advanced TypeScript Patterns",
    subtitle: "Type gymnastics and practical patterns",
    date: "November 14, 2024",
    dateLabel: "Nov 14",
    image: "/placeholder.jpg",
  },
  {
    id: 5,
    title: "Modern CSS Architecture",
    subtitle: "From utility-first to component styles",
    date: "November 12, 2024",
    dateLabel: "Nov 12",
    image: "/placeholder.jpg",
  },
  {
    id: 6,
    title: "Developer Experience Matters",
    subtitle: "Tools and workflows that make developers happy",
    date: "November 11, 2024",
    dateLabel: "Nov 11",
    image: "/placeholder.jpg",
  },
  {
    id: 7,
    title: "State Management in 2024",
    subtitle: "Beyond Redux—modern approaches to app state",
    date: "September 18, 2024",
    dateLabel: "Sep 18",
    image: "/placeholder.jpg",
  },
  {
    id: 8,
    title: "Web Performance Deep Dive",
    subtitle: "Core Web Vitals and beyond",
    date: "September 17, 2024",
    dateLabel: "Sep 17",
    image: "/placeholder.jpg",
  },
  {
    id: 9,
    title: "API Design Principles",
    subtitle: "Building APIs developers love",
    date: "September 16, 2024",
    dateLabel: "Sep 16",
    image: "/placeholder.jpg",
  },
  {
    id: 10,
    title: "React Server Components Explained",
    subtitle: "The paradigm shift in React architecture",
    date: "July 22, 2024",
    dateLabel: "Jul 22",
    image: "/placeholder.jpg",
  },
  {
    id: 11,
    title: "What's New in Tailwind v4",
    subtitle: "CSS-first configuration and lightning fast builds",
    date: "July 20, 2024",
    dateLabel: "Jul 20",
    image: "/placeholder.jpg",
  },
  {
    id: 12,
    title: "Edge Computing for Web Apps",
    subtitle: "Running code closer to your users",
    date: "July 19, 2024",
    dateLabel: "Jul 19",
    image: "/placeholder.jpg",
  },
]

export function TimeMachineRolodex() {
  const [position, setPosition] = useState(0)
  const [viewMode, setViewMode] = useState<"stack" | "list">("stack")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleTimelineClick = (index: number) => {
    setPosition(index)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const activeIndex = Math.round(position)

  return (
    <section
      className="w-full bg-[#E8ECEF] py-16 section-px font-sans text-[#1A202C]"
      onMouseMove={handleMouseMove}
      aria-labelledby="rolodex-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2
              id="rolodex-title"
              className="mb-3 font-serif text-4xl font-normal tracking-tight text-[#1C2536] md:text-5xl"
            >
              Blog
            </h2>
            <p className="text-base text-[#5A6578] md:text-lg">
              Our board is composed of some of the world&apos;s most respected minds.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white/80 p-1 shadow-sm backdrop-blur-sm">
            <button
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              className={`rounded-md p-2 transition-colors ${viewMode === "list" ? "bg-neutral-100" : "hover:bg-neutral-100"}`}
              onClick={() => setViewMode("list")}
            >
              <Menu className="h-5 w-5 text-neutral-700" />
            </button>            
            <button
              aria-label="Stack view"
              aria-pressed={viewMode === "stack"}
              className={`rounded-md p-2 transition-colors ${viewMode === "stack" ? "bg-neutral-100" : "hover:bg-neutral-100"}`}
              onClick={() => setViewMode("stack")}
            >
              <Archive className="h-5 w-5 text-neutral-700" />
            </button>
          </div>
        </div>

        {viewMode === "stack" ? (
          <div className="relative flex h-[520px] gap-4 md:h-[680px]">
            <div
              className="relative flex flex-1 items-center justify-center pt-24 md:pt-32"
              style={{ perspective: "1500px" }}
            >
              <div
                className="relative aspect-[4/3] w-full max-w-[800px]"
                style={{ transformStyle: "preserve-3d" }}
              >
                {[...cards].reverse().map((card, reverseIndex) => {
                  const index = cards.length - 1 - reverseIndex
                  const distanceFromActive = index - position

                  if (distanceFromActive < -1.5 || distanceFromActive > 5) {
                    return null
                  }

                  const isBehind = distanceFromActive > 0
                  const isInFront = distanceFromActive < 0

                  const translateZ = distanceFromActive * -60
                  const translateY = distanceFromActive * -30
                  const scale = 1 - Math.abs(distanceFromActive) * 0.03

                  let opacity = 1
                  if (isInFront) {
                    opacity = Math.max(0, 1 + distanceFromActive * 2)
                  }

                  return (
                    <div
                      key={card.id}
                      className="absolute inset-0"
                      style={{
                        transform: `translateZ(${translateZ}px) translateY(${translateY}px) scale(${Math.max(0.7, scale)})`,
                        opacity: Math.max(0, opacity),
                        zIndex: Math.round((cards.length - Math.abs(distanceFromActive)) * 10),
                        transition: "transform 0.5s ease-out, opacity 0.5s ease-out",
                        pointerEvents: Math.abs(distanceFromActive) < 0.5 ? "auto" : "none",
                      }}
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-neutral-200 shadow-2xl">
                        <img
                          src={card.image || "/placeholder.svg"}
                          alt={card.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1727]/90 via-[#0B1727]/40 to-transparent" />
                        {isBehind && (
                          <div
                            className="absolute inset-0 bg-black"
                            style={{
                              opacity: Math.min(0.3, Math.abs(distanceFromActive) * 0.08),
                            }}
                          />
                        )}
                        <div className="relative z-10 flex h-full flex-col justify-end p-5 text-white md:p-8">
                          <h3 className="font-serif text-xl font-normal leading-tight md:text-3xl">
                            {card.title}
                          </h3>
                          <p className="mt-2 text-xs font-light leading-relaxed text-gray-300 md:text-sm">
                            {card.subtitle}
                          </p>
                          <p className="mt-3 text-[11px] tracking-wider text-gray-400 md:text-xs">{card.date}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <nav
              aria-label="Timeline"
              className="relative z-40 flex shrink-0 flex-col items-end justify-between py-4"
            >
              {cards.map((card, index) => {
                const isActive = index === activeIndex
                const isNow = index === 0

                return (
                  <button
                    key={card.id}
                    aria-current={isActive ? "true" : undefined}
                    className="group flex items-center gap-2 transition-all duration-300"
                    onClick={() => handleTimelineClick(index)}
                  >
                    <span
                      className={`text-xs font-medium transition-all duration-300 md:text-sm ${
                        isActive ? "text-[#c89b3c]" : "text-neutral-400 group-hover:text-neutral-600"
                      }`}
                    >
                      {isNow ? "Now" : card.dateLabel}
                    </span>
                    <div className="relative flex items-center">
                      <div
                        className={`h-0.5 transition-all duration-300 ${
                          isActive
                            ? "w-8 bg-[#c89b3c]"
                            : "w-4 bg-neutral-300 group-hover:w-6 group-hover:bg-neutral-400"
                        }`}
                      />
                      {isActive && <div className="absolute -right-1 h-2 w-2 rounded-full bg-[#c89b3c]" />}
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        ) : (
          <>
            <div className="divide-y divide-neutral-200">
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  className="group flex w-full items-center gap-6 py-4 text-left transition-colors hover:bg-neutral-50"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {
                    setViewMode("stack")
                    setPosition(index)
                  }}
                >
                  <span className="w-24 shrink-0 text-sm text-neutral-400 md:w-32">{card.dateLabel}</span>
                  <span className="min-w-0 flex-1 font-medium text-neutral-900 md:w-[280px] md:flex-none">
                    {card.title}
                  </span>
                  <span className="hidden min-w-0 flex-1 text-neutral-400 md:block">{card.subtitle}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-neutral-500" />
                </button>
              ))}
            </div>

            {hoveredIndex !== null && (
              <div
                className="pointer-events-none fixed z-50 overflow-hidden rounded-2xl shadow-2xl transition-opacity duration-200"
                style={{
                  left: mousePos.x + 20,
                  top: mousePos.y - 100,
                  width: 280,
                  height: 180,
                }}
              >
                <img
                  src={cards[hoveredIndex].image || "/placeholder.svg"}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
