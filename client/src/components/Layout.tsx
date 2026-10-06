import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { DemoNotice } from './Feedback'

const navigation = [
  ['/', 'Explore'],
  ['/areas', 'Areas'],
  ['/findings', 'Themes'],
  ['/datasets', 'Datasets'],
  ['/developers', 'API'],
  ['/methodology', 'Methodology'],
  ['/about', 'About'],
]
export function Brand({ research = false }: { research?: boolean }) {
  return (
    <Link
      className="brand"
      to={research ? '/research' : '/'}
      aria-label={research ? 'Nile research overview' : 'Nile home'}
    >
      <span className="brand-mark">N</span>
      <span>
        <span className="eyebrow">{research ? 'Private environment · preview' : 'Saerbridge'}</span>
        <strong>{research ? 'Nile / Research desk' : 'Nile'}</strong>
      </span>
    </Link>
  )
}
export function NileHeader() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [open])
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <button
          ref={button}
          className="mobile-menu icon-button"
          aria-expanded={open}
          aria-controls="public-navigation"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          key={location.pathname}
          id="public-navigation"
          className={open ? 'navigation open' : 'navigation'}
          aria-label="Main navigation"
        >
          {navigation.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
          <Link className="workspace-link" to="/account" onClick={() => setOpen(false)}>
            Your account
          </Link>
        </nav>
      </div>
    </header>
  )
}
export function NileFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand />
            <p>An open-source civic and social-research data platform by Saerbridge.</p>
          </div>
          <div>
            <span className="eyebrow">Explore</span>
            <Link to="/areas">Areas</Link>
            <Link to="/findings">Themes & findings</Link>
            <Link to="/datasets">Datasets</Link>
          </div>
          <div>
            <span className="eyebrow">About</span>
            <Link to="/methodology">Methodology</Link>
            <Link to="/about">
              Open source <ArrowUpRight size={12} />
            </Link>
            <Link to="/developers">API</Link>
          </div>
        </div>
        <DemoNotice />
      </div>
    </footer>
  )
}
export function RouteFocus() {
  const { pathname, hash } = useLocation()
  const initial = useRef(true)
  useEffect(() => {
    document.title = `${pathname === '/' ? 'Explore' : pathname.split('/').filter(Boolean).join(' / ').replaceAll('-', ' ')} — Nile · Saerbridge`
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
      return
    }
    if (initial.current) {
      initial.current = false
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname, hash])
  return null
}
export function PublicLayout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <NileHeader />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <NileFooter />
    </>
  )
}
