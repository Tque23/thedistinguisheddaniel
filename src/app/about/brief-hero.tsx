"use client"

import { useEffect, useState } from "react"
import { PageHeroVideo } from "@/components/page-hero-video"

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
      <PageHeroVideo />
      <div className="brief-hero-inner">
        <p className="brief-kicker">The Distinguished Daniel Network &amp; Institute</p>
        <h1>Welcome<br /><em>Brief</em></h1>
        <p className="brief-intro">A people prepared to influence the world with excellence.</p>
      </div>
    </header>
  )
}
