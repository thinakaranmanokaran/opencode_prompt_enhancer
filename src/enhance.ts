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

export type ModelInfoLike = {
  providerID?: string
  id?: string
  modelID?: string
  name?: string
  type?: string
  enabled?: boolean
  status?: string
  cost?: unknown
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function getInputCost(info: ModelInfoLike): number | undefined {
  const raw = info.cost
  if (typeof raw === "number" && Number.isFinite(raw)) return raw
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (typeof entry === "number" && Number.isFinite(entry)) return entry
      if (isRecord(entry)) {
        for (const key of ["input", "inputPrice", "input_price"]) {
          const value = entry[key]
          if (typeof value === "number" && Number.isFinite(value)) return value
        }
      }
    }
    return undefined
  }
  if (isRecord(raw)) {
    for (const key of ["input", "inputPrice", "input_price"]) {
      const value = raw[key]
      if (typeof value === "number" && Number.isFinite(value)) return value
    }
  }
  return undefined
}

function modelIdOf(info: ModelInfoLike | ModelRef): string {
  if ("modelID" in info && typeof info.modelID === "string" && info.modelID) return info.modelID
  if ("id" in info && typeof info.id === "string") return info.id
  return ""
}

export function isFreeModel(info: ModelInfoLike | ModelRef): boolean {
  const raw = info as ModelInfoLike
  if (raw.enabled === false) return false
  if (raw.status === "deprecated") return false
  const id = modelIdOf(info).toLowerCase()
  const providerID = (raw.providerID ?? "").toLowerCase()
  const cost = getInputCost(raw)
  if (typeof cost === "number") return cost === 0
  if (id.endsWith("-free")) return true
  if (
    id.includes("free") &&
    (providerID === "opencode" || providerID === "opencode-go" || !providerID)
  ) {
    return true
  }
  return false
}

export function sameModel(left: ModelRef | undefined, right: ModelRef | undefined): boolean {
  if (!left || !right) return false
  return left.providerID === right.providerID && left.id === right.id
}

export function modelLabel(model: ModelRef | undefined): string {
  if (!model) return "the default model"
  return `${model.providerID}/${model.id}`
}

export function pickPaidFallbacks(
  models: ModelInfoLike[],
  exclude: Array<ModelRef | undefined> = [],
  limit = 2,
): ModelRef[] {
  const excluded = new Set(
    exclude.filter((entry): entry is ModelRef => entry !== undefined).map(modelLabel),
  )
  const candidates = models
    .filter((model) => {
      if (!model.providerID) return false
      if (!modelIdOf(model)) return false
      if (model.enabled === false) return false
      if (model.status === "deprecated") return false
      if (model.type && model.type !== "chat") return false
      if (isFreeModel(model)) return false
      return true
    })
    .map((model) => {
      const providerID = model.providerID!
      const id = modelIdOf(model)
      return {
        providerID,
        id,
        cost: getInputCost(model) ?? Number.POSITIVE_INFINITY,
        label: `${providerID}/${id}`,
      }
    })
    .sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost
      return a.label.localeCompare(b.label)
    })
    .filter((entry) => !excluded.has(entry.label))
  return candidates.slice(0, Math.max(0, limit)).map(({ providerID, id }) => ({ providerID, id }))
}

export function pickPaidFallback(
  models: ModelInfoLike[],
  exclude: Array<ModelRef | undefined> = [],
): ModelRef | undefined {
  return pickPaidFallbacks(models, exclude, 1)[0]
}

export function buildCandidateModels(
  configured: ModelRef | undefined,
  selected: ModelRef | undefined,
  fallback: ModelRef | undefined,
): ModelRef[] {
  const candidates: ModelRef[] = []
  for (const candidate of [configured, selected, fallback]) {
    if (!candidate) continue
    if (!candidates.some((existing) => sameModel(existing, candidate))) {
      candidates.push(candidate)
    }
  }
  return candidates
}

export const STATIC_PAID_FALLBACKS: ModelRef[] = [
  { providerID: "openai", id: "gpt-6-luna" },
  { providerID: "opencode", id: "gpt-6-luna" },
  { providerID: "opencode", id: "claude-haiku-5-5" },
]

export function formatEnhanceError(error: unknown, model: ModelRef | undefined): string {
  const message = extractErrorMessage(error)
  if (isFreeLimitError(error)) {
    const attempted = modelLabel(model)
    return [
      `Could not enhance prompt: free model "${attempted}" hit its free usage limit.`,
      `Your composer is currently on a free model. Switch it with /models to a paid model (for example openai/gpt-6-luna or opencode/gpt-6-luna), or pin the enhancer by setting options.model to "openai/gpt-6-luna" in opencode.jsonc.`,
      `Free models work in OpenCode (https://opencode.ai); subscribe to OpenCode Go to keep going: https://opencode.ai/go`,
      message && message !== `Free usage limit reached` ? `(${message})` : "",
    ]
      .filter(Boolean)
      .join(" ")
  }
  return `Could not enhance prompt: ${message}`
}
