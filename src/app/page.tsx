import "./landing.css"
import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { Footer } from "@/components/footer"
import { FacultySection } from "@/components/board"
import { GallerySlider } from "@/components/gallery-slider"
import { PhilosophySection } from "@/components/philosophy-section"
import { getFolderImages } from "@/lib/gallery"

export default function Page() {
  // 1. Fetch images specifically for the Hero (e.g. from /public/hero)
  const heroImagePaths = getFolderImages("hero")
  const heroSlides = heroImagePaths.map((src) => ({ src }))

  // 2. Fetch images for the main gallery (e.g. from /public/gallery)
  const mainGalleryImages = getFolderImages("gallery")

  return (
    <div className="tdd">
      <Navigation />
      <main id="main-content">
        {/* Hero now uses images from /public/hero */}
        <Hero heroSlides={heroSlides} />

        <div className="separator-set-1 separator-base">
          <div className="separator-line line-top"></div>
          <div className="separator-line line-bottom"></div>
        </div>

        <FacultySection />

        {/* Gallery slider uses images from /public/gallery */}
        <GallerySlider images={mainGalleryImages} />

        <div className="separator-set-2 separator-base">
          <div className="separator-line line-top"></div>
          <div className="separator-line line-bottom"></div>
        </div>

        <PhilosophySection />
      </main>
      <Footer />
    </div>
  )
}