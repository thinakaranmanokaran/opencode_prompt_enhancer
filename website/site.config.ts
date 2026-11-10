import details from "./src/data/details.json" with { type: "json" }
import meta from "./src/data/meta.json" with { type: "json" }

const repo = details.prod.repo.replace(/\/+$/, "")
const siteUrl = details.prod.site.replace(/\/+$/, "")

export type Faq = {
  question: string
  answer: string
}

export const site = {
  name: "OpenCode Prompt Enhancer",
  shortName: "Prompt Enhancer",
  title: "OpenCode Prompt Enhancer — /enhance for AI coding prompts",
  description:
    "A free OpenCode TUI plugin that turns rough drafts into clear, specific prompts with /enhance. Session-aware, configurable, and open source.",
  keywords: [
    "OpenCode prompt enhancer",
    "OpenCode plugin",
    "enhance prompt",
    "AI coding agent",
    "prompt engineering",
    "TUI plugin",
    "TypeScript",
  ],
  url: siteUrl,
  repo,
  npm: "https://www.npmjs.com/package/opencode-prompt-enhancer",
  docs: `${repo}/blob/main/README.md`,
  license: `${repo}/blob/main/LICENSE`,
  version: meta.version,
  licenseName: meta.license,
  year: 2026,
  installCommand: "opencode plugin add opencode-prompt-enhancer",
  developer: {
    name: details.developer.name,
    portfolio: details.developer.portfolio.replace(/\/+$/, ""),
    github: "https://github.com/thinakaranmanokaran",
  },
  video: {
    uploadDate: "2026-11-10",
    duration: "PT47S",
    width: 1748,
    height: 1080,
  },
  transcript:
    "The tutorial starts with a rough draft in the OpenCode composer. /enhance builds a persona-aware prompt, sends it through the open session, and presents the cleaned rewrite in a scrollable modal. Enter inserts the result into the composer, c copies it, and r retries the enhancement.",
  faqs: [
    {
      question: "What is /enhance?",
      answer:
        "It is an OpenCode TUI command that rewrites a rough draft into a clearer, more specific prompt for an AI coding agent. The result opens in a modal where you can insert it, copy it, or retry.",
    },
    {
      question: "Does it work without an open session?",
      answer:
        "Yes. From the OpenCode home screen, /enhance creates a temporary session with the selected model, generates the result, and removes that session immediately.",
    },
    {
      question: "Which model does it use?",
      answer:
        "With a session open, it uses the session model and context. From the home screen it uses the currently selected model. You can pin a different model in the plugin options.",
    },
  ] satisfies Faq[],
}
