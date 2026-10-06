import Link from "next/link"
import { ArrowUpRight, Mail, MapPin } from "lucide-react"
import "../about/about.css"

export const metadata = { title: "Contact | The Distinguished Daniel Network & Institute", description: "Connect with The Distinguished Daniel Network & Institute." }

export default function ContactPage() {
  return (
    <main className="about-page min-h-screen">
      <section className="about-hero" aria-labelledby="contact-title">
        <div className="about-hero-inner">
          <p className="about-kicker"><span /> Get in touch</p>
          <h1 id="contact-title">Let&apos;s start a <em>conversation.</em></h1>
          <p className="about-lead">Whether you are ready to join, partner, serve or simply learn more, our team would love to hear from you.</p>
        </div>
      </section>
      <section className="section-px about-story">
        <div className="about-story-grid">
          <div><p className="about-section-label"><span>01</span><span className="label-line" /><span>Contact the team</span></p><h2>Make the next move <em>purposeful.</em></h2></div>
          <div className="about-copy"><p>Send us a note and tell us where you would like to begin. We will respond with the right next step.</p><div className="mt-10 grid gap-5"><a className="text-link" href="mailto:hello@distinguisheddaniel.com"><Mail aria-hidden="true" /> hello@distinguisheddaniel.com <ArrowUpRight aria-hidden="true" /></a><p className="text-link"><MapPin aria-hidden="true" /> Johannesburg, South Africa</p></div></div>
        </div>
      </section>
      <section className="about-cta section-px"><div><p className="about-kicker">Ready when you are</p><h2>Join the <em>conversation.</em></h2></div><Link className="about-cta-link" href="/auth?mode=signup">Sign up <ArrowUpRight aria-hidden="true" /></Link></section>
    </main>
  )
}
