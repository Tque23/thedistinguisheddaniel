"use client"

import { Pause, Play } from "lucide-react"
import { useEffect, useState } from "react"

export function PageHeroVideo() {
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>(".page-hero-video video")
    if (!video) return
    const loadVideo = () => {
      video.querySelectorAll<HTMLSourceElement>("source[data-src]").forEach((source) => {
        source.src = source.dataset.src || ""
      })
      video.load()
      void video.play().catch(() => setIsPlaying(false))
    }
    if ("requestIdleCallback" in window) window.requestIdleCallback(loadVideo, { timeout: 1500 })
    else setTimeout(loadVideo, 1000)
  }, [])

  function togglePlayback() {
    const video = document.querySelector<HTMLVideoElement>(".page-hero-video video")
    if (!video) return

    if (video.paused) {
      void video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className="page-hero-video">
      <video autoPlay muted loop playsInline preload="none" poster="/Poster.jpg" aria-label="Ambient DDNI background video">
        <source data-src="/hero-video.webm" type="video/webm" />
        <source data-src="/hero-video.mp4" type="video/mp4" />
      </video>
      <button className="page-hero-video-control" type="button" onClick={togglePlayback} aria-label={isPlaying ? "Pause background video" : "Play background video"}>
        {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        <span>{isPlaying ? "Pause" : "Play"}</span>
      </button>
    </div>
  )
}
