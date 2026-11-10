import { site } from "../../site.config"

type DeveloperProps = { index?: string }

export function Developer({ index = "02" }: DeveloperProps) {
  return (
    <div className="developer">
      <div className="developer-copy">
        <p className="eyebrow">
          <span className="eyebrow-index">{index}</span>
          <span>Developer</span>
        </p>
        <h2 id="developer-title">Built by {site.developer.name}.</h2>
        <p>
          Software developer and creator of OpenCode Prompt Enhancer. The plugin is an independent
          open-source project, designed to make everyday prompting in OpenCode faster and more
          precise.
        </p>
        <div className="developer-links">
          <a href={site.developer.portfolio} target="_blank" rel="me noreferrer noopener">
            thinakaran.dev
          </a>
          <a href={site.developer.github} target="_blank" rel="me noreferrer noopener">
            GitHub
          </a>
          <a href={site.repo} target="_blank" rel="noreferrer noopener">
            Project repository
          </a>
        </div>
      </div>

      <div className="developer-card" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width={96} height={96} />
        <span className="mono-label">Thinakaran Manokaran</span>
        <span className="mono-label">OpenCode / TUI</span>
      </div>
    </div>
  )
}
