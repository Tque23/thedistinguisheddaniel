export function PageHeroVideo() {
  return (
    <div className="page-hero-video" aria-hidden="true">
      <video autoPlay muted loop playsInline>
        <source src="/hero-video.webm" type="video/webm" />
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
