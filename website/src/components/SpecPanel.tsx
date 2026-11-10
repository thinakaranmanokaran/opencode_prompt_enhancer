import { site } from "../../site.config"
import { asset } from "../lib/asset"

export function SpecPanel() {
  return (
    <aside className="spec" aria-label="Plugin specification">
      <div className="spec-mark" aria-hidden="true">
        <img src={asset("logo.png")} alt="" width={256} height={256} />
      </div>
      <dl>
        <div>
          <dt>Command</dt>
          <dd>
            <code>/enhance</code>
          </dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>OpenCode v2 TUI</dd>
        </div>
        <div>
          <dt>Model</dt>
          <dd>Session model or override</dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{site.version}</dd>
        </div>
        <div>
          <dt>License</dt>
          <dd>{site.licenseName}</dd>
        </div>
        <div>
          <dt>Author</dt>
          <dd>
            <a href={site.developer.portfolio} target="_blank" rel="me noreferrer noopener">
              {site.developer.name}
            </a>
          </dd>
        </div>
      </dl>
    </aside>
  )
}
