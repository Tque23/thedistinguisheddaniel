"use client"

import Image from "next/image"
import { useCallback, useRef, useState, type KeyboardEvent, type TouchEvent } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

const SWIPE_THRESHOLD = 40

type GallerySliderProps = {
  images?: string[]
  kicker?: string
  title?: string
  emphasis?: string
  id?: string
}

export function GallerySlider({
  images = [],
  kicker = "DDNI in motion",
  title = "Moments of",
  emphasis = "purpose.",
  id = "gallery",
}: GallerySliderProps) {
  const [active, setActive] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const total = images.length
  const titleId = `${id}-title`

  const move = useCallback(
    (direction: number) => {
      if (total === 0) return
      setActive((current) => (current + direction + total) % total)
    },
    [total],
  )

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      move(1)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      move(-1)
    }
  }

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1)
  }

  if (total === 0) return null

  return (
    <section className="home-gallery section-px" aria-labelledby={titleId} aria-roledescription="carousel" onKeyDown={onKeyDown}>
      <div className="home-gallery-heading">
        <div>
          <p className="home-gallery-kicker">{kicker}</p>
          <h2 id={titleId}>{title} <em>{emphasis}</em></h2>
        </div>
        <div className="home-gallery-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous gallery image"><ArrowLeft aria-hidden="true" /></button>
          <span aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
          <button type="button" onClick={() => move(1)} aria-label="Next gallery image"><ArrowRight aria-hidden="true" /></button>
        </div>
      </div>
      <div className="home-gallery-frame" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ touchAction: "pan-y" }}>
        <div className="home-gallery-browserbar" aria-hidden="true"><span /><span /><span /></div>
        <div className="home-gallery-stage">
        <div className="home-gallery-track">
          {images.map((image, index) => {
            const offset = (index - active + total) % total
            const position = offset === 0 ? "is-active" : offset === 1 ? "is-next" : offset === total - 1 ? "is-prev" : "is-hidden"
            return (
              <div key={image} className={`home-gallery-slide ${position}`} aria-hidden={index !== active}>
                <Image
                  src={image}
                  alt={`Gallery moment ${index + 1} of ${total}`}
                  fill
                  priority={index === 0}
                  loading={offset <= 1 || offset === total - 1 ? "eager" : "lazy"}
                  sizes="(max-width: 768px) 82vw, 72vw"
                  className="home-gallery-image"
                />
              </div>
            )
          })}
        </div>
        <button type="button" className="home-gallery-arrow home-gallery-arrow-prev" onClick={() => move(-1)} aria-label="Previous gallery image"><ArrowLeft aria-hidden="true" /></button>
        <button type="button" className="home-gallery-arrow home-gallery-arrow-next" onClick={() => move(1)} aria-label="Next gallery image"><ArrowRight aria-hidden="true" /></button>
        </div>
        <div className="home-gallery-dots" role="tablist" aria-label="Gallery images">
          {images.map((image, index) => (
            <button key={image} type="button" role="tab" aria-selected={active === index} aria-label={`Show gallery image ${index + 1}`} onClick={() => setActive(index)} className={active === index ? "is-active" : ""} />
          ))}
        </div>
      </div>
      <div className="home-gallery-dots home-gallery-mobile-dots" role="tablist" aria-label="Gallery images">
        {images.map((image, index) => (
          <button key={image} type="button" role="tab" aria-selected={active === index} aria-label={`Show gallery image ${index + 1}`} onClick={() => setActive(index)} className={active === index ? "is-active" : ""} />
        ))}
      </div>
    </section>
  )
}

export default GallerySlider
