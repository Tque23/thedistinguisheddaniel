"use client";

import { useEffect, useRef, useState } from "react";
import { NewsletterForm } from "@/components/newsletter-form";

const titles = [
  "Sustainable Architecture.",
  "Built for Tomorrow.",
  "Eco-Responsible.",
];

const description =
  "A design home that combines contemporary aesthetics and energy performance. Built with eco-friendly materials, it minimizes carbon footprint while offering optimal comfort.";

const words = description.split(" ");

// Portion of the pinned scroll spent rotating titles; the rest reveals the words.
const TITLE_PHASE = 0.45;

export function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number | null = null;

    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      const next = scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 1;
      setProgress(next);
    };

    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const titleProgress = Math.min(1, progress / TITLE_PHASE);
  const wordProgress = Math.max(0, (progress - TITLE_PHASE) / (1 - TITLE_PHASE));
  const segmentSize = 1 / titles.length;

  return (
    <section id="products" className="bg-[#071520] text-white">
      {/* Tall scroll track; the inner sticky panel pins the page while content animates */}
      <div ref={sectionRef} className="relative" style={{ height: "400vh" }}>
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
          <div className="flex w-full max-w-7xl flex-col items-center gap-10 section-px md:gap-14">
            <div className="w-full" style={{ perspective: "1000px" }}>
              <div
                className="relative w-full"
                style={{ transformStyle: "preserve-3d", minHeight: "clamp(80px, 12vw, 150px)" }}
              >
                {titles.map((title, index) => {
                  const isLast = index === titles.length - 1;
                  const start = index * segmentSize;
                  const end = (index + 1) * segmentSize;

                  let rotateX = 90;
                  let opacity = 0;

                  if (titleProgress >= start && titleProgress < end) {
                    const local = (titleProgress - start) / segmentSize;
                    rotateX = (1 - local) * 90;
                    opacity = local;
                  } else if (titleProgress >= end) {
                    rotateX = isLast ? 0 : -90;
                    opacity = isLast ? 1 : 0;
                  }

                  return (
                    <h2
                      key={title}
                      aria-hidden={opacity < 0.5}
                      className="pointer-events-none absolute inset-0 flex items-center justify-center text-center font-serif text-[9vw] font-normal leading-tight tracking-tight text-white sm:text-[7vw] md:text-[6vw] lg:text-[5vw]"
                      style={{
                        transform: `rotateX(${rotateX}deg) translateZ(0)`,
                        opacity,
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        willChange: "transform, opacity",
                      }}
                    >
                      {title}
                    </h2>
                  );
                })}
              </div>
            </div>

            <p className="max-w-4xl text-center text-xl leading-relaxed text-white/80 md:text-3xl">
              {words.map((word, index) => {
                const p = Math.max(0, Math.min(1, wordProgress * words.length - index));
                return (
                  <span
                    key={index}
                    style={{
                      opacity: 0.08 + p * 0.92,
                      filter: `blur(${(1 - p) * 12}px)`,
                      transition: "opacity 0.2s ease, filter 0.2s ease",
                    }}
                  >
                    {word}
                    {index < words.length - 1 ? " " : ""}
                  </span>
                );
              })}
            </p>
          </div>
        </div>
      </div>

      <NewsletterForm />
    </section>
  );
}
