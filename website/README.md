# Website

Video-first site for OpenCode Prompt Enhancer.

- `/` — full-screen tutorial video on desktop, image + text panel on mobile
- `/install/` — install steps, feature notes, FAQ
- `/about/` — developer and project details
- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4
- System font stack (Helvetica Neue / Helvetica / Arial)
- Mobile hamburger navigation
- Prerendered HTML for every route at build time
- GitHub Pages deployment from `.github/workflows/pages.yml`

## Commands

```bash
npm install
npm run dev      # local development
npm run build    # client build, SSR build, prerender
npm run preview  # preview the production build
npm run media    # rebuild all optimized media from ./Tutorial.mp4
```

For a custom domain, build with an empty base path:

```bash
BASE_PATH=/ npm run build
```

Then update `src/data/details.json` with the production URL. Everything the build needs lives in this directory; no files outside `website/` are required.

## Structure

```text
src/
  App.tsx               routes and page shell
  pages/                Home, Install, About
  components/           header, tutorial player, notes, install, developer, FAQ, footer
  data/                 site metadata and plugin version (update meta.json when the plugin version changes)
  entry-server.tsx      SSR entry used by the prerender step
  main.tsx              client hydration
  seo.ts                per-route metadata and JSON-LD
  styles.css            design tokens and layout
scripts/
  prepare-media.mjs     transcodes the MP4, generates the GIF, poster variants and OG image
  prerender.mjs         injects rendered HTML into dist/index.html
public/
  media/                optimized tutorial assets (generated)
  favicons/             favicons and brand assets
  robots.txt
  sitemap.xml
  site.webmanifest
  og.png
```

## Media policy

The original `Tutorial.gif` is 155 MB and exceeds GitHub's 100 MB file limit, so it stays local at `website/Tutorial.gif` and is ignored by git. The web GIF is generated from the higher-quality `website/Tutorial.mp4`. On desktop the video autoplays muted and loops with no visible controls; clicking the video or the icon-only pause button toggles playback. On mobile the home page shows a poster image and text panel instead of the video. The site ships:

- `tutorial.mp4` — 675 KB, 1752×1080, 30 fps, no audio
- `tutorial.gif` — 1.75 MB, 1440×888, 12 fps, 128 colours, available asset
- `tutorial-poster.jpg` — 176 KB, full-size fallback
- `tutorial-poster.avif` / `.webp` — 50 KB / 75 KB
- `tutorial-poster-900.avif` / `.webp` / `.jpg` — 24 KB / 32 KB / 56 KB, desktop srcset
- `mobile_hero.png` — 119 KB, mobile hero image
- `mobile_hero.avif` / `.webp` — 9 KB / 12 KB
- `tutorial-preview.gif` — 250 KB, used by the root README
- `og.png` — 1200×630 social card

## SEO

- Prerendered H1, copy, transcript, developer block, and FAQ
- Canonical, Open Graph, Twitter cards
- JSON-LD for WebSite, WebPage, SoftwareApplication, Person, VideoObject, ImageObject, FAQPage
- `robots.txt`, `sitemap.xml`, web manifest, favicons
- One H1, logical heading order, visible FAQ content
- No third-party scripts, fonts, cookies, or trackers

## Lighthouse

Verified on the production build for `/`, `/install/`, and `/about/`:

| Category | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 100 | 100 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |
