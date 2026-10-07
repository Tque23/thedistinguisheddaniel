"use client"

import Image from "next/image"
import { useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

const images = [
  "/gallery/DSC_5054.jpg",
  "/gallery/DSC_5065.jpg",
  "/gallery/DSC_5522.jpg",
  "/gallery/DSC_5536.jpg",
  "/gallery/DSC_5550.jpg",
  "/gallery/DSC_5552.jpg",
  "/gallery/DSC_5553.jpg",
  "/gallery/DSC_5554.jpg",
]

export function GallerySlider() {
  const [active, setActive] = useState(0)
  const move = (direction: number) => setActive((current) => (current + direction + images.length) % images.length)

  return (
    <section className="home-gallery section-px" aria-labelledby="gallery-title">
      <div className="home-gallery-heading">
        <div>
          <p className="home-gallery-kicker">DDNI in motion</p>
          <h2 id="gallery-title">Moments of <em>purpose.</em></h2>
        </div>
        <div className="home-gallery-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous gallery image"><ArrowLeft aria-hidden="true" /></button>
          <span>{String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => move(1)} aria-label="Next gallery image"><ArrowRight aria-hidden="true" /></button>
        </div>
      </div>
      <div className="home-gallery-frame">
        <Image src={images[active]} alt={`DDNI gallery moment ${active + 1}`} fill priority sizes="(max-width: 768px) 100vw, 90vw" className="home-gallery-image" />
        <div className="home-gallery-overlay" aria-hidden="true" />
      </div>
      <div className="home-gallery-thumbs" role="tablist" aria-label="Gallery images">
        {images.map((image, index) => <button key={image} type="button" role="tab" aria-selected={active === index} aria-label={`Show gallery image ${index + 1}`} onClick={() => setActive(index)} className={active === index ? "is-active" : ""}><Image src={image} alt="" fill sizes="80px" /></button>)}
      </div>
    </section>
  )
}

export default GallerySlider
