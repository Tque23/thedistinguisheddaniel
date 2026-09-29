"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
    image: "/placeholder.jpg",
  },
  {
    id: 2,
    title: "Building with Next.js 15",
    subtitle: "Server components, and the future of React",
    date: "December 9, 2024",
    dateLabel: "Dec 9",
    image: "/placeholder.jpg",
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
  const containerRef = useRef<HTMLDivElement>(null)

  const handleScroll = (e: WheelEvent) => {
    if (viewMode !== "stack") return
    e.preventDefault()

    const scrollSensitivity = 0.008
    const delta = e.deltaY * scrollSensitivity

    setPosition((prev) => {
      const newPosition = prev + delta
      return Math.max(0, Math.min(cards.length - 1, newPosition))
    })
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleScroll, { passive: false })
      return () => container.removeEventListener("wheel", handleScroll)
    }
  }, [viewMode])

  const handleTimelineClick = (index: number) => {
    setPosition(index)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const activeIndex = Math.round(position)

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-[#E8ECEF] py-16 px-6 md:px-12 font-sans text-[#1A202C]"
      onMouseMove={handleMouseMove}
    >
      {/* Header Navigation */}
      <div className="absolute right-6 top-6 z-50 flex items-center gap-1 rounded-lg border border-neutral-200 bg-white/80 p-1 shadow-sm backdrop-blur-sm">
        <button
          className={`rounded-md p-2 transition-colors ${viewMode === "stack" ? "bg-neutral-100" : "hover:bg-neutral-100"}`}
          onClick={() => setViewMode("stack")}
        >
          <Archive className="h-5 w-5 text-neutral-700" />
        </button>
        <button
          className={`rounded-md p-2 transition-colors ${viewMode === "list" ? "bg-neutral-100" : "hover:bg-neutral-100"}`}
          onClick={() => setViewMode("list")}
        >
          <Menu className="h-5 w-5 text-neutral-700" />
        </button>
      </div>

      {viewMode === "stack" ? (
        <>
          {/* Cards Stack */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1500px" }}>
            <div className="relative h-[600px] w-[800px]" style={{ transformStyle: "preserve-3d" }}>
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
                      transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
                      pointerEvents: Math.abs(distanceFromActive) < 0.5 ? "auto" : "none",
                    }}
                    onClick={() => handleTimelineClick(index)}
                  >
                    <div className="h-full w-full overflow-hidden bg-white shadow-2xl">
                      <div className="relative h-[65%] overflow-hidden bg-neutral-200">
                        <img
                          src={card.image || "/placeholder.svg"}
                          alt={card.title}
                          className="h-full w-full object-cover"
                        />
                        {isBehind && (
                          <div
                            className="absolute inset-0 bg-black"
                            style={{
                              opacity: Math.min(0.3, Math.abs(distanceFromActive) * 0.08),
                            }}
                          />
                        )}
                      </div>
                      <div className="bg-white p-8">
                        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">{card.title}</h2>
                        <p className="mt-2 text-lg text-neutral-500">{card.subtitle}</p>
                        <p className="mt-3 text-sm text-neutral-400">{card.date}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="absolute bottom-20 right-8 top-20 z-40 flex flex-col items-end justify-between py-8">
            {cards.map((card, index) => {
              const isActive = index === activeIndex
              const isNow = index === 0

              return (
                <button
                  key={card.id}
                  className="group flex items-center gap-2 transition-all duration-300"
                  onClick={() => handleTimelineClick(index)}
                >
                  <span
                    className={`text-sm font-medium transition-all duration-300 ${
                      isActive ? "text-orange-500" : "text-neutral-400 group-hover:text-neutral-600"
                    }`}
                  >
                    {isNow ? "Now" : card.dateLabel}
                  </span>
                  <div className="relative flex items-center">
                    <div
                      className={`h-0.5 transition-all duration-300 ${
                        isActive ? "w-8 bg-orange-500" : "w-4 bg-neutral-300 group-hover:w-6 group-hover:bg-neutral-400"
                      }`}
                    />
                    {isActive && <div className="absolute -right-1 h-2 w-2 rounded-full bg-orange-500" />}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-neutral-400">
            Scroll or click timeline to navigate
          </div>
        </>
      ) : (
        <>
          <div className="mx-auto max-w-5xl px-6 pb-12 pt-24">
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
                  <span className="w-32 shrink-0 text-sm text-neutral-400">
                    {card.date.split(",")[0]}, {card.date.split(",")[1]?.trim().split(" ")[0]}
                  </span>
                  <span className="min-w-0 shrink-0 font-medium text-neutral-900" style={{ width: "280px" }}>
                    {card.title}
                  </span>
                  <span className="min-w-0 flex-1 text-neutral-400">{card.subtitle}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-neutral-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Floating preview image */}
          {hoveredIndex !== null && (
            <div
              className="pointer-events-none fixed z-50 overflow-hidden shadow-2xl transition-opacity duration-200"
              style={{
                left: mousePos.x + 20,
                top: mousePos.y - 100,
                width: 280,
                height: 180,
              }}
            >
              <img
                src={cards[hoveredIndex].image || "/placeholder.svg"}
                alt={cards[hoveredIndex].title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}