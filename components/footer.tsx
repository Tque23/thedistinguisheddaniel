import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer>
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
          <h4>Quick Links</h4>
          <ul>
            <li><Link href="#about">About Us</Link></li>
            <li><Link href="#programs">Programs</Link></li>
            <li><Link href="#events">Events</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><Link href="#privacy">Privacy Policy</Link></li>
            <li><Link href="#terms">Terms of Service</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Connect</h4>
          <ul>
            <li><Link href="#linkedin">LinkedIn</Link></li>
            <li><Link href="#instagram">Instagram</Link></li>
            <li><Link href="#facebook">Facebook</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} The Distinguished Daniel Network and Institute. All rights reserved.
      </div>
    </footer>
  );
}