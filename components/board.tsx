"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface FacultyMember {
  id: number;
  name: string;
  bio: string;
  image: string;
  profileUrl: string;
}

const facultyData: FacultyMember[] = [
  {
    id: 1,
    name: "Dr. Stephen R. C. Hicks",
    bio: "An eminent Professor of Philosophy and Senior Scholar at The Atlas Society...",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    profileUrl: "#",
  },
  {
    id: 2,
    name: "Max Lugavere",
    bio: "Acclaimed health and wellness expert, researcher, and filmmaker...",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
    profileUrl: "#",
  },
  {
    id: 3,
    name: "Dr. Heather Heying",
    bio: "Distinguished evolutionary biologist and educator, has conducted extensive research...",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
    profileUrl: "#",
  },
  {
    id: 4,
    name: "Dr. David Eagleman",
    bio: "Celebrated neuroscientist and New York Times bestselling author, known for his groundbreaking work...",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop",
    profileUrl: "#",
  },
  {
    id: 5,
    name: "Dr. John Vervaeke",
    bio: "Award-winning professor of psychology, cognitive science, and Buddhist psychology...",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    profileUrl: "#",
  },
  {
    id: 6,
    name: "Dr. John Vervaeke",
    bio: "Award-winning professor of psychology, cognitive science, and Buddhist psychology...",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    profileUrl: "#",
  },
  {
    id: 7,
    name: "Dr. John Vervaeke",
    bio: "Award-winning professor of psychology, cognitive science, and Buddhist psychology...",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    profileUrl: "#",
  },
];

const TOTAL_DOTS = 3;

export function FacultySection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Sync scroll percentage (0 to 1) to the 3 navigation dots
  const handleScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 0) {
      setActiveIndex(0);
      return;
    }

    // Determine current position ratio along the track (0.0 to 1.0)
    const scrollProgress = Math.min(Math.max(scrollLeft / maxScroll, 0), 1);
    const targetIndex = Math.round(scrollProgress * (TOTAL_DOTS - 1));

    if (targetIndex !== activeIndex) {
      setActiveIndex(targetIndex);
    }
  };

  // Smoothly scroll to Start (0%), Middle (50%), or End (100%)
  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    if (!sliderRef.current) return;

    const { scrollWidth, clientWidth } = sliderRef.current;
    const maxScroll = scrollWidth - clientWidth;
    const targetScroll = (index / (TOTAL_DOTS - 1)) * maxScroll;

    sliderRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  return (
    <section className="bg-[#E8ECEF] min-h-screen py-16 px-6 md:px-12 font-sans text-[#1A202C]">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl font-normal text-[#1C2536] tracking-tight mb-3">
              Meet our Board.
            </h2>
            <p className="text-[#5A6578] text-base md:text-lg">
              Our board is composed of some of the world&apos;s most respected minds.
            </p>
          </div>

          {/* University Crest Logos Placeholder */}
          <div className="flex items-center space-x-4 opacity-40 grayscale">
            <CrestIcon symbol="OX" />
            <CrestIcon symbol="CAM" />
            <CrestIcon symbol="HAR" />
            <CrestIcon symbol="STAN" />
          </div>
        </div>

        {/* Category Tab */}
        <div className="mb-8 border-b border-gray-300 pb-2 inline-block">
          <span className="text-xs uppercase tracking-widest text-[#2A3447] font-semibold">
            THE PIONEERS
          </span>
        </div>

        {/* Cards Slider Container */}
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-4 snap-x snap-mandatory scroll-smooth pb-6 -mx-6 px-6 md:-mx-12 md:px-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
          {facultyData.map((member) => (
            <div
              key={member.id}
              className="group relative h-[480px] w-[85vw] sm:w-[320px] md:w-[280px] lg:w-[240px] flex-none snap-start rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-end"
            >
              {/* Background Image */}
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1727]/90 via-[#0B1727]/40 to-transparent" />

              {/* Card Content */}
              <div className="relative p-5 text-white z-10 flex flex-col justify-end">
                <h3 className="font-serif text-2xl font-normal leading-tight mb-2">
                  {member.name}
                </h3>
                <p className="text-xs text-gray-300 font-light line-clamp-3 mb-4 leading-relaxed">
                  {member.bio}
                </p>
                <a
                  href={member.profileUrl}
                  className="inline-block text-[11px] font-medium tracking-wider uppercase underline underline-offset-4 decoration-white/60 hover:decoration-white transition-colors"
                >
                  VIEW PROFILE
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* 3 Section Pagination Indicators */}
        <div className="flex justify-center items-center space-x-2 mt-4">
          {Array.from({ length: TOTAL_DOTS }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? 'w-6 bg-[#1C2536]'
                  : 'w-2 bg-gray-400 hover:bg-gray-600'
              }`}
              aria-label={`Go to section ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

{/* Simple Crest SVG Placeholder */}
function CrestIcon({ symbol }: { symbol: string }) {
  return (
    <div className="w-10 h-10 border-2 border-slate-700 rounded-md flex items-center justify-center font-serif text-[10px] font-bold tracking-tighter text-slate-800">
      {symbol}
    </div>
  );
}