import { Link } from "react-router-dom"
import { site } from "../../site.config"
import { CopyCommand } from "../components/CopyCommand"
import { PageHeader } from "../components/PageHeader"
import { pages } from "../seo"

const page = pages[3]!

export function GuidePage() {
  return (
    <>
      <PageHeader
        id="guide-page-title"
        index="03"
        label="Guide"
        title={page.heading}
        intro={page.intro}
      />

      <section className="page-block guide-section" aria-labelledby="guide-what-title">
        <div className="guide-copy">
          <h2 id="guide-what-title">What the plugin changes.</h2>
          <p>
            OpenCode Prompt Enhancer adds one command to OpenCode: <code>/enhance</code>. It sends
            your draft through the model already attached to the session, then opens the rewritten
            prompt in a modal. Nothing is inserted until you press <kbd>Enter</kbd>.
          </p>
          <p>
            The rewrite keeps your intent but adds the details a coding agent needs: the goal, the
            constraints, the files or stack involved, and a clear definition of done. You can accept
            it, copy it, retry it, or throw it away.
          </p>
        </div>
      </section>

      <section className="page-block guide-section" aria-labelledby="guide-example-title">
        <div className="guide-copy">
          <h2 id="guide-example-title">A rough draft, rewritten.</h2>
          <div className="guide-example">
            <p className="mono-label">Before</p>
            <p>
              <code>/enhance make the login form better</code>
            </p>
          </div>
          <div className="guide-example">
            <p className="mono-label">After</p>
            <p>
              Improve the login form in <code>src/routes/login.tsx</code>. Add inline validation
              for email and password, disable the submit button while the request is pending, show
              API errors next to the relevant field, and keep the existing design tokens. Add a test
              for the invalid-email case.
            </p>
          </div>
          <p>
            The exact result depends on your model and project context. The point is that the second
            prompt is specific enough to act on without another round of clarification.
          </p>
        </div>
      </section>

      <section className="page-block guide-section" aria-labelledby="guide-when-title">
        <div className="guide-copy">
          <h2 id="guide-when-title">When to use /enhance.</h2>
          <ul className="guide-list">
            <li>You know what you want, but the first draft is vague.</li>
            <li>A bug report needs reproduction steps and expected behavior.</li>
            <li>A refactor needs scope, constraints, and a definition of done.</li>
            <li>You want the session’s model and context without retyping them.</li>
          </ul>
          <p>
            With a session open, the plugin uses that session’s model, variant, and context. From
            the OpenCode home screen it creates a temporary session, generates the result, and
            removes the session immediately.
          </p>
        </div>
      </section>

      <section className="page-block guide-section" aria-labelledby="guide-configure-title">
        <div className="guide-copy">
          <h2 id="guide-configure-title">Configure it for your project.</h2>
          <p>
            The defaults work out of the box. When you need a different voice, set a role, tone,
            specialties, rules, examples, or a custom template in your user or project config. You
            can also pin a model with the <code>model</code> option.
          </p>
          <p>
            See the{" "}
            <a href={site.docs} target="_blank" rel="noreferrer noopener">
              README
            </a>{" "}
            for the full option list and configuration priority.
          </p>
        </div>
      </section>

      <section className="page-block guide-section" aria-labelledby="guide-install-title">
        <div className="guide-copy">
          <h2 id="guide-install-title">Install OpenCode Prompt Enhancer.</h2>
          <p>Add the plugin, reload OpenCode, and run the command from any composer.</p>
          <CopyCommand command={site.installCommand} />
          <p className="small-note">
            Requires OpenCode v2 and a configured provider. Full setup details are on the{" "}
            <Link to="/install/">install page</Link>.
          </p>
        </div>
      </section>
    </>
  )
}
