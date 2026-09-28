import "./landing.css"
import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { Footer } from "@/components/footer"
import { FacultySection } from "@/components/board"

export default function Page() {
  return (
    <div className="tdd">
      <Navigation />
      <Hero />
      <div className="tdd-body">
        {/* <div className="bg-shape-1" aria-hidden="true" /> */}
        <div className="bg-shape-2" aria-hidden="true" />
      </div>
      <FacultySection />
       <Footer />
    </div>
  )
}
