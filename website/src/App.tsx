import { Link, Route, Routes, useLocation } from "react-router-dom"
import { Footer } from "./components/Footer"
import { ScrollToTop } from "./components/ScrollToTop"
import { TopRail } from "./components/TopRail"
import { AboutPage } from "./pages/AboutPage"
import { HomePage } from "./pages/HomePage"
import { InstallPage } from "./pages/InstallPage"

function NotFoundPage() {
  return (
    <section className="home-section" aria-labelledby="not-found-title">
      <div className="not-found">
        <p className="eyebrow">
          <span className="eyebrow-index">404</span>
          <span>Not found</span>
        </p>
        <h1 id="not-found-title">That page is not here.</h1>
        <p>
          <Link to="/">Return to the /enhance tutorial</Link>.
        </p>
      </div>
    </section>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const isHome = pathname === "/"

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className={isHome ? "shell shell--home" : "shell"}>
        <TopRail />
        <ScrollToTop />

        <main id="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/install/" element={<InstallPage />} />
            <Route path="/about/" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </>
  )
}
