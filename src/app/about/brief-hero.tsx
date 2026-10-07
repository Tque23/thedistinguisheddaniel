"use client"

import { useEffect, useState } from "react"

export function BriefHero() {
  const [fontReady, setFontReady] = useState(false)

  useEffect(() => {
    let active = true

    void document.fonts.load('400 12px "Trajan Pro 3"').then(() => {
      if (active) setFontReady(true)
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <header className={`brief-hero${fontReady ? " brief-hero--ready" : ""}`} aria-busy={!fontReady}>
      <p className="brief-kicker">The Distinguished Daniel Network &amp; Institute</p>
      <h1>Welcome<br /><em>Brief</em></h1>
      <p className="brief-intro">We are in the End Times.</p>
      <span className="brief-index">01 / 05</span>
    </header>
  )
}
