import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { site } from "../../site.config"
import { asset } from "../lib/asset"

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
    </svg>
  )
}

export function HomeScreen() {
  const [playing, setPlaying] = useState(true)
  const [failed, setFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const poster = asset("media/tutorial-poster.jpg")
  const posterWebp = asset("media/tutorial-poster.webp")
  const posterAvif = asset("media/tutorial-poster.avif")
  const poster900 = asset("media/tutorial-poster-900.jpg")
  const poster900Webp = asset("media/tutorial-poster-900.webp")
  const poster900Avif = asset("media/tutorial-poster-900.avif")
  const mobileHero = asset("media/mobile_hero.png")
  const mobileHeroWebp = asset("media/mobile_hero.webp")
  const mobileHeroAvif = asset("media/mobile_hero.avif")
  const mp4 = asset("media/tutorial.mp4")

  useEffect(() => {
    if (!window.matchMedia("(min-width: 701px)").matches) return
    const video = videoRef.current
    if (video) void video.play().catch(() => {})
  }, [])

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play().catch(() => {})
    else video.pause()
  }

  function handlePlaybackError() {
    setFailed(true)
    setPlaying(false)
  }

  return (
    <div className="home-screen">
      <div className="home-screen-backdrop" aria-hidden="true" />

      <div className="home-screen-mobile">
        <picture className="home-mobile-image">
          <source srcSet={mobileHeroAvif} type="image/avif" />
          <source srcSet={mobileHeroWebp} type="image/webp" />
          <img
            src={mobileHero}
            alt="OpenCode home screen with the /enhance command typed into the composer."
            width={1244}
            height={767}
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        <p className="home-mobile-eyebrow">OpenCode / TUI plugin</p>
        <h2 className="home-mobile-title">Turn rough prompts into precise instructions.</h2>
        <p className="home-mobile-copy">
          A free, open-source TUI plugin. Type <code>/enhance</code>, get a sharper prompt for your
          AI coding agent, then insert it straight into the composer.
        </p>
        <div className="home-mobile-install">
          <code>{site.installCommand}</code>
        </div>
        <div className="home-mobile-links">
          <Link to="/install/">Install</Link>
          <Link to="/about/">About</Link>
          <a href={site.repo} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </div>
      </div>

      <div className="home-screen-stage">
        <picture className="home-screen-poster-layer" aria-hidden="true">
          <source
            srcSet={`${poster900Avif} 900w, ${posterAvif} 1748w`}
            sizes="100vw"
            type="image/avif"
          />
          <source
            srcSet={`${poster900Webp} 900w, ${posterWebp} 1748w`}
            sizes="100vw"
            type="image/webp"
          />
          <img
            className="home-screen-media"
            src={poster900}
            srcSet={`${poster900} 900w, ${poster} 1748w`}
            sizes="100vw"
            alt=""
            width={site.video.width}
            height={site.video.height}
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        <video
          ref={videoRef}
          className="home-screen-media"
          muted
          playsInline
          loop
          preload="none"
          width={site.video.width}
          height={site.video.height}
          aria-label="OpenCode Prompt Enhancer tutorial"
          aria-describedby="home-caption"
          onClick={togglePlayback}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={handlePlaybackError}
          onCanPlay={(event) => {
            if (!window.matchMedia("(min-width: 701px)").matches) return
            void event.currentTarget.play().catch(() => {})
          }}
        >
          <source src={mp4} type="video/mp4" onError={handlePlaybackError} />
          Your browser does not support video. <a href={mp4}>Download the tutorial</a>.
        </video>

        {failed ? null : (
          <button
            type="button"
            className="home-screen-pause"
            onClick={togglePlayback}
            aria-label={playing ? "Pause video" : "Play video"}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
        )}
      </div>
    </div>
  )
}
