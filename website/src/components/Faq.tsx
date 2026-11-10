import { useState } from "react"
import { site } from "../../site.config"

type FaqProps = { index?: string }

export function Faq({ index = "04" }: FaqProps) {
  const [openItems, setOpenItems] = useState<boolean[]>(() =>
    site.faqs.map((_, faqIndex) => faqIndex === 0),
  )

  function toggle(faqIndex: number) {
    setOpenItems((items) => items.map((open, itemIndex) => (itemIndex === faqIndex ? !open : open)))
  }

  return (
    <div className="faq">
      <div className="faq-head">
        <p className="eyebrow">
          <span className="eyebrow-index">{index}</span>
          <span>Questions</span>
        </p>
        <h2 id="faq-title">Good to know.</h2>
      </div>

      <div className="faq-list">
        {site.faqs.map((item, faqIndex) => {
          const open = openItems[faqIndex] ?? false
          const questionID = `faq-question-${faqIndex}`
          const panelID = `faq-panel-${faqIndex}`

          return (
            <div key={item.question} className={open ? "faq-item is-open" : "faq-item"}>
              <h3 className="faq-question">
                <button
                  type="button"
                  id={questionID}
                  aria-expanded={open}
                  aria-controls={panelID}
                  onClick={() => toggle(faqIndex)}
                >
                  <span>{item.question}</span>
                  <span className="faq-icon" aria-hidden="true" />
                </button>
              </h3>

              <div
                id={panelID}
                role="region"
                aria-labelledby={questionID}
                aria-hidden={!open}
                className={open ? "faq-panel is-open" : "faq-panel"}
              >
                <div className="faq-panel-inner">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
