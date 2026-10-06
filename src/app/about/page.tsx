import "../landing.css"
import "./about.css"
import { ArrowDown, ArrowUpRight, BookOpen, Compass, Handshake, Landmark } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const values = [
  ["Biblical grounding", "We seek to understand and apply God’s Word in our lives and work."],
  ["Excellence", "We cultivate discipline, competence and the commitment to serve well."],
  ["Integrity", "We pursue honesty, accountability and consistency between belief and conduct."],
  ["Wisdom", "We value discernment and the responsible application of knowledge."],
  ["Faithfulness", "We seek to remain obedient to God across changing circumstances."],
  ["Stewardship", "We use our gifts, time, relationships and resources responsibly."],
  ["Collaboration", "We build purposeful relationships that enable shared learning and contribution."],
  ["Service", "We understand influence as a responsibility to serve God and others."],
]

export default function AboutPage() {
  return (
    <div className="tdd about-page">
      <Navigation />
      <main>
        <section className="about-hero">
          <div className="about-hero-orbit" aria-hidden="true" />
          <div className="about-hero-inner">
            <p className="about-kicker">About DDNI <span /> Established for such a time as this</p>
            <h1>A people prepared<br /><em>to make a difference.</em></h1>
            <p className="about-lead">The Distinguished Daniel Network &amp; Institute is an apostolic hub established to train, equip and empower believers in line with God&apos;s End Time mandate.</p>
            <a className="about-scroll" href="#story">Discover our story <ArrowDown aria-hidden="true" /></a>
          </div>
          <div className="about-hero-mark" aria-hidden="true">DDNI<span>✦</span></div>
        </section>

        <section id="story" className="about-story section-px">
          <div className="about-section-label"><span>01</span><span className="label-line" /><span>Our story</span></div>
          <div className="about-story-grid">
            <div>
              <h2>Distinguished by<br /><em>purpose.</em></h2>
              <div className="about-pillar-list">
                <div><Compass aria-hidden="true" /><span>Kingdom identity</span></div>
                <div><Landmark aria-hidden="true" /><span>Societal influence</span></div>
                <div><Handshake aria-hidden="true" /><span>Purposeful collaboration</span></div>
              </div>
            </div>
            <div className="about-copy">
              <p>Our purpose is to prepare believers to become distinguished leaders and pioneers who bring biblical wisdom, excellence and practical solutions into the systems that shape society.</p>
              <p>We believe that God&apos;s calling finds expression across every sphere of influence: government, the economy, media, arts and entertainment, religion, family and education. Believers have a responsibility to develop their gifts and steward their opportunities so that their lives and work reflect God&apos;s will and ways.</p>
              <p>DDNI brings this purpose to life through two interconnected pillars: <strong>the Network</strong> and <strong>the Institute</strong>.</p>
              <a className="text-link" href="/#network">Explore the Network <ArrowUpRight aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section className="about-direction">
          <div className="about-direction-inner section-px">
            <div className="about-section-label light"><span>02</span><span className="label-line" /><span>Our direction</span></div>
            <div className="about-direction-grid">
              <div className="direction-card"><span className="direction-number">01</span><h2>Our<br /><em>vision</em></h2><p>To see believers distinguished as Kingdom pioneers who influence society with excellence, wisdom and integrity, and advance God&apos;s interests across nations and spheres of influence.</p></div>
              <div className="direction-card featured"><span className="direction-number">02</span><h2>Our<br /><em>mission</em></h2><p>To train, equip, connect and empower believers through godly instruction, practical preparation and purposeful collaboration, enabling them to fulfil their calling and contribute to the transformation of society.</p></div>
            </div>
          </div>
        </section>

        <section className="about-values section-px">
          <div className="about-section-label"><span>03</span><span className="label-line" /><span>What guides us</span></div>
          <div className="about-values-heading"><div><BookOpen aria-hidden="true" /><h2>Our values are<br /><em>our compass.</em></h2></div><p>These convictions shape how we learn, lead, collaborate and serve. They keep our pursuit of influence anchored in the character of Christ.</p></div>
          <div className="values-grid">{values.map(([title, description], index) => <article className="value-item" key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        </section>

        <section className="about-gallery section-px" aria-label="DDNI moments">
          {["/Poster.jpg", "/Poster1.jpg", "/Poster2.jpeg", "/poster.jpg"].map((image, index) => (
            <div className="about-gallery-slide" key={image}>
              <img src={image} alt="" aria-hidden="true" />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
          ))}
        </section>

        <section className="about-cta section-px" id="get-involved"><div><p className="about-kicker">The work continues</p><h2>There is a place<br /><em>for your calling.</em></h2></div><a className="about-cta-link" href="/contact">Get involved <ArrowUpRight aria-hidden="true" /></a></section>
      </main>
      <Footer />
    </div>
  )
}
