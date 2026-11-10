type FeatureNotesProps = { index?: string }

export function FeatureNotes({ index = "02" }: FeatureNotesProps) {
  return (
    <div className="notes">
      <div className="notes-head">
        <p className="eyebrow">
          <span className="eyebrow-index">{index}</span>
          <span>Why /enhance</span>
        </p>
        <h2 id="notes-title">Sharper prompts, without the ceremony.</h2>
      </div>

      <ol className="notes-list" aria-labelledby="notes-title">
        <li>
          <span className="note-number mono-label">01</span>
          <h3>Session-aware</h3>
          <p>
            Uses the open session’s model, variant, and context, with no parallel model configuration
            to keep in sync.
          </p>
        </li>
        <li>
          <span className="note-number mono-label">02</span>
          <h3>Yours to configure</h3>
          <p>
            Set a role, tone, specialties, rules, examples, and a custom template in user or project
            config. Leave it alone and the defaults work.
          </p>
        </li>
        <li>
          <span className="note-number mono-label">03</span>
          <h3>Clear when it fails</h3>
          <p>
            One attempt, a named model, and actionable free-quota guidance. No silent fallback to a
            model you did not choose.
          </p>
        </li>
      </ol>
    </div>
  )
}
