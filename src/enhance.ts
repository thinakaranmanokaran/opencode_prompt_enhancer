import type { EnhancerOptions, ModelRef } from "./config.js"

const DEFAULT_RULES = [
  "Preserve the user's intent, language, and technical meaning.",
  "Do not invent files, APIs, requirements, values, or constraints that the draft does not state.",
  "Make the goal, context, constraints, and expected output explicit.",
  "If a necessary detail is ambiguous, state the smallest useful assumption inline; do not ask follow-up questions.",
  "Keep the result concise and ready to send.",
  "Return only the enhanced prompt, with no preamble or explanation.",
]

const STYLE_GUIDANCE: Record<NonNullable<EnhancerOptions["style"]>, string> = {
  balanced:
    "Make the request specific and useful without changing the user's intent or adding unsupported requirements. Focus on the goal, context, constraints, and expected output.",
  structured:
    "Organize the enhanced prompt with concise labeled sections where they fit: Goal, Context, Requirements, Constraints, and Expected output. Use only sections supported by the draft and configuration.",
  minimal:
    "Fix wording and ambiguity only. Preserve the original structure and completeness; do not introduce a new format.",
}

function titleCase(value: string): string {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function experienceLabel(value: string): string {
  const trimmed = value.trim()
  return /^\d+(?:\.\d+)?$/.test(trimmed) ? `${trimmed} years` : trimmed
}

function persona(options: EnhancerOptions): string {
  const role = options.role ?? "experienced software engineer"
  const experience = options.experience
    ? ` with ${experienceLabel(options.experience)} of experience`
    : ""
  let text = `You are ${titleCase(role)}${experience}.`
  if (options.specialties?.length) {
    text += ` Specialize in ${options.specialties.join(", ")}.`
  }
  if (options.tone) text += ` Use a ${options.tone} tone.`
  if (options.language && options.language.toLowerCase() !== "auto") {
    text += ` Write the enhanced prompt in ${options.language}.`
  }
  return text
}

function formatRules(options: EnhancerOptions): string {
  const rules = options.rules?.length ? options.rules : DEFAULT_RULES
  return rules.map((rule) => `- ${rule}`).join("\n")
}

function formatExamples(options: EnhancerOptions): string {
  if (!options.examples?.length) return "No examples provided."
  return options.examples
    .map((example, index) => {
      return [
        `Example ${index + 1}`,
        "Input:",
        example.input,
        "Enhanced output:",
        example.output,
      ].join("\n")
    })
    .join("\n\n")
}

function placeholderValues(options: EnhancerOptions, draft: string): Record<string, string> {
  return {
    role: options.role ?? "experienced software engineer",
    experience: options.experience ?? "",
    specialties: options.specialties?.join(", ") ?? "",
    tone: options.tone ?? "",
    style: options.style ?? "balanced",
    language: options.language ?? "auto",
    maxWords: options.maxWords ? String(options.maxWords) : "",
    rules: formatRules(options),
    examples: formatExamples(options),
    extraInstructions: options.extraInstructions ?? "",
    draft,
  }
}

function defaultTemplate(options: EnhancerOptions): string {
  const extra = options.extraInstructions ? `\n\nAdditional instructions:\n${options.extraInstructions}` : ""
  const maxWords = options.maxWords ? `\nAim for at most ${options.maxWords} words.` : ""
  return [
    persona(options),
    "",
    "Rewrite the user's draft below into a stronger prompt for an AI coding agent.",
    "",
    "Guidance:",
    STYLE_GUIDANCE[options.style ?? "balanced"],
    "",
    "Rules:",
    formatRules(options),
    "",
    "Examples:",
    formatExamples(options),
    extra,
    maxWords,
    "",
    "User draft:",
    "{{draft}}",
  ].join("\n")
}

export function buildEnhancementPrompt(options: EnhancerOptions, draft: string): string {
  const template = options.template ?? defaultTemplate(options)
  const values = placeholderValues(options, draft)
  let rendered = template.replace(/{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g, (match, key) =>
    Object.hasOwn(values, key) ? values[key]! : match,
  )

  if (!/{{\s*draft\s*}}/.test(template)) {
    rendered = `${rendered.trim()}\n\nUser draft:\n${draft}`
  }
  return rendered.trim()
}

const LEADING_PREAMBLE =
  /^(?:sure[,\s]+)?here(?:'s| is)(?: an?| the)? (?:enhanced|improved|rewritten)? ?prompt\s*[:\n]\s*/i

export function cleanEnhancedPrompt(value: string): string {
  let text = value.trim()
  if (!text) return ""

  // Most models return the prompt unwrapped. If one wraps it in a markdown fence,
  // remove one outer pair rather than relying on the user to parse it.
  const fenced = text.match(/^```[^\n]*\n?([\s\S]*?)\n?```$/)
  if (fenced?.[1] !== undefined) {
    text = fenced[1].trim()
  } else {
    text = text.replace(LEADING_PREAMBLE, "").trim()
  }

  // Remove a single outer quote pair when every endpoint is one matching pair.
  const quotePairs: Array<[string, string]> = [["\"", "\""], ["'", "'"], ["“", "”"], ["‘", "’"]]
  if (text.length >= 2) {
    for (const [open, close] of quotePairs) {
      if (text.startsWith(open) && text.endsWith(close)) {
        text = text.slice(open.length, -close.length).trim()
        break
      }
    }
  }

  return text.trim()
}

export const FREE_LIMIT_HINTS = [
  "free usage limit reached",
  "free usage limit",
  "free model",
  "usage limit reached",
  "free quota",
  "free models work in opencode",
  "subscribe to opencode go",
] as const

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) return message
    try {
      const serialized = JSON.stringify(error)
      if (serialized && serialized !== "{}") return serialized
    } catch {
      // Ignore serialization failures and fall back to String().
    }
  }
  return String(error)
}

export function isFreeLimitError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase()
  if (!message) return false
  if (FREE_LIMIT_HINTS.some((hint) => message.includes(hint))) return true
  return (
    message.includes("rate_limit") &&
    (message.includes("free") || message.includes("opencode") || message.includes("usage"))
  )
}

export function modelLabel(model: ModelRef | undefined): string {
  if (!model) return "the default model"
  return `${model.providerID}/${model.id}`
}

export function formatEnhanceError(error: unknown, model: ModelRef | undefined): string {
  const message = extractErrorMessage(error)
  if (isFreeLimitError(error)) {
    const attempted = modelLabel(model)
    return [
      `Could not enhance prompt: free model "${attempted}" hit its free usage limit.`,
      `Enhancement uses your current session model. Switch it with /models to a model you have a key for (for example an OpenAI model), then retry.`,
      `Free models work in OpenCode (https://opencode.ai); subscribe to OpenCode Go to keep going: https://opencode.ai/go`,
      message && message !== `Free usage limit reached` ? `(${message})` : "",
    ]
      .filter(Boolean)
      .join(" ")
  }
  return `Could not enhance prompt: ${message}`
}
