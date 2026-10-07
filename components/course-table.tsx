"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUpRight, Play } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { COURSES, type Course } from "@/lib/courses"
import { CourseDialog } from "@/components/course-dialog"

// Types
export interface Lecture {
  id: string
  title: string
  speaker: string
  category: string
  tags: string[]
  image: string
  course?: Course
}

const FEATURED_COURSES: Lecture[] = COURSES.map((course) => ({
  id: course.id,
  title: course.title,
  speaker: course.free ? "Free · In-person" : "In-person and online",
  category: "Short Courses",
  tags: course.free ? ["Short Courses", "Free"] : ["Short Courses", "Paid"],
  image: course.image,
  course,
}))

const CATEGORIES = ["All", "Paid", "Free"]
const TOTAL_DOTS = 3;

export function LectureLibraryShowcase() {
  const [activeTab, setActiveTab] = useState("All")
  const [managedLectures, setManagedLectures] = useState<Lecture[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) return
    let active = true
    void createClient().from("courses").select("id,title,instructor,category,thumbnail_url").eq("published", true).order("created_at", { ascending: false }).then(({ data }) => {
      if (!active || !data?.length) return
      setManagedLectures(data.map((course) => ({
        id: course.id,
        title: course.title,
        speaker: course.instructor,
        category: course.category || "Lectures",
        tags: [course.category || "Lectures"],
        image: course.thumbnail_url || "/placeholder.svg",
      })))
    })
    return () => { active = false }
  }, [])
  
  // Swiper State
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const allLectures = [...FEATURED_COURSES, ...managedLectures]

  const displayedLectures =
    activeTab === "All"
      ? allLectures
      : allLectures.filter((item) => item.category === activeTab || item.tags.includes(activeTab))

  // Layout Logic Constraints
  const count = displayedLectures.length;
  const isSwiperOnMobile = true;
  const isSwiperOnDesktop = true;

  // Track swiper scroll position to update dots
  const handleScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 0) {
      setActiveIndex(0);
      return;
    }

    const clampedScrollLeft = Math.max(0, Math.min(scrollLeft, maxScroll));
    const progress = clampedScrollLeft / maxScroll;
    const targetIndex = Math.round(progress * (TOTAL_DOTS - 1));

    if (targetIndex !== activeIndex) {
      setActiveIndex(targetIndex);
    }
  };

  // Click handler for dot navigation
  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    if (!sliderRef.current) return;

    const children = sliderRef.current.children;
    if (!children.length) return;

    const targetCardIndex = Math.round((index / (TOTAL_DOTS - 1)) * (displayedLectures.length - 1));
    const targetCard = children[targetCardIndex] as HTMLElement;
    const firstChild = children[0] as HTMLElement;

    if (targetCard && firstChild) {
      const targetLeft = targetCard.offsetLeft - firstChild.offsetLeft;
      sliderRef.current.scrollTo({
        left: targetLeft,
        behavior: 'smooth',
      });
    }
  };

  // Determine dynamic container and child classes to allow purely CSS-driven responsive switching
  let containerClasses = "gap-x-4 gap-y-6 pt-2 ";
  let childClasses = "group cursor-pointer flex flex-col space-y-2 ";
  let dotsVisibilityClass = "hidden";

  if (isSwiperOnMobile && isSwiperOnDesktop) {
     // Always Swiper Layout (Mobile & PC)
     containerClasses += "flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 scroll-px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']";
     childClasses += "flex-none w-[80vw] sm:w-[320px] lg:w-[300px] snap-start";
     dotsVisibilityClass = "flex";
  } else if (isSwiperOnMobile && !isSwiperOnDesktop) {
     // Hybrid Layout: Swiper on Mobile, Grid on PC
     containerClasses += "flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 scroll-px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] lg:grid lg:grid-cols-4 lg:overflow-visible lg:snap-none lg:pb-0";
     childClasses += "flex-none w-[80vw] sm:w-[320px] snap-start lg:w-auto lg:snap-align-none";
     dotsVisibilityClass = "flex lg:hidden";
  } else {
     // Always Grid Layout (Mobile & PC)
     containerClasses += "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  }

  return (
    <section 
        className="w-full text-slate-100 font-sans" 
        style={{ padding: "1.5rem clamp(1.25rem, 5vw, 5.5rem) 2.5rem" }}
        >
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
          <h2 className="font-serif text-4xl md:text-5xl font-normal text-white tracking-tight mb-3">
            Short Courses to Equip You.
          </h2>

          <a
            href="#explore"
            className="group inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-slate-200 uppercase hover:text-white transition-colors self-start md:self-auto border-b border-slate-300/40 hover:border-white pb-0.5"
          >
            Explore Library
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Category Tabs Sub-navigation */}
        <div className="overflow-x-auto scrollbar-none border-b border-slate-800/80">
          <nav className="flex items-center gap-6 md:gap-8 min-w-max pb-2.5">
            {CATEGORIES.map((category) => {
              const isActive = activeTab === category
              return (
                <button
                  key={category}
                  onClick={() => setActiveTab(category)}
                  className={`relative text-sm sm:text-base font-serif transition-all duration-300 pb-1.5 ${
                    isActive
                      ? "text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {category}
                  {/* Active Underline Indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white transition-all duration-300" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Dynamic Grid / Swiper Container */}
        <div 
          ref={sliderRef}
          onScroll={handleScroll}
          className={containerClasses}
        >
          {displayedLectures.map((lecture) => (
            <button
              type="button"
              key={lecture.id}
              className={`${childClasses} text-left`}
              onClick={() => setSelectedCourse(lecture.course ?? { id: lecture.id, title: lecture.title, tagline: "", badge: lecture.category, free: false, image: lecture.image, description: `Presented by ${lecture.speaker}. Sign up to receive the dates, pricing and registration details for this course.`, formats: [] })}
              aria-haspopup="dialog"
            >
              {/* Portrait course poster frame (1080 x 1350 / 4:5) */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-800/80 shadow-md">
                <img
                  src={lecture.image}
                  alt={lecture.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Play Button Hover Effect */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Meta & Speaker Info */}
              <div className="space-y-0.5 pt-0.5">
                <h3 className="text-sm font-serif font-normal text-white tracking-tight group-hover:text-slate-200 transition-colors leading-snug">
                  {lecture.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-sans tracking-wide">
                  {lecture.speaker}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Pagination Dots (Only visible when Swiper is active for the respective viewport) */}
        <div className={`justify-center items-center mt-2 ${dotsVisibilityClass}`}>
          {Array.from({ length: TOTAL_DOTS }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className="p-3 focus:outline-none touch-manipulation group"
              aria-label={`Go to section ${index + 1}`}
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? 'w-6 bg-slate-100'
                    : 'w-2 bg-slate-700 group-hover:bg-slate-500'
                }`}
              />
            </button>
          ))}
        </div>

      </div>
      <CourseDialog course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </section>
  )
}
