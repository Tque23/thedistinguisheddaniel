"use client"

import { useEffect, useState } from "react"

const LAUNCH_DATE = new Date("October 3, 2026 00:00:00").getTime()

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
    <section className="launch-section" id="launch" aria-labelledby="launch-title">
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
    </section>
  )
}
