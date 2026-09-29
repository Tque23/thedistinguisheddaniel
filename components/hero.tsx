"use client"

import { useEffect, useRef, useState } from "react"
import { LectureLibraryShowcase } from "@/components/course-table"

const ROTATING_WORDS = ["distinguished", "established", "positioned", "proved"]
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
          <h2 className="launch-eyebrow">We have launched!</h2>
        )}
      </div>
    </div>
  )
}

export function Hero() {
  const [word, setWord] = useState(ROTATING_WORDS[0])
  const [blurred, setBlurred] = useState(false)
  const indexRef = useRef(0)

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
      {/* 1. Hero Video Header Container */}
      <div className="hero-top-section">
        {/* Background Video */}
        <div className="hero-video" aria-hidden="true">
          <video autoPlay muted loop playsInline>
            <source src="/hero-video.webm" type="video/webm" />
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="video-wash" />
          <div className="hero-grid-lines" />
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
              himself above the governors and satraps...{" "}
            </h1>
            <p className="agent-eyebrow">
              <span /> Daniel 6:3 NKJV
            </p>
          </div>
        </div>

        {/* Bottom Container: Stats + Launch Widget */}
        <div className="hero-bottom">
          <div className="agent-stats" aria-label="Network statistics">
            <div>
              <strong>100+</strong>
              <span>Registrations</span>
            </div>
            <div>
              <strong>50+</strong>
              <span>Testimonies</span>
            </div>
            <div>
              <strong>65</strong>
              <span>Active Pioneers</span>
            </div>
          </div>
          <OfficialLaunch />
        </div>
      </div>
      <div className="hero-showcase-container">
        <LectureLibraryShowcase />
      </div>
    </section>
  )
}
