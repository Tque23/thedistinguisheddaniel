import "./landing.css"
import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { Footer } from "@/components/footer"
import { FacultySection } from "@/components/board"
import { TimeMachineRolodex } from "@/components/time-machine-rolodex"
import { PhilosophySection } from "@/components/philosophy-section";
import { FeaturedProductsSection } from "@/components/featured-products-section";

export default function Page() {
  return (
    <div className="tdd">
      <Navigation />
      <Hero />
      <div className="separator-set-1 separator-base">
        <div className="separator-line line-top"></div>
        <div className="separator-line line-bottom"></div>
      </div>
      <FacultySection />
      <TimeMachineRolodex />
      <div className="separator-set-2 separator-base">
        <div className="separator-line line-top"></div>
        <div className="separator-line line-bottom"></div>
      </div>
      <PhilosophySection />
      <FeaturedProductsSection />
      <Footer />
    </div>
  )
}
