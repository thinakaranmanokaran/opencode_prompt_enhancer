import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { buildSeo, homePage } from "./src/seo.ts"

const productionBase = process.env.BASE_PATH ?? "/opencode_prompt_enhancer/"
const base = process.env.npm_lifecycle_event === "dev" ? "/" : productionBase

function seoPlugin() {
  return {
    name: "prompt-enhancer-seo",
    transformIndexHtml(html: string) {
      return html.replace("<!--seo-->", buildSeo(homePage, base))
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), seoPlugin()],
  build: {
    target: "es2022",
    sourcemap: false,
    assetsInlineLimit: 100_000,
  },
})
