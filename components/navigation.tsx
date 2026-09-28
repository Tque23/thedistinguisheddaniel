"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const navLinks = [
  { name: "Home", href: "#" },
  { name: "Blog", href: "#blog" },
  { name: "Directory", href: "#directory" },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* 1. Floating announcement bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-[#970024] text-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center">
          <p className="text-xs font-medium sm:text-sm">
            The launch is right around the corner. Don&apos;t miss your spot.
          </p>
          <a
            href="/#Earlyaccess"
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-white/90"
          >
            Sign up now
          </a>
        </div>
      </div>

      {/* 2. Mobile Blurred Background with Bottom Gradient Fade */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-32 pointer-events-none z-30 bg-background/80 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"
      />

      {/* 3. Navigation Header (z-[70] keeps it above announcement bar) */}
      <header
        className={`fixed z-[70] transition-all duration-500 ${
          isScrolled
            ? "top-16 left-4 right-4 sm:top-14"
            : "top-14 left-0 right-0 sm:top-10"
        }`}
      >
        <nav
          className={`mx-auto transition-all duration-500 ${
            isScrolled || isMobileMenuOpen
              ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg max-w-[1200px]"
              : "bg-transparent max-w-[1400px]"
          }`}
        >
          <div
            className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
              isScrolled ? "h-14" : "h-20"
            }`}
          >
            {/* Logo */}
            <a href="#" className="flex items-center gap-2 group z-10">
              <span className="flex items-center transition-all duration-500">
                <img
                  src="/logos/TDD Network Logo Line Full.svg"
                  alt="TDD Network"
                  className={`w-auto object-contain transition-all duration-500 ${
                    isScrolled ? "h-7" : "h-8"
                  }`}
                />
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-12">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`text-sm transition-colors duration-300 relative group ${
                    isScrolled
                      ? "text-foreground/70 hover:text-foreground"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${
                      isScrolled ? "bg-foreground" : "bg-white"
                    }`}
                  />
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="#"
                className={`transition-all duration-500 ${
                  isScrolled
                    ? "text-xs text-foreground/70 hover:text-foreground"
                    : "text-sm text-white/70 hover:text-white"
                }`}
              >
                Login
              </a>
              <Button
                size="sm"
                className={`btn-primary rounded-full transition-all duration-500 ${
                  isScrolled ? "px-4 h-8 text-xs" : "px-6"
                }`}
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile Menu Toggle Button (z-[80] ensures top-level interactivity) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className={`md:hidden relative z-[80] p-2 cursor-pointer transition-colors duration-500 ${
                isScrolled || isMobileMenuOpen ? "text-foreground" : "text-white"
              }`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* 4. Full-Screen Mobile Menu Overlay (Moved to top level fragment at z-[50]) */}
      <div
        className={`md:hidden fixed inset-0 bg-background z-[50] transition-all duration-500 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-full px-8 pt-32 pb-8">
          {/* Navigation Links */}
          <div className="flex-1 flex flex-col justify-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-5xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 ${
                  isMobileMenuOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 75}ms` : "0ms" }}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Bottom CTAs */}
          <div
            className={`flex gap-4 pt-8 border-t border-foreground/10 transition-all duration-500 ${
              isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: isMobileMenuOpen ? "300ms" : "0ms" }}
          >
            <Button
              variant="outline"
              className="flex-1 rounded-full h-14 text-base"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login
            </Button>
            <Button
              className="flex-1 btn-primary rounded-full h-14 text-base"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}