"use client";

import React from 'react';
import Image from 'next/image';
import { useScrollSlider } from '@/components/use-scroll-slider';
import { SliderControls } from '@/components/slider-controls';

interface FacultyMember {
  id: number;
  name: string;
  bio: string;
  image: string | null;
  profileUrl: string;
  position: string;
}

const facultyData: FacultyMember[] = [
  {
    id: 1,
    name: "Apostle K. Zungu",
    bio: "",
    image: "/board/Apostle.JPG",
    profileUrl: "#",
    position: "Founder & President",
  },
  {
    id: 2,
    name: "Thobeka Mbhele",
    bio: "",
    image: "/board/Thobeka.JPG",
    profileUrl: "#",
    position: "Committee Member",
  },
  {
    id: 3,
    name: "Ntando Ngaleka",
    bio: "",
    image: "/board/Ntando.JPG",
    profileUrl: "#",
    position: "Committee Member",
  },
  {
    id: 4,
    name: "Busisiwe Majola",
    bio: "",
    image: "/board/member-bg.JPG",
    profileUrl: "#",
    position: "Committee Member",
  },
  {
    id: 5,
    name: "Dineo Mamorobela",
    bio: "",
    image: "/board/member-bg.JPG",
    profileUrl: "#",
    position: "Committee Member",
  },
  {
    id: 6,
    name: "Kwanele Ntuli",
    bio: "",
    image: "/board/Kwanele.JPG",
    profileUrl: "#",
    position: "Committee Member",
  },
  {
    id: 7,
    name: "Wiseman Mavundla",
    bio: "",
    image: "/board/Wise.JPG",
    profileUrl: "#",
    position: "Committee Member",
  },
    {
    id: 8,
    name: "Bulela Njemla",
    bio: "",
    image: "/board/Bulela.JPG",
    profileUrl: "#",
    position: "Committee Member",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export function FacultySection() {
  const slider = useScrollSlider(facultyData.length);

  return (
    <section
      aria-labelledby="committee-title"
      className="relative overflow-hidden bg-[var(--background)] py-20 md:py-28 section-px font-sans text-[#172b3a]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#c89b3c]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Crest sits above the heading on mobile, beside it from md up */}
        <header className="mb-12 flex flex-col items-start gap-8 md:mb-16 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#c89b3c]/50 bg-white/60 shadow-sm md:hidden">
              <Image src="/TDDCrest.svg" alt="TDD Crest" width={36} height={36} className="h-9 w-9 object-contain" />
            </div>
            <p className="mb-4 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#7a6541]">
              <span className="h-px w-8 bg-[#c89b3c]" aria-hidden="true" />
              The Pioneers
            </p>
            <h2
              id="committee-title"
              className="font-serif text-4xl font-normal leading-[1.05] tracking-tight text-[#172b3a] md:text-6xl"
            >
              Meet our <em className="not-italic text-[#c89b3c]">Committee.</em>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#4a5a68] md:text-lg">
              Our committee comprises of distinguished marketplace professionals and leaders who have years of experience in advancing God's agenda in the twelve gates of society.
            </p>
          </div>

          <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[#c89b3c]/50 bg-white/60 shadow-sm md:flex">
            <Image src="/TDDCrest.svg" alt="TDD Crest" width={56} height={56} className="h-14 w-14 object-contain" />
          </div>
        </header>

        <div
          ref={slider.ref}
          onKeyDown={slider.onKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Committee members"
          className="-mx-[var(--section-px)] flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth px-[var(--section-px)] pb-8 pt-2 scroll-px-[var(--section-px)] [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden focus-visible:outline-none"
        >
          {facultyData.map((member, index) => (
            <article
              key={member.id}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${facultyData.length}: ${member.name}`}
              className="group relative h-[460px] w-[78vw] flex-none snap-start overflow-hidden rounded-3xl bg-[#172b3a] shadow-[0_10px_30px_-12px_rgba(23,43,58,0.35)] ring-1 ring-[#172b3a]/10 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-16px_rgba(23,43,58,0.5)] sm:w-[300px] lg:w-[260px]"
            >
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="(max-width: 640px) 78vw, 300px"
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#223b4e] to-[#0f1f2b]" aria-hidden="true">
                  <span className="font-serif text-6xl tracking-wider text-[#c89b3c]/80">{initials(member.name)}</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1727]/90 via-[#0b1727]/10 to-transparent" aria-hidden="true" />

              <span className="absolute left-5 top-5 font-serif text-sm tracking-[0.2em] text-white/80">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-colors duration-500 group-hover:bg-white/20">
                <span className="mb-2 block h-0.5 w-8 bg-[#c89b3c] transition-all duration-500 group-hover:w-14" aria-hidden="true" />
                <h3 className="font-serif text-xl font-normal leading-tight text-white">{member.name}</h3>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-white/70">{member.position}</p>
              </div>
            </article>
          ))}
        </div>

        <SliderControls
          label="committee members"
          pages={slider.pages}
          activePage={slider.activePage}
          canPrev={slider.canPrev}
          canNext={slider.canNext}
          onPrev={slider.prev}
          onNext={slider.next}
          onPage={slider.scrollToPage}
        />
      </div>
    </section>
  );
}
