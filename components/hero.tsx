"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { LectureLibraryShowcase } from "@/components/course-table"

const ROTATING_WORDS = ["distinguished", "established", "positioned", "proved"]
const HERO_SLIDES = [
  { src: "/gallery/DSC_5054.jpg", label: "Apostolic leadership in motion" },
  { src: "/gallery/DSC_5065.jpg", label: "Equipped for influence" },
  { src: "/gallery/DSC_5522.jpg", label: "Distinguished for purpose" },
  { src: "/gallery/DSC_5536.jpg", label: "Built for lasting impact" },
]
const LAUNCH_DATE = new Date("October 3, 2026 10:00:00").getTime()

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number }

function getTimeLeft(): TimeLeft | null {
  const distance = LAUNCH_DATE - Date.now()
  if (distance < 0) return null
  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  }
}

const pad = (value: number) => value.toString().padStart(2, "0")

export function OfficialLaunch() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTimeLeft(getTimeLeft())
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  const boxes: { label: string; value: number }[] = timeLeft
    ? [
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Minutes", value: timeLeft.minutes },
        { label: "Seconds", value: timeLeft.seconds },
      ]
    : []

  return (
    <div className="launch-section" id="launch" aria-labelledby="launch-title">
      <h2 className="launch-eyebrow" id="launch-title">
        Official Launch
      </h2>
      <p className="launch-date">Saturday, 3 October 2026</p>

      <div id="countdown">
        {timeLeft ? (
          boxes.map((box) => (
            <div className="time-box" key={box.label}>
              <span className="time-value">{pad(box.value)}</span>
              <span className="time-label">{box.label}</span>
            </div>
          ))
        ) : (
          <div className="launch-live">
            <h2 className="launch-eyebrow">We have launched!</h2>
            <Link className="btn-primary launch-signup" href="/auth?mode=signup">
              Sign up to join
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export function Hero() {
  const [word, setWord] = useState(ROTATING_WORDS[0])
  const [blurred, setBlurred] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isSliderPlaying, setIsSliderPlaying] = useState(true)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!isSliderPlaying) return
    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length)
    }, 6500)
    return () => clearInterval(interval)
  }, [isSliderPlaying])

  useEffect(() => {
    const interval = setInterval(() => {
      setBlurred(true)
      const timeout = setTimeout(() => {
        indexRef.current = (indexRef.current + 1) % ROTATING_WORDS.length
        setWord(ROTATING_WORDS[indexRef.current])
        setBlurred(false)
      }, 350)
      return () => clearTimeout(timeout)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="hero" aria-labelledby="hero-title" id="top">
      <div className="hero-top-section">
        {/* Background Gallery Images */}
        <div className="hero-video" aria-live="polite">
          {HERO_SLIDES.map((slide, index) => (
            <img
              key={slide.src}
              className={`hero-slide-image ${index === activeSlide ? "is-active" : ""}`}
              src={slide.src}
              alt=""
              aria-hidden={index !== activeSlide}
            />
          ))}
          <div className="video-wash" />
          <div className="hero-grid-lines" />
        </div>

        {/* Floating Controls (Subtle & Animated) */}
        <div className="hero-slider-controls" aria-label="Hero image slider controls">
          <button
            type="button"
            className="hero-slider-arrow"
            onClick={() => setActiveSlide((activeSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            aria-label="Previous slide"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className="hero-slider-play"
            onClick={() => setIsSliderPlaying((playing) => !playing)}
            aria-label={isSliderPlaying ? "Pause image slider" : "Play image slider"}
          >
            {isSliderPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="hero-slider-arrow"
            onClick={() => setActiveSlide((activeSlide + 1) % HERO_SLIDES.length)}
            aria-label="Next slide"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>

        {/* Main Hero Content */}
        <div className="agent-hero-content">
          <div className="agent-hero-copy">
            <h1 id="hero-title">
              ...Daniel
              <br />
              <span
                className="blur-word"
                aria-live="polite"
                style={{
                  filter: blurred ? "blur(18px)" : "blur(0)",
                  opacity: blurred ? 0 : 1,
                }}
              >
                {word}
              </span>
              <br />
              himself above the governors and satraps...
            </h1>
            <p className="agent-eyebrow">
              <span /> Daniel 6:3 NKJV
            </p>
          </div>
        </div>

        {/* Bottom Container: Always exactly 2 lines */}
        <div className="hero-bottom">
          <div className="agent-stats ml-auto text-right" aria-label="Our purpose">
            <p className="hero-purpose">
              <span>Distinguished for Purpose.</span>
              <span>Equipped for Influence.</span>
            </p>
          </div>
        </div>

        {/* Edge-to-Edge Continuous Navigation Swoosh Rail */}
        <div className="hero-slide-rail-wrapper">
          <div
            className="hero-swoosh-bar"
            style={{
              width: `${100 / HERO_SLIDES.length}%`,
              transform: `translateX(${activeSlide * 100}%)`,
            }}
          />
        </div>
      </div>

      <div className="hero-showcase-container">
        <LectureLibraryShowcase />
      </div>
    </section>
  )
}