"use client"

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react"

type Metrics = {
  pages: number
  activePage: number
  canPrev: boolean
  canNext: boolean
}

const INITIAL: Metrics = { pages: 1, activePage: 0, canPrev: false, canNext: false }

/**
 * Scroll-snap slider state. Dots map to "pages" (a full viewport of cards),
 * so the dot count and active dot always reflect what is actually on screen.
 */
export function useScrollSlider(count: number, resetKey?: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<Metrics>(INITIAL)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el || el.children.length === 0) {
      setMetrics((prev) => (prev === INITIAL ? prev : INITIAL))
      return null
    }

    const first = el.children[0] as HTMLElement
    const second = el.children[1] as HTMLElement | undefined
    const stride = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth
    const gap = Math.max(0, stride - first.offsetWidth)
    const maxScroll = el.scrollWidth - el.clientWidth
    const perView = Math.max(1, Math.floor((el.clientWidth + gap) / Math.max(stride, 1)))
    const items = el.children.length

    if (maxScroll <= 2) {
      const next: Metrics = { pages: 1, activePage: 0, canPrev: false, canNext: false }
      setMetrics((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
      return { stride, perView, maxScroll, first }
    }

    const pages = Math.max(1, Math.ceil(items / perView))
    const atEnd = el.scrollLeft >= maxScroll - 2
    const index = Math.round(el.scrollLeft / Math.max(stride, 1))
    const activePage = atEnd ? pages - 1 : Math.min(pages - 1, Math.floor(index / perView))
    const next: Metrics = {
      pages,
      activePage,
      canPrev: el.scrollLeft > 2,
      canNext: !atEnd,
    }
    setMetrics((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    return { stride, perView, maxScroll, first }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    schedule()
    el.addEventListener("scroll", schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(el)
    Array.from(el.children).forEach((child) => observer.observe(child))

    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener("scroll", schedule)
      observer.disconnect()
    }
  }, [measure, count])

  useEffect(() => {
    ref.current?.scrollTo({ left: 0, behavior: "auto" })
  }, [resetKey])

  const scrollToPage = useCallback(
    (page: number) => {
      const el = ref.current
      const info = measure()
      if (!el || !info) return
      const itemIndex = Math.min(page * info.perView, el.children.length - 1)
      const target = (el.children[itemIndex] as HTMLElement).offsetLeft - info.first.offsetLeft
      el.scrollTo({ left: Math.min(Math.max(target, 0), info.maxScroll), behavior: "smooth" })
    },
    [measure],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      const el = ref.current
      const info = measure()
      if (!el || !info) return
      el.scrollBy({ left: direction * info.stride * info.perView, behavior: "smooth" })
    },
    [measure],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault()
        step(1)
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        step(-1)
      }
    },
    [step],
  )

  return {
    ref,
    ...metrics,
    scrollToPage,
    prev: () => step(-1),
    next: () => step(1),
    onKeyDown,
  }
}
