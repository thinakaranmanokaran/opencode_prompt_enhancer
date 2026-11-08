import { transformAsync } from "@babel/core"
import ts from "@babel/preset-typescript"
import solid from "babel-preset-solid"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

// Mirror @opentui/solid/scripts/solid-transform.js: solid preset (universal
// generate, @opentui/solid module) for .tsx plus TS stripping. Preserves
// fine-grained reactivity (getters, effects) that a plain tsc emit loses.
const jsxPattern = /\.[cm]?[jt]sx$/
const tsPattern = /\.[cm]?tsx?$/

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const srcDir = join(root, "src")
const outDir = join(root, "dist")

const files = ["index.ts", "config.ts", "enhance.ts", "tui.tsx"]

for (const file of files) {
  const srcPath = join(srcDir, file)
  const outPath = join(outDir, file.replace(/\.tsx?$/, ".js"))
  const code = await readFile(srcPath, "utf8")
  const presets = []
  if (jsxPattern.test(srcPath)) {
    presets.push([solid, { moduleName: "@opentui/solid", generate: "universal" }])
  }
  if (tsPattern.test(srcPath)) {
    presets.push([ts])
  }
  const result = await transformAsync(code, {
    filename: srcPath,
    configFile: false,
    babelrc: false,
    presets,
  })
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, result.code ?? code)
  console.log(`built ${relative(root, outPath)}`)
}
