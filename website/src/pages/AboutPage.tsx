import { Developer } from "../components/Developer"
import { PageHeader } from "../components/PageHeader"
import { SpecPanel } from "../components/SpecPanel"
import { pages } from "../seo"

const page = pages[2]!

export function AboutPage() {
  return (
    <>
      <PageHeader
        id="about-page-title"
        index="02"
        label="About"
        title={page.heading}
        intro={page.intro}
      />

      <section className="page-block" aria-labelledby="developer-title">
        <Developer />
      </section>

      <section className="page-block about-facts" aria-labelledby="facts-title">
        <div className="about-facts-head">
          <p className="eyebrow">
            <span className="eyebrow-index">03</span>
            <span>Project</span>
          </p>
          <h2 id="facts-title">Details.</h2>
        </div>
        <SpecPanel />
      </section>
    </>
  )
}
