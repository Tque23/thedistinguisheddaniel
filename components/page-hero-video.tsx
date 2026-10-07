"use client"

import { Pause, Play } from "lucide-react"
import { useState } from "react"

export function PageHeroVideo() {
  const [isPlaying, setIsPlaying] = useState(true)

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
      <video autoPlay muted loop playsInline aria-label="Ambient DDNI background video">
        <source src="/hero-video.webm" type="video/webm" />
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>
      <button className="page-hero-video-control" type="button" onClick={togglePlayback} aria-label={isPlaying ? "Pause background video" : "Play background video"}>
        {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        <span>{isPlaying ? "Pause" : "Play"}</span>
      </button>
    </div>
  )
}
