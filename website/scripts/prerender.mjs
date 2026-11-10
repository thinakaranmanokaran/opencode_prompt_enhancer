import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { pathToFileURL } from "node:url"
import { fileURLToPath } from "node:url"

const website = join(dirname(fileURLToPath(import.meta.url)), "..")
const distDir = join(website, "dist")
const templateFile = join(distDir, "index.html")
const serverEntry = join(website, "dist-ssr", "entry-server.js")

const template = await readFile(templateFile, "utf8")
const { render, pages, base, buildSeo } = await import(pathToFileURL(serverEntry).href)

for (const page of pages) {
  const appHtml = render(page.path)
  if (!appHtml.includes("<h1")) {
    throw new Error(`Prerender produced no <h1> content for ${page.path}`)
  }

  const html = template
    .replace(/<!--seo-start-->[\s\S]*?<!--seo-end-->/, buildSeo(page, base))
    .replace("<!--app-html-->", appHtml)

  if (html === template) {
    throw new Error(`Prerender could not inject content for ${page.path}`)
  }

  const output =
    page.path === "/" ? templateFile : join(distDir, page.path.replace(/^\/|\/$/g, ""), "index.html")
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, html)
  console.log(`prerendered ${page.path} -> ${output}`)
}
