import assert from "node:assert/strict"
import test from "node:test"
import type { Context } from "@opencode/plugin/tui/context"
import {
  loadEnhancerOptions,
  matchesPluginPackage,
  mergeEnhancerOptions,
  normalizePluginOptions,
} from "../src/config.ts"

test("matches package names, versions, and local checkout paths", () => {
  assert.equal(matchesPluginPackage("opencode-prompt-enhancer"), true)
  assert.equal(matchesPluginPackage("opencode-prompt-enhancer@1.0.3"), true)
  assert.equal(matchesPluginPackage("."), true)
  assert.equal(matchesPluginPackage("D:/GitHub/Open Source/opencode_prompt_enhancer"), true)
  assert.equal(matchesPluginPackage("D:\\GitHub\\Open Source\\opencode_prompt_enhancer"), true)
  assert.equal(matchesPluginPackage("E:/Thinakaran/Development/Opencode Prompt Enhancer Plugin"), true)
  assert.equal(matchesPluginPackage("C:/Users/dheen"), false)
  assert.equal(matchesPluginPackage("another-plugin"), false)
})

test("normalizes valid options and converts numeric experience", () => {
  const result = normalizePluginOptions(
    {
      role: "  Reviewer  ",
      experience: 12,
      specialties: ["TypeScript", "  ", "SQL"],
      style: "structured",
      maxWords: 150,
      model: "anthropic/claude-sonnet-4",
    },
    "test",
  )

  assert.deepEqual(result.values, {
    role: "Reviewer",
    experience: "12",
    specialties: ["TypeScript", "SQL"],
    style: "structured",
    maxWords: 150,
    model: { providerID: "anthropic", id: "claude-sonnet-4" },
  })
  assert.deepEqual(result.warnings, [])
})

test("ignores invalid values and reports a warning", () => {
  const result = normalizePluginOptions(
    {
      style: "verbose",
      maxWords: 0,
      rules: [],
      model: { providerID: "anthropic" },
      unknown: "ignored",
    },
    "project config",
  )

  assert.deepEqual(result.values, {})
  assert.equal(result.warnings.length, 4)
  assert.ok(result.warnings.every((warning) => warning.includes("project config")))
})

test("keeps explicit null values as clear markers", () => {
  const result = normalizePluginOptions({ role: null, tone: "direct" }, "test")

  assert.deepEqual(result.cleared, ["role"])
  assert.deepEqual(result.values, { tone: "direct" })
})

test("normalizes string and object examples", () => {
  const result = normalizePluginOptions(
    {
      examples: ["fix login => repair the login flow", { input: "add tests", output: "add unit tests" }],
    },
    "test",
  )

  assert.deepEqual(result.values.examples, [
    { input: "fix login", output: "repair the login flow" },
    { input: "add tests", output: "add unit tests" },
  ])
})

test("loads options from files that reference the checkout by absolute path", async () => {
  const path = "D:/GitHub/Open Source/opencode_prompt_enhancer"
  const context = {
    location: { directory: path },
    client: {
      config: {
        get: async () => [
          {
            type: "document",
            path: "user.jsonc",
            info: { plugins: [{ package: path, options: { role: "User Role" } }] },
          },
          {
            type: "document",
            path: "project.jsonc",
            info: { plugins: [{ package: path, options: { tone: "direct" } }] },
          },
        ],
      },
    },
    options: { role: "activation role that should not override config" },
  }

  const loaded = await loadEnhancerOptions(context as unknown as Context)

  assert.deepEqual(loaded.options, { role: "User Role", tone: "direct" })
  assert.deepEqual(
    loaded.sources.map((source) => source.path),
    ["user.jsonc", "project.jsonc"],
  )
})

test("merges sources field by field with higher priority winning", () => {
  const merged = mergeEnhancerOptions([
    {
      path: "user",
      kind: "config",
      options: { role: "User Role", tone: "friendly", rules: ["user rule"] },
    },
    {
      path: "project",
      kind: "config",
      options: { role: "Project Role", rules: ["project rule"] },
    },
  ])

  assert.deepEqual(merged.options, {
    role: "Project Role",
    tone: "friendly",
    rules: ["project rule"],
  })
  assert.deepEqual(merged.warnings, [])
})

test("a null in a higher-priority source clears the inherited value", () => {
  const merged = mergeEnhancerOptions([
    { path: "user", kind: "config", options: { role: "User Role", tone: "friendly" } },
    { path: "project", kind: "config", options: { tone: null } },
  ])

  assert.deepEqual(merged.options, { role: "User Role" })
})

test("invalid high-priority values do not erase valid lower-priority values", () => {
  const merged = mergeEnhancerOptions([
    { path: "user", kind: "config", options: { role: "User Role" } },
    { path: "project", kind: "config", options: { role: "   " } },
  ])

  assert.deepEqual(merged.options, { role: "User Role" })
  assert.equal(merged.warnings.length, 1)
})
