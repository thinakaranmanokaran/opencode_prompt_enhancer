import { useEffect, useRef, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { site } from "../../site.config"
import { asset } from "../lib/asset"
import { pages } from "../seo"

export function TopRail() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setMenuOpen(false)
      buttonRef.current?.focus()
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [menuOpen])

  return (
    <header className={menuOpen ? "top-rail is-menu-open" : "top-rail"}>
      <a className="brand" href={asset("")}>
        <img src={asset("logo.svg")} alt="" width={22} height={22} aria-hidden="true" />
        <span className="brand-text">
          <span>OpenCode</span>
          <span>Prompt Enhancer</span>
        </span>
      </a>

      <div className="top-actions">
        <nav className="top-nav" aria-label="Primary">
          {pages
            .filter((page) => page.path !== "/")
            .map((page) => (
              <NavLink key={page.path} to={page.path}>
                {page.navLabel}
              </NavLink>
            ))}
        </nav>

        <div className="top-meta">
          <span className="mono-label top-version" aria-label={`Version ${site.version}`}>
            v{site.version}
          </span>
          <a href={site.npm} target="_blank" rel="noreferrer noopener">
            npm
          </a>
          <a href={site.repo} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </div>
      </div>

      <button
        ref={buttonRef}
        type="button"
        className="mobile-menu-button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="mobile-menu-icon" aria-hidden="true" />
      </button>

      {menuOpen ? (
        <div className="mobile-menu" id="mobile-menu">
          <nav aria-label="Mobile navigation">
            {pages.map((page) => (
              <NavLink key={page.path} to={page.path} onClick={() => setMenuOpen(false)}>
                {page.navLabel}
              </NavLink>
            ))}
            <a href={site.npm} target="_blank" rel="noreferrer noopener" onClick={() => setMenuOpen(false)}>
              npm
            </a>
            <a href={site.repo} target="_blank" rel="noreferrer noopener" onClick={() => setMenuOpen(false)}>
              GitHub
            </a>
          </nav>
          <p className="mono-label">v{site.version}</p>
        </div>
      ) : null}
    </header>
  )
}
