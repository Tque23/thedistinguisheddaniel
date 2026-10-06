import "../landing.css"
import "../about/about.css"
import "../institute/institute.css"
import "./events.css"
import { ArrowDown, ArrowUpRight, BookOpen, CalendarDays, Download, Library } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const resources = [
  ["Gatherings", "Courses, seminars, camps and other spaces for learning and fellowship.", CalendarDays],
  ["Teaching resources", "Biblical teaching and practical insight for purposeful growth and distinguished service.", BookOpen],
  ["The DDNI library", "A growing collection of material to help believers understand God’s ways and apply His wisdom.", Library],
]

export default function EventsPage() {
  return (
    <div className="tdd about-page institute-page events-page">
      <Navigation />
      <main>
        <section className="events-hero">
          <div className="events-hero-inner">
            <p className="about-kicker">Events <span /> Resources</p>
            <h1>Gather to learn.<br /><em>Go forth to serve.</em></h1>
            <p className="about-lead">Discover the gatherings and resources designed to deepen understanding, develop capacity and prepare believers for greater responsibility.</p>
            <a className="about-scroll" href="#upcoming">Explore what&apos;s ahead <ArrowDown aria-hidden="true" /></a>
          </div>
          <div className="events-mark" aria-hidden="true"><span>DDNI</span><strong>2024</strong></div>
        </section>

        <section id="upcoming" className="events-intro section-px">
          <div className="about-section-label"><span>01</span><span className="label-line" /><span>What&apos;s happening</span></div>
          <div className="events-intro-grid">
            <div><h2>Spaces for<br /><em>purposeful growth.</em></h2><div className="institute-rule" /></div>
            <div className="about-copy"><p>The DDNI creates opportunities for believers to gather, learn and grow in wisdom together.</p><p>Programme topics, facilitators, schedules, participation requirements and any fees will be published as they are confirmed. Register your interest to be the first to hear about upcoming courses, seminars and gatherings.</p></div>
          </div>
        </section>

        <section className="events-resource-band">
          <div className="section-px">
            <div className="about-section-label light"><span>02</span><span className="label-line" /><span>Explore resources</span></div>
            <div className="events-resource-heading"><h2>Learn deeply.<br /><em>Live wisely.</em></h2><p>Resources that connect biblical teaching with the realities of leadership, enterprise, public service and creative work.</p></div>
            <div className="events-resource-grid">{resources.map(([title, description, Icon], index) => <article className="events-resource-card" key={title as string}><span className="direction-number">{String(index + 1).padStart(2, "0")}</span><Icon aria-hidden="true" /><h3>{title as string}</h3><p>{description as string}</p><a href="#interest" aria-label={`Explore ${title as string}`}><Download aria-hidden="true" /></a></article>)}</div>
          </div>
        </section>

        <section id="interest" className="about-cta events-cta section-px"><div><p className="about-kicker">Stay informed</p><h2>Be part of<br /><em>what&apos;s next.</em></h2><p className="institute-cta-copy">Register your interest to receive announcements about DDNI events, Institute programmes and new resources.</p></div><a className="about-cta-link" href="/contact">Register your interest <ArrowUpRight aria-hidden="true" /></a></section>
      </main>
      <Footer />
    </div>
  )
}
