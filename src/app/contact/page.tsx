import { ArrowUpRight, Phone } from "lucide-react"
import "../landing.css"
import "../about/about.css"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PageHeroVideo } from "@/components/page-hero-video"

export const metadata = { title: "Contact | The Distinguished Daniel Network & Institute", description: "Connect with The Distinguished Daniel Network & Institute." }

export default function ContactPage() {
  return (
    <div className="tdd about-page">
      <Navigation />
      <main>
        <section className="about-hero" aria-labelledby="contact-title">
          <PageHeroVideo />
          <div className="about-hero-inner">
            <p className="about-kicker"><span /> Contact</p>
            <h1 id="contact-title">Let&apos;s <em>Connect</em></h1>
            <p className="about-lead">We welcome enquiries about the DDNI Network, Institute programmes, gatherings and partnership opportunities.</p>
          </div>
        </section>
        <section className="section-px about-story">
          <div className="about-story-grid">
            <div><p className="about-section-label"><span>01</span><span className="label-line" /><span>Get in touch</span></p><h2>We look forward to <em>hearing from you.</em></h2></div>
            <div className="about-copy">
              <p>Tell us what you would like to know or how you hope to get involved. We look forward to hearing from you.</p>
              <div className="mt-10 grid gap-3">
                <p className="about-section-label" style={{ margin: 0 }}><span>Telephone / WhatsApp</span></p>
                <a className="text-link" style={{ marginTop: 0 }} href="tel:+27832506306"><Phone aria-hidden="true" /> +27 83 250 6306 <ArrowUpRight aria-hidden="true" /></a>
                <p style={{ margin: 0 }}>Wiseman Mavundla (Network Coordinator)</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
