"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "The Network", href: "/network" },
  { name: "The Institute", href: "/institute" },
  { name: "Events & Resources", href: "/events" },
  { name: "Get Involved", href: "/get-involved" },
  { name: "Contact", href: "/contact" },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [announcement, setAnnouncement] = useState("We have launched. Don't miss your spot.")

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
            {announcement}
          </p>
          <a
            href="/auth?mode=signup"
            className="rounded-full bg-gradient-to-r from-[#c89b3c] to-[#f3d27a] px-3 py-1 text-xs font-semibold text-[#1a1200] transition-opacity hover:opacity-90"
          >
            Sign up now
          </a>
        </div>
      </div>

      {/* 2. Mobile Blurred Background with Bottom Gradient Fade */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-32 pointer-events-none z-30 bg-[#071520]/80 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"
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
              ? "bg-[#071520]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg max-w-[1200px]"
              : "bg-transparent max-w-[1400px]"
          }`}
        >
          <div
            className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
              isScrolled ? "h-14" : "h-20"
            }`}
          >
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group z-10">
              <span className="flex items-center transition-all duration-500">
                <Image
                  src="/logos/TDD Network Logo Line Full.svg"
                  alt="TDD Network"
                  width={99}
                  height={32}
                  priority
                  className={`w-auto object-contain transition-all duration-500 ${
                    isScrolled ? "h-7" : "h-8"
                  }`}
                />
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center gap-9">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm transition-colors duration-300 relative group text-white/70 hover:text-white"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden xl:flex items-center gap-4">
              <a
                href="/auth"
                className={`transition-all duration-500 text-white/70 hover:text-white ${
                  isScrolled ? "text-xs" : "text-sm"
                }`}
              >
                Login
              </a>
              <a
                href="/auth?mode=signup"
                className={`btn-primary inline-flex items-center justify-center rounded-full font-semibold transition-all duration-500 ${
                  isScrolled ? "h-8 px-4 text-xs" : "px-6 py-2"
                }`}
              >
                Sign Up
              </a>
            </div>

            {/* Mobile Menu Toggle Button (z-[80] ensures top-level interactivity) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="xl:hidden relative z-[80] p-2 cursor-pointer transition-colors duration-500 text-white"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* 4. Full-Screen Mobile Menu Overlay (Moved to top level fragment at z-[50]) */}
      <div
        id="mobile-menu"
        aria-hidden={!isMobileMenuOpen}
        className={`xl:hidden fixed inset-0 bg-[#071520] z-[50] overflow-y-auto overscroll-contain transition-opacity duration-500 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto visible"
            : "opacity-0 pointer-events-none invisible"
        }`}
      >
        <div className="flex min-h-full flex-col px-8 pt-36 sm:pt-32">
          {/* Navigation Links */}
          <div className="flex flex-1 flex-col justify-center gap-4 py-6 sm:gap-5">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-trajan text-[clamp(1.5rem,min(6.5vw,4.6vh),2.75rem)] leading-tight text-white hover:text-[#f3d27a] transition-all duration-500 ${
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
            className={`sticky bottom-0 -mx-8 flex gap-4 border-t border-white/10 bg-[#071520] px-8 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] transition-all duration-500 ${
              isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: isMobileMenuOpen ? "300ms" : "0ms" }}
          >
            <a
              href="/auth"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-white/20 bg-transparent px-4 text-base text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login
            </a>
            <a
              href="/auth?mode=signup"
              className="btn-primary inline-flex h-12 flex-1 items-center justify-center rounded-full px-4 text-base font-semibold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
