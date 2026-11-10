import { site } from "../../site.config"
import { CopyCommand } from "./CopyCommand"

type InstallProps = { index?: string }

export function Install({ index = "03" }: InstallProps) {
  return (
    <div className="install">
      <div className="install-copy">
        <p className="eyebrow">
          <span className="eyebrow-index">{index}</span>
          <span>Install</span>
        </p>
        <h2 id="install-title">One command, then type /enhance.</h2>
        <p>
          Add the plugin to OpenCode, reload, and use it from the composer. The plugin reads your
          existing user and project configuration, so options can live where you already work.
        </p>
        <CopyCommand command={site.installCommand} compact />
        <p className="small-note">
          Requires OpenCode v2 and a configured provider. See the{" "}
          <a href={site.docs} target="_blank" rel="noreferrer noopener">
            README for options, templates, and model overrides
          </a>
          .
        </p>
      </div>

      <ol className="steps" aria-labelledby="install-title">
        <li>
          <span className="mono-label">Step 01</span>
          <p>
            Run <code>{site.installCommand}</code>.
          </p>
        </li>
        <li>
          <span className="mono-label">Step 02</span>
          <p>
            Reload OpenCode, then run <code>/enhance write a login page with validation</code>.
          </p>
        </li>
        <li>
          <span className="mono-label">Step 03</span>
          <p>
            Review the result and press <kbd>Enter</kbd> to insert it into the composer.
          </p>
        </li>
      </ol>
    </div>
  )
}
