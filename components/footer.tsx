import Link from "next/link";
import Image from "next/image";

const faqs = [
  {
    question: "What is DDNI?",
    answer:
      "The Distinguished Daniel Network & Institute is an apostolic hub that trains, equips and connects believers for purposeful leadership and influence across society.",
  },
  {
    question: "What is the difference between the Network and the Institute?",
    answer:
      "The Network focuses on relationships, collaboration and potential opportunities across disciplines. The Institute focuses on instruction, spiritual formation and preparation for leadership and service.",
  },
  {
    question: "What scriptures underpin DDNI?",
    answer:
      "Daniel 6:3 and Micah 4:1–2 underpin our emphasis on excellence, distinction and godly instruction.",
  },
  {
    question: "Do I need to own a business to express interest?",
    answer:
      "No. DDNI’s vision includes professionals, creatives, students, emerging leaders and believers serving across different sectors.",
  },
  {
    question: "Will learning be online or in person?",
    answer:
      "The Institute’s vision includes both formats. Each confirmed programme will explain how it will be delivered.",
  },
  {
    question: "Are programmes currently open for enrolment?",
    answer:
      "Confirmed opportunities will be published on the Institute and Events pages.",
  },
  {
    question: "Are there membership or programme fees?",
    answer:
      "Membership is free. Any fees associated with programmes will be shared with the relevant confirmed opportunity or course.",
  },
  {
    question: "How can I get involved?",
    answer:
      "Join the Network, request programme updates or contact the team about partnership and service opportunities.",
  },
]

export function Footer() {
  return (
    <footer>
      <section className="faq-section" aria-labelledby="faq-heading">
        <div className="faq-heading">
          <p className="eyebrow">Need to know</p>
          <h2 id="faq-heading">Frequently Asked Questions</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details className="faq-item" key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="footer-container">
        <div className="footer-section brand-section">
          <Image
            src="/logos/logoline.webp"
            alt="The Distinguished Daniel Logo"
            width={168}
            height={42}
            className="footer-logo"
            priority={false}
          />
          <p>Elevating standards and building networks of excellence.</p>
        </div>

        <div className="footer-section">
          <h2>Quick Links</h2>
          <ul>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="#programs">Programs</Link></li>
            <li><Link href="#events">Events</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h2>Legal</h2>
          <ul>
            <li><Link href="#privacy">Privacy Policy</Link></li>
            <li><Link href="#terms">Terms of Service</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h2>Contact</h2>
          <ul><li><Link href="/contact">Contact the team</Link></li></ul>
        </div>
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} The Distinguished Daniel Network and Institute. All rights reserved.
      </div>
    </footer>
  );
}
