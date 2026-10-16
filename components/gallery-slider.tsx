"use client"

import Image from "next/image"
import { useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

const pillars = [
  {
    number: "01",
    title: "Brand Identity",
    included: "Logo, Business Cards, Letterheads, Presentation Templates",
    ideal: "Establishing or refreshing corporate identity",
    goal: "A clear, consistent identity that earns recognition.",
    image: "/gallery/DSC_5054.jpg",
  },
  {
    number: "02",
    title: "Print & Event Design",
    included: "Posters, Event Banners, Signage, Promotional Assets",
    ideal: "Offline marketing, trade shows, and campaigns",
    goal: "Physical touchpoints that make every moment count.",
    image: "/gallery/DSC_5522.jpg",
  },
  {
    number: "03",
    title: "Web & Digital",
    included: "Website Design & Build, Digital Banners, Interactive UI",
    ideal: "Building an online presence and driving conversions",
    goal: "Digital experiences designed to move people to action.",
    image: "/gallery/DSC_5553.jpg",
  },
]

export function GallerySlider() {
  const [active, setActive] = useState(0)
  const current = pillars[active]
  const move = (direction: number) => setActive((value) => (value + direction + pillars.length) % pillars.length)

  return (
    <section className="home-gallery section-px" aria-labelledby="gallery-title">
      <div className="home-gallery-heading">
        <div>
          <p className="home-gallery-kicker">What we make</p>
          <h2 id="gallery-title">Design with <em>direction.</em></h2>
        </div>
        <p className="home-gallery-intro">From the first mark to the final interaction, we build the pieces that help ambitious organisations show up with purpose.</p>
      </div>
      <div className="home-gallery-feature">
        <div className="home-gallery-frame">
          <Image src={current.image} alt={`${current.title} project example`} fill priority sizes="(max-width: 768px) 100vw, 56vw" className="home-gallery-image" />
          <div className="home-gallery-overlay" aria-hidden="true" />
          <span className="home-gallery-index">{current.number} / 03</span>
        </div>
        <div className="home-gallery-copy">
          <p className="home-gallery-label">Ideal client</p>
          <p className="home-gallery-ideal">{current.ideal}</p>
          <p className="home-gallery-label">Included services</p>
          <p>{current.included}</p>
          <p className="home-gallery-goal">{current.goal}</p>
        </div>
      </div>
      <div className="home-gallery-tabs" role="tablist" aria-label="Service pillars">
        {pillars.map((pillar, index) => (
          <button key={pillar.title} type="button" role="tab" aria-selected={active === index} onClick={() => setActive(index)} className={active === index ? "is-active" : ""}>
            <span>{pillar.number}</span><strong>{pillar.title}</strong><ArrowRight aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="home-gallery-controls"><button type="button" onClick={() => move(-1)} aria-label="Previous service"><ArrowLeft aria-hidden="true" /></button><button type="button" onClick={() => move(1)} aria-label="Next service"><ArrowRight aria-hidden="true" /></button></div>
    </section>
  )
}

export default GallerySlider
