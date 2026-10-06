import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { api, getSession, type Session } from '../services/session'
interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string
        nonce: string
        callback: (response: { credential: string }) => void
      }) => void
      renderButton: (element: HTMLElement, options: { theme: string; size: string }) => void
    }
  }
}
declare global {
  interface Window {
    google?: GoogleIdentity
  }
}
export default function Account() {
  const [session, setSession] = useState<Session | null>(null),
    [email, setEmail] = useState(''),
    [code, setCode] = useState(''),
    [challenge, setChallenge] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false)
  const google = useRef<HTMLDivElement>(null)
  useEffect(() => {
    getSession()
      .then(setSession)
      .catch((e) => setMessage(e.message))
  }, [])
  useEffect(() => {
    if (!session?.googleClientId?.endsWith('.apps.googleusercontent.com') || !google.current) return
    let cancelled = false
    const render = () => {
      if (cancelled || !google.current) return
      window.google?.accounts.id.initialize({
        client_id: session.googleClientId!,
        nonce: session.googleNonce,
        callback: (response) => {
          api<Session>('/auth/google', 'POST', { credential: response.credential })
            .then(setSession)
            .catch((e) => setMessage(e.message))
        },
      })
      window.google?.accounts.id.renderButton(google.current, { theme: 'outline', size: 'large' })
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = render
    script.onerror = () => setMessage('Google sign-in could not load. Try email sign-in.')
    document.head.append(script)
    return () => {
      cancelled = true
      script.remove()
    }
  }, [session])
  async function submit() {
    setBusy(true)
    setMessage('')
    try {
      if (challenge) {
        setSession(
          await api<Session>('/auth/email/verify', 'POST', { challengeId: challenge, code }),
        )
        setCode('')
        setChallenge('')
      } else {
        const result = await api<{ challengeId: string; message: string }>(
          '/auth/email/start',
          'POST',
          { email },
        )
        setChallenge(result.challengeId)
        setMessage(result.message)
      }
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="container page">
      <div className="account-card">
        <p className="eyebrow">One Saerbridge account</p>
        <h1>{session?.authenticated ? 'Your account' : 'Sign in or register'}</h1>
        {session?.authenticated ? (
          <>
            <p>Signed in as {session.user?.primaryEmail}.</p>
            <p>
              Personal accounts can explore the public dashboard and manage API keys. Organization
              research is available only to its members.
            </p>
            <div className="workspace-actions">
              <Link className="button primary" to="/research">
                Open workspace
              </Link>
              <button
                onClick={() =>
                  api('/auth/logout', 'POST')
                    .then(() => getSession())
                    .then(setSession)
                    .catch((e) => setMessage(e.message))
                }
              >
                Sign out
              </button>
            </div>
            <h2>Link Google</h2>
            <p>Link Google while signed in to keep the same account.</p>
          </>
        ) : (
          <>
            <p>
              Use an email verification code or your Google account. We do not store a password.
            </p>
            <form
              className="workspace-form"
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
            >
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={Boolean(challenge)}
                />
              </label>
              {challenge && (
                <label>
                  Eight-digit verification code
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{8}"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </label>
              )}
              <button className="button primary" disabled={busy || !session}>
                {busy ? 'Working…' : challenge ? 'Verify and sign in' : 'Send sign-in code'}
              </button>
              {challenge && (
                <button
                  type="button"
                  onClick={() => {
                    setChallenge('')
                    setCode('')
                  }}
                >
                  Use another email
                </button>
              )}
            </form>
          </>
        )}
        <div ref={google} />
        {!session?.googleClientId?.endsWith('.apps.googleusercontent.com') && (
          <p className="muted">Google sign-in awaits deployment configuration.</p>
        )}
        {message && (
          <p className="workspace-message" role="status">
            {message}
          </p>
        )}
        <p className="chart-note">
          Account creation verifies your email. It does not grant organization access or permission
          to publish research.
        </p>
      </div>
    </section>
  )
}
