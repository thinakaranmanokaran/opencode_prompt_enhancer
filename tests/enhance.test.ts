import assert from "node:assert/strict"
import test from "node:test"
import { buildEnhancementPrompt, cleanEnhancedPrompt } from "../src/enhance.ts"

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
