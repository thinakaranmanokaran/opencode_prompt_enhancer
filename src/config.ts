import type { Context } from "@opencode/plugin/tui/context"

export const PACKAGE_NAME = "opencode-prompt-enhancer"

export type ModelRef = {
  providerID: string
  id: string
}

export type Example = {
  input: string
  output: string
}

export type EnhancerOptions = {
  role?: string
  experience?: string
  specialties?: string[]
  tone?: string
  style?: "balanced" | "structured" | "minimal"
  language?: string
  maxWords?: number
  template?: string
  rules?: string[]
  examples?: Example[]
  extraInstructions?: string
  model?: ModelRef
}

type NormalizedOptions = {
  values: Record<string, unknown>
  cleared: string[]
  warnings: string[]
}

type ConfigSource = {
  path: string | undefined
  kind: "config" | "activation"
  options: Record<string, unknown>
}

export type ResolvedEnhancerOptions = {
  options: EnhancerOptions
  sources: ConfigSource[]
  warnings: string[]
}

const CLEAR = Symbol("clear")
const ALLOWED_KEYS = new Set([
  "role",
  "experience",
  "specialties",
  "tone",
  "style",
  "language",
  "maxWords",
  "template",
  "rules",
  "examples",
  "extraInstructions",
  "model",
])

const VALID_STYLES = new Set(["balanced", "structured", "minimal"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const values = value
    .map((entry) => nonEmptyString(entry))
    .filter((entry): entry is string => entry !== undefined)
  return values.length > 0 ? values : undefined
}

function normalizeModel(value: unknown): ModelRef | undefined {
  if (typeof value === "string") {
    const slash = value.indexOf("/")
    if (slash <= 0 || slash === value.length - 1) return undefined
    const providerID = value.slice(0, slash).trim()
    const id = value.slice(slash + 1).trim()
    return providerID && id ? { providerID, id } : undefined
  }
  if (isRecord(value)) {
    const providerID = nonEmptyString(value.providerID)
    const id = nonEmptyString(value.id)
    return providerID && id ? { providerID, id } : undefined
  }
  return undefined
}

function normalizeExamples(value: unknown): Example[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined
  const examples: Example[] = []
  for (const entry of value) {
    if (typeof entry === "string") {
      const separator = ["\n=>", "\n->", " => ", " -> "]
        .map((value) => ({ value, index: entry.indexOf(value) }))
        .filter((candidate) => candidate.index > 0)
        .sort((left, right) => left.index - right.index)[0]
      if (separator) {
        const input = entry.slice(0, separator.index).trim()
        const output = entry.slice(separator.index + separator.value.length).trim()
        if (input && output) examples.push({ input, output })
      } else {
        const input = entry.trim()
        if (input) examples.push({ input, output: input })
      }
      continue
    }
    if (isRecord(entry)) {
      const input = nonEmptyString(entry.input)
      const output = nonEmptyString(entry.output)
      if (input && output) examples.push({ input, output })
    }
  }
  return examples.length > 0 ? examples : undefined
}

/**
 * Normalizes one plugin options object. Invalid values are omitted, so a bad
 * high-priority value does not erase a valid lower-priority value. An explicit
 * null is preserved as an intentional clear.
 */
export function normalizePluginOptions(
  options: unknown,
  sourceLabel: string,
): NormalizedOptions {
  const normalized: NormalizedOptions = { values: {}, cleared: [], warnings: [] }
  if (!isRecord(options)) return normalized

  for (const [key, raw] of Object.entries(options)) {
    if (!ALLOWED_KEYS.has(key)) continue

    if (raw === null) {
      normalized.cleared.push(key)
      continue
    }

    let value: unknown
    switch (key) {
      case "role":
      case "tone":
      case "language":
      case "template":
      case "extraInstructions":
        value = nonEmptyString(raw)
        break
      case "experience":
        value =
          typeof raw === "number" && Number.isFinite(raw)
            ? String(raw)
            : nonEmptyString(raw)
        break
      case "specialties":
      case "rules":
        value = stringArray(raw)
        break
      case "style":
        value = VALID_STYLES.has(String(raw)) ? raw : undefined
        break
      case "maxWords":
        value =
          typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 2_000
            ? raw
            : undefined
        break
      case "examples":
        value = normalizeExamples(raw)
        break
      case "model":
        value = normalizeModel(raw)
        break
      default:
        value = undefined
    }

    if (value === undefined) {
      normalized.warnings.push(`Ignored invalid ${key} from ${sourceLabel}.`)
    } else {
      normalized.values[key] = value
    }
  }
  return normalized
}

function assignDeep(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  for (const [key, value] of Object.entries(source)) {
    if (value === CLEAR) {
      delete target[key]
      continue
    }
    const current = target[key]
    target[key] =
      isRecord(current) && isRecord(value) ? assignDeep({ ...current }, value) : value
  }
  return target
}

export function mergeEnhancerOptions(sources: ConfigSource[]): { options: EnhancerOptions; warnings: string[] } {
  const merged: Record<string, unknown> = {}
  const warnings: string[] = []

  for (const source of sources) {
    const label = source.path ?? (source.kind === "activation" ? "activation options" : "an unreadable config file")
    const normalized = normalizePluginOptions(source.options, label)
    warnings.push(...normalized.warnings)
    for (const key of normalized.cleared) merged[key] = CLEAR
    assignDeep(merged, normalized.values)
    // CLEAR markers are only needed while merging; remove any that survive.
    for (const key of [...new Set(normalized.cleared)]) {
      if (merged[key] === CLEAR) delete merged[key]
    }
  }

  return { options: merged as EnhancerOptions, warnings }
}

function packageNames(spec: string): string[] {
  const value = spec.trim()
  if (!value) return []
  const names = [value]
  const at = value.lastIndexOf("@")
  if (at > 0 && (value.startsWith(".") === false || at < value.length - 1)) {
    names.push(value.slice(0, at))
  }
  const withoutScheme = value.replace(/^file:\/\//i, "").replace(/\\/g, "/")
  names.push(withoutScheme)
  const segments = withoutScheme.split("/").filter(Boolean)
  if (segments.length > 0) names.push(segments[segments.length - 1]!)
  return [...new Set(names)]
}

function matchesPluginPackage(spec: string): boolean {
  const currentLocation = (spec: string) =>
    spec === "." || spec === "./" || spec === "./opencode-prompt-enhancer"
  if (currentLocation(spec)) return true
  return packageNames(spec).some(
    (name) =>
      name === PACKAGE_NAME ||
      name.endsWith(`/${PACKAGE_NAME}`) ||
      name.endsWith(`/${PACKAGE_NAME}@`) ||
      name.startsWith(`${PACKAGE_NAME}@`),
  )
}

function isRecordWithKeys(value: unknown): value is Record<string, unknown> {
  return isRecord(value)
}

function readPluginEntries(entries: unknown): ConfigSource[] {
  if (!Array.isArray(entries)) return []
  const sources: ConfigSource[] = []

  for (const entry of entries) {
    if (!isRecordWithKeys(entry) || entry.type !== "document") continue
    const info = isRecordWithKeys(entry.info) ? entry.info : undefined
    const plugins = Array.isArray(info?.plugins) ? (info!.plugins as unknown[]) : []
    const path = typeof entry.path === "string" ? entry.path : undefined

    for (const plugin of plugins) {
      if (typeof plugin === "string") {
        if (matchesPluginPackage(plugin)) sources.push({ path, kind: "config", options: {} })
        continue
      }
      if (!isRecordWithKeys(plugin)) continue
      const packageName = typeof plugin.package === "string" ? plugin.package : ""
      if (!matchesPluginPackage(packageName)) continue
      // Plugin options may be undefined, null, or a record. normalizePluginOptions
      // handles non-object values by ignoring them.
      sources.push({
        path,
        kind: "config",
        options: isRecordWithKeys(plugin.options) ? plugin.options : {},
      })
    }
  }
  return sources
}

function locationDirectory(context: Context): string | undefined {
  const location = context.location as { directory?: string } | undefined
  return typeof location?.directory === "string" && location.directory ? location.directory : undefined
}

/**
 * Reads every config document returned by the host and merges only this
 * plugin's options.
 *
 * OpenCode's config loader gives each plugin one operation (and therefore one
 * `options` object) for a location. Merging the returned documents here is
 * what makes the project options override user options field by field instead
 * of replacing the whole user options object.
 */
export async function loadEnhancerOptions(context: Context): Promise<ResolvedEnhancerOptions> {
  const sources: ConfigSource[] = []
  const warnings: string[] = []

  try {
    const directory = locationDirectory(context)
    const entries = await context.client.config.get(
      directory ? { location: { directory } } : {},
    )
    sources.push(...readPluginEntries(entries))
  } catch (error) {
    warnings.push(`Could not read OpenCode config: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (sources.length === 0 && isRecord(context.options) && Object.keys(context.options).length > 0) {
    sources.push({ kind: "activation", path: undefined, options: context.options })
  }

  const merged = mergeEnhancerOptions(sources)
  return { options: merged.options, sources, warnings: [...warnings, ...merged.warnings] }
}
