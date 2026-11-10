import { Link } from "react-router-dom"
import { site } from "../../site.config"
import { asset } from "../lib/asset"
import { pages } from "../seo"

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <img src={asset("logo.svg")} alt="" width={18} height={18} aria-hidden="true" />
        <span className="mono-label">{site.name}</span>
      </div>

      <nav className="footer-links" aria-label="Footer">
        {pages.map((page) =>
          page.path === "/" ? (
            <a key={page.path} href={asset("")}>
              {page.navLabel}
            </a>
          ) : (
            <Link key={page.path} to={page.path}>
              {page.navLabel}
            </Link>
          ),
        )}
        <a href={site.npm} target="_blank" rel="noreferrer noopener">
          npm
        </a>
        <a href={site.docs} target="_blank" rel="noreferrer noopener">
          README
        </a>
        <a href={site.license} target="_blank" rel="noreferrer noopener">
          License
        </a>
        <a href={site.developer.portfolio} target="_blank" rel="me noreferrer noopener">
          {site.developer.name}
        </a>
      </nav>

      <p className="footer-note">
        © {site.year} {site.developer.name}. MIT licensed. Independent open-source project.
      </p>
    </footer>
  )
}
