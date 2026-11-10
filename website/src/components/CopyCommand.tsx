import { useState } from "react"

type CopyCommandProps = {
  command: string
  compact?: boolean
}

export function CopyCommand({ command, compact = false }: CopyCommandProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      const field = document.createElement("textarea")
      field.value = command
      field.setAttribute("readonly", "")
      field.style.position = "fixed"
      field.style.opacity = "0"
      document.body.appendChild(field)
      field.select()
      document.execCommand("copy")
      field.remove()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className={compact ? "install-bar install-bar--compact" : "install-bar"}>
      <code>{command}</code>
      <button type="button" onClick={copy} className="copy-button" aria-live="polite">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}
