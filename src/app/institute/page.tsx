import "../landing.css"
import "../about/about.css"
import "./institute.css"
import { ArrowDown, ArrowUpRight, BookOpen, Compass, Crown, Gem, Users } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const learningAreas = [
  ["Purpose & calling", "Understanding purpose, calling and responsibility.", Compass],
  ["Biblical foundations", "Foundations for influence across society.", BookOpen],
  ["Leadership & service", "Leadership, governance and service.", Crown],
  ["Enterprise & stewardship", "Enterprise, wealth creation and stewardship.", Gem],
]

export default function InstitutePage() {
  return (
    <div className="tdd about-page institute-page">
      <Navigation />
      <main>
        <section className="institute-hero">
          <div className="institute-orbit institute-orbit-one" aria-hidden="true" />
          <div className="institute-orbit institute-orbit-two" aria-hidden="true" />
          <div className="institute-hero-inner">
            <p className="about-kicker">The DDNI Institute <span /> A school of the Spirit</p>
            <h1>A place of<br /><em>preparation.</em></h1>
            <p className="about-lead">The DDNI Institute equips believers to understand God&apos;s ways and apply His wisdom in the responsibilities of everyday life and leadership.</p>
            <a className="about-scroll" href="#approach">Discover the Institute <ArrowDown aria-hidden="true" /></a>
          </div>
          <div className="institute-verse" aria-hidden="true"><span>Micah</span><strong>4:1–2</strong></div>
        </section>

        <section id="approach" className="institute-intro section-px">
          <div className="about-section-label"><span>01</span><span className="label-line" /><span>Our approach</span></div>
          <div className="institute-intro-grid">
            <div><h2>Spiritual understanding<br /><em>made practical.</em></h2><div className="institute-rule" /></div>
            <div className="about-copy"><p>Inspired by Micah 4:1–2, the Institute seeks to distil godly knowledge into instruction that develops character, strengthens understanding and prepares believers for practical contribution.</p><p>Spiritual understanding and practical preparation belong together. Biblical teaching should find expression in how we make decisions, carry responsibility, build relationships and serve others.</p><p>We connect the wisdom of Scripture with the realities of leadership, enterprise, public service and creative work.</p></div>
          </div>
        </section>

        <section className="institute-learning">
          <div className="section-px">
            <div className="about-section-label light"><span>02</span><span className="label-line" /><span>Areas of learning</span></div>
            <div className="institute-learning-heading"><h2>Grow in wisdom.<br /><em>Prepare to serve.</em></h2><p>Future learning opportunities will be shaped around the formation of character, capacity and contribution.</p></div>
            <div className="institute-cards">{learningAreas.map(([title, description, Icon], index) => <article className="institute-card" key={title as string}><span className="direction-number">{String(index + 1).padStart(2, "0")}</span><Icon aria-hidden="true" /><h3>{title as string}</h3><p>{description as string}</p></article>)}</div>
            <p className="institute-more">Also exploring excellence, integrity, disciplined preparation, Kingdom principles in professional and creative work, and the Church&apos;s responsibility in the times.</p>
          </div>
        </section>

        <section className="institute-format section-px">
          <div className="about-section-label"><span>03</span><span className="label-line" /><span>How learning will take place</span></div>
          <div className="institute-format-grid"><h2>Learning that<br /><em>meets you there.</em></h2><div className="about-copy"><p>The Institute&apos;s vision includes online and in-person courses, seminars, camps and other gatherings.</p><p>Programme topics, facilitators, schedules, participation requirements and any fees will be published as they are confirmed.</p><a className="text-link" href="#interest">Stay informed <ArrowUpRight aria-hidden="true" /></a></div></div>
        </section>

        <section id="interest" className="about-cta institute-cta section-px"><div><p className="about-kicker">Express your interest</p><h2>Prepare for<br /><em>greater responsibility.</em></h2><p className="institute-cta-copy">Whether you are beginning your career, building an enterprise or already serving in leadership, the Institute&apos;s vision is to support purposeful growth and distinguished service.</p></div><a className="about-cta-link" href="/contact">Register your interest <ArrowUpRight aria-hidden="true" /></a></section>
      </main>
      <Footer />
    </div>
  )
}
