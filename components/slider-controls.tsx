import { ArrowLeft, ArrowRight } from "lucide-react"

type SliderControlsProps = {
  pages: number
  activePage: number
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  onPage: (page: number) => void
  tone?: "light" | "dark"
  label: string
}

const TONES = {
  light: {
    arrow: "border-[#172b3a]/25 text-[#172b3a] hover:bg-[#172b3a] hover:text-[#f4f0e7] focus-visible:bg-[#172b3a] focus-visible:text-[#f4f0e7]",
    active: "bg-[#1C2536]",
    idle: "bg-[#172b3a]/30 group-hover:bg-[#172b3a]/60",
  },
  dark: {
    arrow: "border-white/25 text-white hover:bg-white hover:text-slate-900 focus-visible:bg-white focus-visible:text-slate-900",
    active: "bg-slate-100",
    idle: "bg-slate-700 group-hover:bg-slate-500",
  },
} as const

export function SliderControls({
  pages,
  activePage,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onPage,
  tone = "light",
  label,
}: SliderControlsProps) {
  if (pages <= 1) return null
  const styles = TONES[tone]
  const arrowClass = `hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 sm:flex ${styles.arrow}`

  return (
    <div className="mt-2 flex items-center justify-center gap-2" role="group" aria-label={`${label} navigation`}>
      <button type="button" onClick={onPrev} disabled={!canPrev} className={arrowClass} aria-label={`Previous ${label}`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="flex flex-wrap items-center justify-center">
        {Array.from({ length: pages }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onPage(index)}
            className="group flex h-11 min-w-6 touch-manipulation items-center justify-center px-0.5"
            aria-label={`Go to ${label} page ${index + 1} of ${pages}`}
            aria-current={activePage === index ? "true" : undefined}
          >
            <span
              className={`block h-2 rounded-full transition-all duration-300 ${
                activePage === index ? `w-6 ${styles.active}` : `w-2 ${styles.idle}`
              }`}
            />
          </button>
        ))}
      </div>
      <button type="button" onClick={onNext} disabled={!canNext} className={arrowClass} aria-label={`Next ${label}`}>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
