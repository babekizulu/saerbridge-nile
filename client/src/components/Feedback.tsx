import { Component, useContext, type ReactNode } from 'react'
import { ArchiveContext } from '../context/ArchiveContext'
import { useDemoData } from '../services/archive'
import { Link } from 'react-router'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { useArchive } from '../hooks/useArchiveData'
import { DEMO_NOTICE, type Archive } from '../types/domain'

export function DemoNotice() {
  const archive = useContext(ArchiveContext)
  if (!useDemoData && !archive?.data?.releases.some((r) => r.demonstration)) return null
  return (
    <div className="demo-notice">
      <ShieldCheck size={15} aria-hidden="true" />
      {DEMO_NOTICE}
    </div>
  )
}
export function LoadingState() {
  return (
    <div className="loading" role="status">
      <span>Loading the evidence archive…</span>
      <div className="skeleton" />
      <div className="skeleton short" />
      <div className="skeleton" />
    </div>
  )
}
export function EmptyState({
  title = 'No evidence matches these filters.',
  children,
}: {
  title?: string
  children?: ReactNode
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>Try a different place, theme or research wave.</p>
      {children}
    </div>
  )
}
export function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <AlertCircle aria-hidden="true" />
      <h2>The archive could not be loaded.</h2>
      <p>Please check your connection and try again.</p>
      <button onClick={retry}>Try again</button>
    </div>
  )
}
export function ArchiveContent({ children }: { children: (data: Archive) => ReactNode }) {
  const { data, loading, error, retry } = useArchive()
  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState retry={retry} />
  return children(data)
}
export function NotFound() {
  return (
    <div className="page container">
      <p className="eyebrow">404 · Not in the archive</p>
      <h1>We couldn’t find that page.</h1>
      <p>The address may have changed, or this evidence has not been published.</p>
      <Link className="button primary" to="/">
        Return to Explore
      </Link>
    </div>
  )
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <div className="container page">
        <h1>Something interrupted this view.</h1>
        <p>Your research has not been changed.</p>
        <button onClick={() => window.location.reload()}>Reload Nile</button>
      </div>
    ) : (
      this.props.children
    )
  }
}
