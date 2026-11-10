import { Faq } from "../components/Faq"
import { FeatureNotes } from "../components/FeatureNotes"
import { Install } from "../components/Install"
import { PageHeader } from "../components/PageHeader"
import { pages } from "../seo"

const page = pages[1]!

export function InstallPage() {
  return (
    <>
      <PageHeader
        id="install-page-title"
        index="01"
        label="Install"
        title={page.heading}
        intro={page.intro}
      />

      <section className="page-block" aria-labelledby="notes-title">
        <FeatureNotes />
      </section>

      <section className="page-block" aria-labelledby="install-title">
        <Install />
      </section>

      <section className="page-block" aria-labelledby="faq-title">
        <Faq />
      </section>
    </>
  )
}
