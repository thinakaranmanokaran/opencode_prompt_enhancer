import { site } from "../../site.config"
import { HomeScreen } from "../components/HomeScreen"

export function HomePage() {
  return (
    <section className="home-screen-section" id="tutorial" aria-labelledby="home-title">
      <h1 id="home-title" className="sr-only">
        OpenCode Prompt Enhancer
      </h1>
      <p id="home-caption" className="sr-only">
        {site.transcript}
      </p>
      <HomeScreen />
    </section>
  )
}
