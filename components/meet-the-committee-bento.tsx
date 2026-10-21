import Image from "next/image"

const photos = {
  feature: "/mtc/DSC_5550.jpg",
  portrait: "/mtc/DSC_5554.jpg",
  candid: "/mtc/DSC_5553.jpg",
  fullTeam: "/mtc/DSC_5536.jpg",
  perspective: "/mtc/DSC_5552.jpg",
}

function PhotoTile({
  src,
  alt,
  className,
  eyebrow,
  title,
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  eyebrow: string
  title: string
  priority?: boolean
}) {
  return (
    <article className={`group relative min-h-64 overflow-hidden rounded-3xl bg-[#172b3a] ring-1 ring-[#172b3a]/10 ${className ?? ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 620px"
        className="object-cover transition duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#091522]/90 via-[#091522]/15 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-5 bottom-5">
        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[#e0b64d]">{eyebrow}</p>
        <h3 className="max-w-md font-serif text-2xl leading-tight text-white md:text-3xl">{title}</h3>
      </div>
    </article>
  )
}

export function MeetTheCommitteeBento() {
  return (
    <section aria-labelledby="committee-title" className="relative overflow-hidden bg-[var(--background)] py-20 md:py-28 section-px font-sans text-[#172b3a]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-48 top-20 h-[32rem] w-[32rem] rounded-full bg-[#c89b3c]/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col justify-between gap-8 md:mb-14 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#7a6541]"><span className="h-px w-8 bg-[#c89b3c]" aria-hidden="true" />The Pioneers</p>
            <h2 id="committee-title" className="font-serif text-4xl font-normal leading-[1.05] tracking-tight md:text-6xl">The Executive Committee <em className="not-italic text-[#c89b3c]">2026.</em></h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#4a5a68] md:text-lg">Our committee comprises of distinguished marketplace professionals and leaders who have years of experience in advancing God's agenda in the twelve gates of society.</p>
          </div>
          <div className="max-w-xs border-l border-[#c89b3c]/50 pl-5 text-sm leading-relaxed text-[#4a5a68]">One Vision. Many Callings. A network that turns convictions into purposeful action.</div>
        </header>

        <div className="grid auto-rows-[minmax(14rem,auto)] grid-cols-1 gap-4 md:grid-cols-4 md:gap-5">
          <PhotoTile src={photos.feature} alt="The committee standing together at the official launch" eyebrow="Executive Committee · 2026" title="Servant Leaders, Distinguished to Lead" className="min-h-[28rem] md:col-span-2 md:row-span-2" priority />
          <PhotoTile src={photos.candid} alt="Committee members sharing a candid moment in matching navy jackets" eyebrow="The Pattern:" title="The Order of Daniel: Excellence that Outlasted Five Kings." className="md:col-span-2" />
          <div className="flex min-h-64 flex-col justify-between rounded-3xl border border-[#172b3a]/10 bg-[#172b3a] p-7 text-white shadow-sm md:col-span-1">
            <div className="flex items-center justify-between"><span className="h-2 w-2 rounded-full bg-[#e0b64d]" /><span className="text-xs uppercase tracking-[0.2em] text-white/50">The Gates</span></div>
            <div><p className="font-serif text-6xl text-[#e0b64d]">12</p><p className="mt-2 text-sm leading-relaxed text-white/70">Gates of Society, Manned by Pioneers</p></div>
          </div>
          <PhotoTile src={photos.portrait} alt="A committee member looking toward the stage during the event" eyebrow="The Mandate:" title="Raised to Arise and Shine." className="md:col-span-1" />
          <PhotoTile src={photos.fullTeam} alt="The full committee posed together in front of the institute crest" eyebrow="The Network:" title="Synergy That Circulates Wealth and Opportunity amongst Believers." className="md:col-span-2" />
          <PhotoTile src={photos.perspective} alt="A committee member viewed from the audience during the programme" eyebrow="The Institute:" title="A School of the Spirit that Turns Believers into Pioneers." className="md:col-span-2" />
        </div>
      </div>
    </section>
  )
}

