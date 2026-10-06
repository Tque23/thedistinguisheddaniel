import "../landing.css"
import "../about/about.css"
import "./network.css"
import { ArrowDown, ArrowUpRight, BriefcaseBusiness, Handshake, Lightbulb, Network, Users } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const enablements = [
  ["Purposeful relationships", "Connections between believers who share interests, values and a desire to contribute.", Users],
  ["Knowledge exchange", "Opportunities to share experience, insights and practical understanding across disciplines.", Lightbulb],
  ["Collaboration", "Relationships through which complementary skills can support shared initiatives.", Handshake],
  ["Enterprise and stewardship", "Conversations and potential partnerships that encourage responsible wealth creation and meaningful impact.", BriefcaseBusiness],
]

export default function NetworkPage() {
  return (
    <div className="tdd about-page network-page">
      <Navigation />
      <main>
        <section className="network-hero">
          <div className="network-hero-grid" aria-hidden="true" />
          <div className="network-hero-inner">
            <p className="about-kicker">The DDNI Network <span /> A community of Kingdom pioneers</p>
            <h1>Purposeful<br /><em>connections.</em></h1>
            <p className="about-lead">The DDNI Network connects believers across disciplines, industries and nations to explore what becomes possible through purposeful relationships.</p>
            <a className="about-scroll" href="#why-connect">Explore the Network <ArrowDown aria-hidden="true" /></a>
          </div>
          <div className="network-hero-symbol" aria-hidden="true"><Network /><span>CONNECT<br />CONTRIBUTE<br />CREATE</span></div>
        </section>

        <section id="why-connect" className="network-intro section-px">
          <div className="about-section-label"><span>01</span><span className="label-line" /><span>Why connect?</span></div>
          <div className="network-intro-grid">
            <div><h2>What becomes possible<br /><em>when we connect.</em></h2><div className="network-rule" /></div>
            <div className="about-copy"><p>The Network is envisioned as a central community and database through which professionals, entrepreneurs, creatives and emerging leaders can identify shared interests, complementary skills and opportunities to work together.</p><p>Your knowledge, experience and gifts can contribute to someone else&apos;s progress. Their insight and capacity may also strengthen your journey.</p><p>We create opportunities for members to exchange knowledge, discover potential partnerships, explore enterprise opportunities and contribute to shared growth.</p></div>
          </div>
        </section>

        <section className="network-enable">
          <div className="network-enable-inner section-px">
            <div className="about-section-label light"><span>02</span><span className="label-line" /><span>What we seek to enable</span></div>
            <div className="network-enable-heading"><h2>A network built<br /><em>for contribution.</em></h2><p>Collaboration grounded in biblical principles and responsible stewardship.</p></div>
            <div className="network-cards">{enablements.map(([title, description, Icon], index) => <article className="network-card" key={title as string}><span className="direction-number">{String(index + 1).padStart(2, "0")}</span><Icon aria-hidden="true" /><h3>{title as string}</h3><p>{description as string}</p></article>)}</div>
          </div>
        </section>

        <section className="network-audience section-px">
          <div className="about-section-label"><span>03</span><span className="label-line" /><span>Who is it for?</span></div>
          <div className="network-audience-grid"><h2>A place for every<br /><em>stage of the journey.</em></h2><div className="about-copy"><p>The Network welcomes believers at different stages of their journey, including professionals, entrepreneurs, creatives, students, emerging leaders and people serving in government, education, ministry and community development.</p><a className="text-link" href="/#contact">Register your interest <ArrowUpRight aria-hidden="true" /></a></div></div>
        </section>

        <section className="about-cta network-cta section-px"><div><p className="about-kicker">Your next connection</p><h2>There is room<br /><em>for your contribution.</em></h2></div><a className="about-cta-link" href="/#contact">Register to be part of the Network <ArrowUpRight aria-hidden="true" /></a></section>
      </main>
      <Footer />
    </div>
  )
}
