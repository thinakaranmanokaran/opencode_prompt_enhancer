import { site } from "../site.config.ts"

export type PageSeo = {
  path: string
  navLabel: string
  title: string
  description: string
  heading: string
  intro: string
}

export const pages = [
  {
    path: "/",
    navLabel: "Home",
    title: "OpenCode Prompt Enhancer — /enhance tutorial",
    description:
      "Watch the 47-second /enhance tutorial. OpenCode Prompt Enhancer is a free, open-source TUI plugin that turns rough drafts into precise prompts for AI coding agents.",
    heading: "OpenCode Prompt Enhancer tutorial",
    intro:
      "A 47-second walkthrough of /enhance in OpenCode, from a rough draft to a prompt inserted in the composer.",
  },
  {
    path: "/install/",
    navLabel: "Install",
    title: "Install /enhance — OpenCode Prompt Enhancer setup",
    description:
      "Install the OpenCode Prompt Enhancer plugin, run /enhance, and configure persona, rules, examples, templates, and model overrides.",
    heading: "Install /enhance.",
    intro:
      "Add the plugin to OpenCode in one command. Then tune the persona, rules, and model to match how you work.",
  },
  {
    path: "/about/",
    navLabel: "About",
    title: "About OpenCode Prompt Enhancer — Thinakaran Manokaran",
    description:
      "OpenCode Prompt Enhancer is an independent open-source TUI plugin by Thinakaran Manokaran. Learn about the project, its developer, and the stack.",
    heading: "About the project.",
    intro:
      "A small, focused tool for better prompts in OpenCode — built and maintained by Thinakaran Manokaran.",
  },
] satisfies PageSeo[]

export function canonicalFor(page: PageSeo): string {
  return `${site.url}${page.path}`
}

function breadcrumb(page: PageSeo) {
  if (page.path === "/") return undefined
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalFor(page)}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${site.url}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.navLabel,
        item: canonicalFor(page),
      },
    ],
  }
}

function graphFor(page: PageSeo) {
  const canonical = canonicalFor(page)
  const app = {
    "@type": "SoftwareApplication",
    "@id": `${site.url}/#app`,
    name: site.name,
    description: site.description,
    url: `${site.url}/`,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "OpenCode TUI plugin",
    operatingSystem: "Windows, macOS, Linux",
    softwareVersion: site.version,
    softwareRequirements: "OpenCode v2",
    image: `${site.url}/social-icon.png`,
    screenshot: `${site.url}/media/tutorial-poster.jpg`,
    license: "https://opensource.org/licenses/MIT",
    codeRepository: site.repo,
    downloadUrl: site.npm,
    installUrl: site.npm,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    author: { "@id": `${site.url}/#person` },
    creator: { "@id": `${site.url}/#person` },
  }

  const person = {
    "@type": "Person",
    "@id": `${site.url}/#person`,
    name: site.developer.name,
    url: site.developer.portfolio,
    jobTitle: "Software Developer",
    sameAs: [site.developer.portfolio, site.developer.github],
  }

  const website = {
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: `${site.url}/`,
    name: site.name,
    description: site.description,
    inLanguage: "en",
    publisher: { "@id": `${site.url}/#person` },
  }

  const webPage = {
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: page.title,
    description: page.description,
    isPartOf: { "@id": `${site.url}/#website` },
    about: { "@id": `${site.url}/#app` },
    primaryImageOfPage: { "@id": `${site.url}/#poster` },
    inLanguage: "en",
    ...(page.path === "/" ? { mainEntity: { "@id": `${site.url}/#tutorial` } } : {}),
    ...(breadcrumb(page) ? { breadcrumb: { "@id": `${canonical}#breadcrumb` } } : {}),
  }

  const poster = {
    "@type": "ImageObject",
    "@id": `${site.url}/#poster`,
    url: `${site.url}/media/tutorial-poster.jpg`,
    contentUrl: `${site.url}/media/tutorial-poster.jpg`,
    width: site.video.width,
    height: site.video.height,
    caption: "OpenCode Prompt Enhancer tutorial poster",
  }

  const tutorial = {
    "@type": "VideoObject",
    "@id": `${site.url}/#tutorial`,
    name: "OpenCode Prompt Enhancer tutorial",
    description:
      "A 47-second walkthrough of /enhance in OpenCode: enhance a draft, review the result, and insert it into the composer.",
    thumbnailUrl: [`${site.url}/media/tutorial-poster.jpg`],
    uploadDate: site.video.uploadDate,
    duration: site.video.duration,
    contentUrl: `${site.url}/media/tutorial.mp4`,
    embedUrl: `${site.url}/`,
    encodingFormat: "video/mp4",
    width: site.video.width,
    height: site.video.height,
    inLanguage: "en",
    publisher: { "@id": `${site.url}/#person` },
  }

  const faq = {
    "@type": "FAQPage",
    "@id": `${canonical}#faq`,
    mainEntity: site.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }

  const nodes: Array<Record<string, unknown>> = [website, webPage, app, person]
  if (page.path === "/") nodes.push(poster, tutorial)
  if (page.path === "/install/") nodes.push(faq)
  const crumb = breadcrumb(page)
  if (crumb) nodes.push(crumb)

  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

export function buildSeo(page: PageSeo, base: string): string {
  const canonical = canonicalFor(page)
  const image = `${site.url}/og.png`
  const jsonLd = JSON.stringify(graphFor(page)).replaceAll("<", "\\u003c")

  return `<!--seo-start-->
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="author" content="${escapeHtml(site.developer.name)}" />
    <meta name="keywords" content="${escapeHtml(site.keywords.join(", "))}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="color-scheme" content="light" />
    <meta name="theme-color" content="#f4f1ea" />
    <meta name="format-detection" content="telephone=no" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="en" href="${canonical}" />
    <link rel="icon" href="${base}favicons/favicon32.png" sizes="32x32" type="image/png" />
    <link rel="icon" href="${base}favicons/favicon16.png" sizes="16x16" type="image/png" />
    <link rel="icon" href="${base}logo.svg" sizes="any" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="${base}apple-touch-icon.png" />
    <link rel="manifest" href="${base}site.webmanifest" />
    <link rel="me" href="${site.developer.portfolio}" />
    <link rel="me" href="${site.developer.github}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(site.name)}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(page.heading)} — ${escapeHtml(site.name)}" />
    <meta property="og:locale" content="en_GB" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${escapeHtml(page.heading)}" />
    <link rel="preload" as="image" href="${base}logo.svg" type="image/svg+xml" />
    ${
      page.path === "/"
        ? `<link rel="preload" as="image" href="${base}media/mobile_hero.avif" media="(max-width: 700px)" type="image/avif" fetchpriority="high" />
    <link rel="preload" as="image" href="${base}media/tutorial-poster-900.avif" imagesrcset="${base}media/tutorial-poster-900.avif 900w, ${base}media/tutorial-poster.avif 1748w" imagesizes="100vw" media="(min-width: 701px)" type="image/avif" fetchpriority="high" />`
        : ""
    }
    <script type="application/ld+json">${jsonLd}</script>
    <!--seo-end-->`
}

export const homePage = pages[0]
