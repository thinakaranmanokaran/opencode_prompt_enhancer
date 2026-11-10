import { execFileSync } from "node:child_process"
import { mkdir, stat } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import ffmpegPath from "ffmpeg-static"
import sharp from "sharp"

const website = join(dirname(fileURLToPath(import.meta.url)), "..")
const output = join(website, "public", "media")

if (!ffmpegPath) {
  throw new Error("ffmpeg-static did not provide an executable")
}

await mkdir(output, { recursive: true })

function run(args) {
  console.log(`ffmpeg ${args.join(" ")}`)
  execFileSync(ffmpegPath, args, { stdio: "inherit" })
}

async function size(path) {
  const info = await stat(path)
  console.log(`${path.replace(website, ".")} — ${(info.size / 1024 / 1024).toFixed(2)} MB`)
}

const sourceVideo = join(website, "Tutorial.mp4")

const mp4 = join(output, "tutorial.mp4")
const poster = join(output, "tutorial-poster.jpg")
const gif = join(output, "tutorial.gif")
const preview = join(output, "tutorial-preview.gif")

run([
  "-y",
  "-i",
  sourceVideo,
  "-an",
  "-vf",
  "fps=30",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  mp4,
])

run([
  "-y",
  "-ss",
  "28",
  "-i",
  sourceVideo,
  "-frames:v",
  "1",
  "-q:v",
  "2",
  poster,
])

const posterWebp = join(output, "tutorial-poster.webp")
const posterAvif = join(output, "tutorial-poster.avif")
const poster900 = join(output, "tutorial-poster-900.jpg")
const poster900Webp = join(output, "tutorial-poster-900.webp")
const poster900Avif = join(output, "tutorial-poster-900.avif")
await sharp(poster).webp({ quality: 82 }).toFile(posterWebp)
await sharp(poster).avif({ quality: 55 }).toFile(posterAvif)
await sharp(poster).resize({ width: 900 }).jpeg({ quality: 82 }).toFile(poster900)
await sharp(poster).resize({ width: 900 }).webp({ quality: 80 }).toFile(poster900Webp)
await sharp(poster).resize({ width: 900 }).avif({ quality: 55 }).toFile(poster900Avif)

const mobileHero = join(output, "mobile_hero.png")
const mobileHeroWebp = join(output, "mobile_hero.webp")
const mobileHeroAvif = join(output, "mobile_hero.avif")
await sharp(mobileHero).webp({ quality: 82 }).toFile(mobileHeroWebp)
await sharp(mobileHero).avif({ quality: 55 }).toFile(mobileHeroAvif)

run([
  "-y",
  "-i",
  mp4,
  "-vf",
  "fps=12,scale=1440:-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
  "-loop",
  "0",
  gif,
])

run([
  "-y",
  "-t",
  "12",
  "-i",
  mp4,
  "-vf",
  "fps=8,scale=960:-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
  "-loop",
  "0",
  preview,
])

const brand = await sharp(join(website, "public", "logo.png")).resize(96, 96).png().toBuffer()

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f4f1ea"/>
  <path d="M0 0H1200V630" fill="none" stroke="#141414" stroke-width="1"/>
  <text x="88" y="96" fill="#5c564b" font-family="Arial, Helvetica, sans-serif" font-size="18" letter-spacing="3">OPENCODE / TUI PLUGIN</text>
  <text x="88" y="290" fill="#141414" font-family="Georgia, 'Times New Roman', serif" font-size="108" letter-spacing="-5">Prompt enhancer.</text>
  <text x="88" y="356" fill="#5c564b" font-family="Arial, Helvetica, sans-serif" font-size="30">Turn rough prompts into precise instructions.</text>
  <rect x="88" y="430" width="1024" height="2" fill="#ff4800"/>
  <text x="88" y="500" fill="#141414" font-family="'Courier New', monospace" font-size="22" letter-spacing="1">/enhance</text>
  <text x="88" y="548" fill="#5c564b" font-family="Arial, Helvetica, sans-serif" font-size="20">OpenCode TUI plugin · v1.0.4 · MIT</text>
  <text x="1112" y="548" text-anchor="end" fill="#5c564b" font-family="'Courier New', monospace" font-size="18">thinakaranmanokaran.github.io</text>
  <text x="1112" y="96" text-anchor="end" fill="#a93400" font-family="'Courier New', monospace" font-size="18">01 / 01</text>
</svg>
`

const og = await sharp(Buffer.from(ogSvg))
  .composite([{ input: brand, left: 1020, top: 150 }])
  .png()
  .toFile(join(website, "public", "og.png"))

console.log(`og.png — ${og.width}x${og.height}`)

await size(mp4)
await size(poster)
await size(posterWebp)
await size(posterAvif)
await size(poster900)
await size(poster900Webp)
await size(poster900Avif)
await size(mobileHero)
await size(mobileHeroWebp)
await size(mobileHeroAvif)
await size(gif)
await size(preview)
await size(join(website, "public", "og.png"))
