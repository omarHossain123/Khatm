import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Route, Routes, Link } from 'react-router-dom'
import { configured } from './lib/supabase'
import { StoreProvider, useStore } from './lib/store'
import Home from './pages/Home'
import Surah from './pages/Surah'
import Admin from './pages/Admin'
import './styles.css'

function Header() {
  const { isAdmin } = useStore()
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">۞</span>
          <span>
            IRC Khatm <span className="brand-sub">Reflections</span>
          </span>
        </Link>
        <Link to="/admin" className={isAdmin ? 'admin-pill on' : 'admin-pill'}>
          {isAdmin ? 'Admin' : 'Admin login'}
        </Link>
      </div>
    </header>
  )
}

function App() {
  if (!configured) {
    return (
      <main className="wrap setup">
        <h1>Almost there</h1>
        <p>
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code> file (or
          your host's environment variables). See the README.
        </p>
      </main>
    )
  }
  return (
    <StoreProvider>
      <HashRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/surah/:number" element={<Surah />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <footer className="site-footer wrap">
          Western Islamic Relief Club · Reflections shared here are personal, not scholarly rulings.
        </footer>
      </HashRouter>
    </StoreProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
