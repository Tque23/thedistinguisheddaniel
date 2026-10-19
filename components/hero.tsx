"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { LectureLibraryShowcase } from "@/components/course-table"

const ROTATING_WORDS = ["distinguished", "established", "positioned", "proved"]

interface HeroProps {
  heroSlides?: { src: string }[]
}

export function Hero({ heroSlides = [] }: HeroProps) {
  const [word, setWord] = useState(ROTATING_WORDS[0])
  const [blurred, setBlurred] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isSliderPlaying, setIsSliderPlaying] = useState(true)
  const indexRef = useRef(0)

  const slidesCount = heroSlides.length

  useEffect(() => {
    if (!isSliderPlaying || slidesCount === 0) return
    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slidesCount)
    }, 6500)
    return () => clearInterval(interval)
  }, [isSliderPlaying, slidesCount])

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

  if (slidesCount === 0) return null

  return (
    <section className="hero" aria-labelledby="hero-title" id="top">
      <div className="hero-top-section">
        {/* Background Gallery Images */}
        <div className="hero-video" aria-live="polite">
          {heroSlides.map((slide, index) => (
            <Image
              key={slide.src}
              className={`hero-slide-image ${index === activeSlide ? "is-active" : ""}`}
              src={slide.src}
              alt=""
              fill
              sizes="100vw"
              quality={75}
              priority={index === 0}
              aria-hidden={index !== activeSlide}
            />
          ))}
          <div className="video-wash" />
          <div className="hero-grid-lines" />
        </div>

        {/* Floating Controls */}
        <div className="hero-slider-controls" aria-label="Hero image slider controls">
          <button
            type="button"
            className="hero-slider-arrow"
            onClick={() => setActiveSlide((activeSlide - 1 + slidesCount) % slidesCount)}
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
            onClick={() => setActiveSlide((activeSlide + 1) % slidesCount)}
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

        {/* Bottom Container */}
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
              width: `${100 / slidesCount}%`,
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