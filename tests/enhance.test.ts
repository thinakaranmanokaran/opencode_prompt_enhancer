import assert from "node:assert/strict"
import test from "node:test"
import {
  buildEnhancementPrompt,
  cleanEnhancedPrompt,
  formatEnhanceError,
  isFreeLimitError,
  isFreeModel,
  pickPaidFallback,
  pickPaidFallbacks,
} from "../src/enhance.ts"

test("builds the default enhancement prompt with the draft and rules", () => {
  const prompt = buildEnhancementPrompt({ role: "Software Developer", tone: "direct" }, "fix login")

  assert.match(prompt, /You are Software Developer\./)
  assert.match(prompt, /Use a direct tone\./)
  assert.match(prompt, /Preserve the user's intent/)
  assert.match(prompt, /User draft:\nfix login$/)
})

test("adds years to a numeric experience value", () => {
  const prompt = buildEnhancementPrompt({ experience: "25" }, "fix login")

  assert.match(prompt, /with 25 years of experience/)
})

test("renders custom placeholders and leaves unknown placeholders alone", () => {
  const prompt = buildEnhancementPrompt(
    {
      template: "{{role}}|{{experience}}|{{specialties}}|{{draft}}|{{unknown}}",
      role: "Reviewer",
      experience: "10 years",
      specialties: ["TypeScript", "SQL"],
    },
    "review this",
  )

  assert.equal(prompt, "Reviewer|10 years|TypeScript, SQL|review this|{{unknown}}")
})

test("appends the draft when a custom template omits the draft placeholder", () => {
  const prompt = buildEnhancementPrompt({ template: "Rewrite carefully." }, "add tests")

  assert.equal(prompt, "Rewrite carefully.\n\nUser draft:\nadd tests")
})

test("includes the word limit and extra instructions when configured", () => {
  const prompt = buildEnhancementPrompt(
    { maxWords: 120, extraInstructions: "Keep the original names." },
    "refactor auth",
  )

  assert.match(prompt, /at most 120 words/)
  assert.match(prompt, /Additional instructions:\nKeep the original names\./)
})

test("cleans a fenced model response", () => {
  assert.equal(cleanEnhancedPrompt("```markdown\nFix the login flow.\n```"), "Fix the login flow.")
})

test("cleans a leading preamble", () => {
  assert.equal(cleanEnhancedPrompt("Here is the enhanced prompt:\n\nFix the login flow."), "Fix the login flow.")
})

test("cleans one outer quote pair", () => {
  assert.equal(cleanEnhancedPrompt('"Fix the login flow."'), "Fix the login flow.")
  assert.equal(cleanEnhancedPrompt("“Fix the login flow.”"), "Fix the login flow.")
})

test("returns an empty string for an empty response", () => {
  assert.equal(cleanEnhancedPrompt("   \n\t  "), "")
})

test("detects free usage limit errors", () => {
  assert.equal(
    isFreeLimitError(
      new Error(
        "Free usage limit reached. Free models work in OpenCode (https://opencode.ai); subscribe to OpenCode Go to keep going: https://opencode.ai/go",
      ),
    ),
    true,
  )
  assert.equal(isFreeLimitError(new Error("network timeout")), false)
  assert.equal(isFreeLimitError("Free Usage Limit Reached"), true)
})

test("detects free models by zero cost or -free suffix", () => {
  assert.equal(isFreeModel({ providerID: "opencode", id: "iceman-free", cost: [{ input: 0 }] }), true)
  assert.equal(isFreeModel({ providerID: "opencode", id: "big-pickle", cost: [{ input: 0 }] }), true)
  assert.equal(isFreeModel({ providerID: "opencode", id: "beam-free", cost: [{ input: 0 }] }), true)
  assert.equal(isFreeModel({ providerID: "openai", id: "gpt-6-luna", cost: [{ input: 0.1 }] }), false)
  assert.equal(isFreeModel({ providerID: "opencode", id: "mystery-free" }), true)
  assert.equal(isFreeModel({ providerID: "opencode", id: "disabled-free", cost: [{ input: 0 }], enabled: false }), false)
})

test("picks the cheapest paid fallback model", () => {
  const models = [
    { providerID: "opencode", id: "iceman-free", cost: [{ input: 0 }], enabled: true },
    { providerID: "openai", id: "gpt-6.1-sol", cost: [{ input: 2 }], enabled: true },
    { providerID: "openai", id: "gpt-6-luna", cost: [{ input: 0.1 }], enabled: true },
    { providerID: "opencode", id: "gpt-6-luna", cost: [{ input: 0.1 }], enabled: true },
    { providerID: "openai", id: "off", cost: [{ input: 0.05 }], enabled: false },
    { providerID: "opencode", id: "img", cost: [{ input: 0 }], enabled: true, type: "image" },
  ]

  assert.deepEqual(pickPaidFallback(models), { providerID: "openai", id: "gpt-6-luna" })
  assert.deepEqual(
    pickPaidFallbacks(models, [{ providerID: "openai", id: "gpt-6-luna" }]),
    [{ providerID: "opencode", id: "gpt-6-luna" }, { providerID: "openai", id: "gpt-6.1-sol" }],
  )
  assert.equal(pickPaidFallback(models.map((m) => ({ ...m, enabled: false }))), undefined)
})

test("formats an actionable free-limit error", () => {
  const message = formatEnhanceError(
    new Error(
      "Free usage limit reached. Free models work in OpenCode (https://opencode.ai); subscribe to OpenCode Go to keep going: https://opencode.ai/go",
    ),
    { providerID: "opencode", id: "iceman-free" },
  )

  assert.match(message, /Could not enhance prompt/)
  assert.match(message, /opencode\/iceman-free/)
  assert.match(message, /\/models/)
  assert.match(message, /options\.model/)
  assert.match(message, /https:\/\/opencode\.ai\/go/)
})

test("formats a generic enhance error without free-limit advice", () => {
  assert.equal(formatEnhanceError(new Error("boom"), undefined), "Could not enhance prompt: boom")
})
