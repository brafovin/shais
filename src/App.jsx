import { useCallback, useRef, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import ModelsSection from './components/ModelsSection.jsx'
import ModelModal from './components/ModelModal.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  const [active, setActive] = useState(null) // { model, list }
  const returnFocus = useRef(null)

  const open = useCallback((model, trigger, list = []) => {
    returnFocus.current = trigger ?? document.activeElement
    setActive({ model, list })
  }, [])

  const close = useCallback(() => {
    setActive(null)
    returnFocus.current?.focus?.()
  }, [])

  const navigate = useCallback((model) => setActive((a) => ({ ...a, model })), [])

  return (
    <>
      <Navbar />
      <main>
        <Hero onShowDetails={(m) => open(m, document.activeElement)} />
        <ModelsSection onOpen={open} />
      </main>
      <Footer />
      {active && <ModelModal model={active.model} list={active.list} onClose={close} onNavigate={navigate} />}
    </>
  )
}
