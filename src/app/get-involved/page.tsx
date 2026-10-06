import "../landing.css"
import "../about/about.css"
import "./get-involved.css"
import { ArrowDown, ArrowUpRight, HandHeart, Layers3, Network, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const pathways = [
  {
    number: "01",
    title: "Join the Network",
    description: "Register your interest in connecting with believers across fields and exploring purposeful collaboration.",
    detail: "Share your profession, sector and interests so that we can understand how you hope to participate and contribute.",
    action: "Join the Network",
    icon: Network,
  },
  {
    number: "02",
    title: "Learn with the Institute",
    description: "Express interest in future programmes, seminars and gatherings that connect godly instruction with practical preparation.",
    detail: "Stay close to the learning opportunities being shaped for this growing community.",
    action: "Explore Learning Opportunities",
    icon: Layers3,
  },
  {
    number: "03",
    title: "Explore a Partnership",
    description: "If your organisation shares our commitment to equipping believers and developing purposeful leadership, contact us to discuss a potential collaboration.",
    detail: "We welcome conversations about learning, knowledge exchange and initiatives that support the DDNI vision.",
    action: "Send Partnership Enquiry",
    icon: HandHeart,
  },
  {
    number: "04",
    title: "Offer Your Skills",
    description: "If you would like to contribute your professional skills, experience or time, tell us how you hope to serve.",
    detail: "Our team will respond with any relevant opportunities.",
    action: "Express Interest in Serving",
    icon: Sparkles,
  },
]

export default function GetInvolvedPage() {
  return (
    <div className="tdd about-page institute-page involvement-page">
      <Navigation />
      <main>
        <section className="involvement-hero">
          <div className="involvement-hero-inner">
            <p className="about-kicker">Get Involved <span /></p>
            <h1>Bring your talents.<br /><em>Grow your capacity.</em></h1>
            <p className="about-lead">Contribute to the vision.</p>
            <a className="about-scroll" href="#pathways">Find your pathway <ArrowDown aria-hidden="true" /></a>
          </div>
          <div className="involvement-stamp" aria-hidden="true"><span>DDNI</span><strong>JOIN</strong></div>
        </section>

        <section id="pathways" className="involvement-intro section-px">
          <div className="about-section-label"><span>01</span><span className="label-line" /><span>Begin your journey</span></div>
          <div className="involvement-intro-grid">
            <h2>There are many ways<br /><em>to begin.</em></h2>
            <p className="about-copy">The DDNI is a growing community of believers who want to learn, serve and build with purpose. Choose the pathway that best reflects how you would like to participate.</p>
          </div>
        </section>

        <section className="involvement-pathways section-px">
          <div className="about-section-label light"><span>02</span><span className="label-line" /><span>Choose your pathway</span></div>
          <div className="involvement-grid">
            {pathways.map(({ number, title, description, detail, action, icon: Icon }) => (
              <article className="involvement-card" key={title}>
                <div className="involvement-card-top"><span>{number}</span><Icon aria-hidden="true" /></div>
                <h3>{title}</h3>
                <p>{description}</p>
                <p className="involvement-detail">{detail}</p>
                <a href="/#contact">{action}<ArrowUpRight aria-hidden="true" /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="about-cta involvement-cta section-px">
          <div><p className="about-kicker">The next step</p><h2>Your contribution<br /><em>matters.</em></h2><p className="institute-cta-copy">Tell us where you would like to begin, and we will help you find the right way to connect.</p></div>
          <a className="about-cta-link" href="/#contact">Start a conversation <ArrowUpRight aria-hidden="true" /></a>
        </section>
      </main>
      <Footer />
    </div>
  )
}
