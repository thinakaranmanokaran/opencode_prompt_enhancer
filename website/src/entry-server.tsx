import { renderToString } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import App from "./App"

export const base = import.meta.env.BASE_URL
export { buildSeo, pages } from "./seo"

export function render(url: string): string {
  const basename = base.replace(/\/$/, "")
  const location = `${basename}${url.startsWith("/") ? url : `/${url}`}`

  return renderToString(
    <MemoryRouter basename={basename || undefined} initialEntries={[location]}>
      <App />
    </MemoryRouter>,
  )
}
