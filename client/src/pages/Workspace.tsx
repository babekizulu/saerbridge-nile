import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, getSession, type Session } from '../services/session'
interface Org {
  id: string
  name: string
  kind: string
  role: string
}
interface Transcript {
  id: string
  title: string
  township: string
  status: string
  demonstration: boolean
  analysis?: { themes: { slug: string; evidence: string }[] }
  failure_code?: string
}
interface Detail {
  id: string
  text: string
  consentReference: string
  status: string
  analysis?: Transcript['analysis']
}
interface Key {
  id: string
  label: string
  organization_id: string | null
  revoked_at: string | null
  expires_at: string
}
export default function Workspace() {
  const [session, setSession] = useState<Session | null>(null),
    [orgs, setOrgs] = useState<Org[]>([]),
    [org, setOrg] = useState(''),
    [items, setItems] = useState<Transcript[]>([]),
    [keys, setKeys] = useState<Key[]>([]),
    [tab, setTab] = useState('Research'),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [detail, setDetail] = useState<Detail | null>(null),
    [token, setToken] = useState('')
  const selected = orgs.find((o) => o.id === org),
    canWrite = Boolean(
      selected &&
      (selected.role === 'owner' ||
        selected.role === 'researcher' ||
        (selected.kind === 'saerbridge' && session?.user?.role === 'admin')),
    )
  useEffect(() => {
    getSession()
      .then(async (s) => {
        setSession(s)
        if (s.authenticated) {
          setOrgs(await api<Org[]>('/nile/organizations'))
          setKeys(await api<Key[]>('/nile/keys'))
        }
      })
      .catch((e) => setMessage(e.message))
  }, [])
  useEffect(() => {
    let active = true
    if (org)
      api<Transcript[]>(`/nile/organizations/${org}/transcripts`)
        .then((rows) => {
          if (active) setItems(rows)
        })
        .catch((e) => setMessage(e.message))
    return () => {
      active = false
    }
  }, [org])
  async function action(task: () => Promise<void>) {
    setBusy(true)
    setMessage('')
    try {
      await task()
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const reload = async () => {
    if (org) setItems(await api<Transcript[]>(`/nile/organizations/${org}/transcripts`))
  }
  if (!session?.authenticated)
    return (
      <main className="container page">
        <h1>Research workspace</h1>
        <p>Sign in to manage API access or your organization’s private research.</p>
        <Link className="button primary" to="/account">
          Sign in or register
        </Link>
        {message && <p role="alert">{message}</p>}
      </main>
    )
  return (
    <main className="container page">
      <Link to="/">← Public dashboard</Link>
      <p className="eyebrow">Saerbridge Nile</p>
      <h1>Your workspace</h1>
      <p>
        Public evidence comes from reviewed Saerbridge research. Organization transcripts stay
        within their organization.
      </p>
      <div className="workspace-grid">
        <aside className="workspace-nav">
          {['Research', 'Organizations', 'API keys', 'Publication']
            .filter((t) => t !== 'Publication' || session.user?.role === 'admin')
            .map((t) => (
              <button
                aria-pressed={tab === t}
                key={t}
                onClick={() => {
                  setTab(t)
                  setDetail(null)
                  setToken('')
                }}
              >
                {t}
              </button>
            ))}
          <Link to="/account">Account settings</Link>
        </aside>
        <div className="workspace-panel">
          {message && (
            <p role="status" className="workspace-message">
              {message}
            </p>
          )}
          {tab === 'Research' && (
            <>
              <h2>Organization research</h2>
              <label htmlFor="org-select">Organization</label>
              <select
                id="org-select"
                value={org}
                onChange={(e) => {
                  setOrg(e.target.value)
                  setDetail(null)
                }}
              >
                <option value="">Choose an organization</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              {!orgs.length && (
                <p>
                  You have a personal account. Join an organization through its owner, or register
                  an organization in the Organizations tab.
                </p>
              )}
              {org && (
                <>
                  <button onClick={() => void action(reload)}>Refresh status</button>
                  <p className="chart-note">
                    Private to {selected?.name}.{' '}
                    {selected?.kind === 'saerbridge'
                      ? 'An administrator must explicitly publish an approved aggregate release.'
                      : 'These findings are never included in the public dashboard.'}
                  </p>
                  {items.map((t) => (
                    <article className="transcript-row" key={t.id}>
                      <div>
                        <strong>{t.title}</strong>
                        <p>
                          {t.township} · {t.status.replaceAll('_', ' ')}
                          {t.demonstration ? ' · Synthetic test' : ''}
                        </p>
                        {t.failure_code && <p>Analysis needs support review: {t.failure_code}</p>}
                        <ul>
                          {t.analysis?.themes.map((x) => (
                            <li key={x.slug}>
                              {x.slug}: “{x.evidence}”
                            </li>
                          ))}
                        </ul>
                      </div>
                      {canWrite && (
                        <button
                          onClick={() =>
                            void action(async () => {
                              setDetail(
                                await api<Detail>(`/nile/organizations/${org}/transcripts/${t.id}`),
                              )
                            })
                          }
                        >
                          Review transcript
                        </button>
                      )}
                    </article>
                  ))}
                  {detail && canWrite && (
                    <section className="account-card">
                      <h3>Transcript review</h3>
                      <p>Consent reference: {detail.consentReference}</p>
                      <label htmlFor="redacted">De-identified transcript text</label>
                      <textarea
                        id="redacted"
                        rows={12}
                        style={{ width: '100%' }}
                        value={detail.text}
                        onChange={(e) => setDetail({ ...detail, text: e.target.value })}
                      />
                      {detail.status === 'privacy_review' && (
                        <form
                          className="workspace-form"
                          onSubmit={(e) => {
                            e.preventDefault()
                            void action(async () => {
                              await api(
                                `/nile/organizations/${org}/transcripts/${detail.id}/privacy-review`,
                                'POST',
                                {
                                  redactedText: detail.text,
                                  consentVerified: true,
                                  identifiersRemoved: true,
                                  providerProcessingApproved: true,
                                },
                              )
                              setDetail(null)
                              await reload()
                              setMessage('Queued for AI analysis. A human evidence review follows.')
                            })
                          }}
                        >
                          <label className="check-label">
                            <input type="checkbox" required />I checked the consent record, removed
                            direct and indirect identifiers, and confirmed permission for the
                            configured AI provider to process this text.
                          </label>
                          <button disabled={busy}>Approve privacy review and queue analysis</button>
                        </form>
                      )}
                      {detail.status === 'analysis_review' && (
                        <>
                          <pre style={{ whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(detail.analysis, null, 2)}
                          </pre>
                          <form
                            className="workspace-form"
                            onSubmit={(e) => {
                              e.preventDefault()
                              void action(async () => {
                                await api(
                                  `/nile/organizations/${org}/transcripts/${detail.id}/review`,
                                  'POST',
                                  { decision: 'approved', evidenceChecked: true },
                                )
                                setDetail(null)
                                await reload()
                              })
                            }}
                          >
                            <label className="check-label">
                              <input type="checkbox" required />I checked each theme against the
                              transcript and accept this coding.
                            </label>
                            <button disabled={busy}>Approve findings</button>
                          </form>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void action(async () => {
                                await api(
                                  `/nile/organizations/${org}/transcripts/${detail.id}/review`,
                                  'POST',
                                  { decision: 'rejected', evidenceChecked: true },
                                )
                                setDetail(null)
                                await reload()
                              })
                            }
                          >
                            Reject analysis
                          </button>
                        </>
                      )}
                      <button onClick={() => setDetail(null)}>Close review</button>
                    </section>
                  )}
                  {canWrite && (
                    <section className="account-card">
                      <h3>Add a transcript</h3>
                      <p>
                        Plain UTF-8 .txt files or pasted text only. Maximum 40,000 characters.
                        Uploads start in privacy review.
                      </p>
                      <form
                        className="workspace-form"
                        onSubmit={(e) => {
                          e.preventDefault()
                          const form = e.currentTarget,
                            values = new FormData(form)
                          void action(async () => {
                            await api(`/nile/organizations/${org}/transcripts`, 'POST', {
                              title: values.get('title'),
                              township: values.get('township'),
                              text: values.get('text'),
                              consentReference: values.get('consent'),
                              permissionConfirmed: true,
                              demonstration: values.get('demo') === 'on',
                            })
                            form.reset()
                            await reload()
                            setMessage('Transcript received for privacy review.')
                          })
                        }}
                      >
                        <label>
                          Title
                          <input name="title" minLength={3} maxLength={120} required />
                        </label>
                        <label>
                          Township
                          <select name="township">
                            <option value="greenbushes">Greenbushes</option>
                            <option value="walmer-township">Walmer township</option>
                          </select>
                        </label>
                        <label>
                          Load a text file
                          <input
                            type="file"
                            accept=".txt,text/plain"
                            onChange={(e) => {
                              const file = e.target.files?.[0],
                                form = e.target.form
                              if (!file || !form) return
                              if (!file.name.toLowerCase().endsWith('.txt') || file.size > 160000) {
                                setMessage('Choose a plain .txt file under 160 KB.')
                                return
                              }
                              void file.text().then((text) => {
                                const input = form.elements.namedItem('text') as HTMLTextAreaElement
                                input.value = text
                              })
                            }}
                          />
                        </label>
                        <label>
                          Transcript text
                          <textarea name="text" required minLength={80} maxLength={40000} />
                        </label>
                        <label>
                          Consent or lawful-authority reference
                          <input name="consent" minLength={4} maxLength={200} required />
                        </label>
                        <label className="check-label">
                          <input type="checkbox" name="demo" />
                          This is synthetic test data
                        </label>
                        <label className="check-label">
                          <input type="checkbox" required />I have authority to upload this
                          transcript and have checked its provenance.
                        </label>
                        <button className="button primary" disabled={busy}>
                          Submit for privacy review
                        </button>
                      </form>
                    </section>
                  )}
                </>
              )}
            </>
          )}
          {tab === 'Organizations' && (
            <>
              <h2>Organizations</h2>
              <ul>
                {orgs.map((o) => (
                  <li key={o.id}>
                    {o.name} · {o.role || 'Saerbridge administrator'}
                  </li>
                ))}
              </ul>
              <form
                className="workspace-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  const f = e.currentTarget,
                    v = new FormData(f)
                  void action(async () => {
                    await api('/nile/organizations', 'POST', { name: v.get('name') })
                    setOrgs(await api<Org[]>('/nile/organizations'))
                    f.reset()
                    setMessage('Organization created. Its research is private.')
                  })
                }}
              >
                <label>
                  Organization name
                  <input name="name" required minLength={3} maxLength={100} />
                </label>
                <button disabled={busy}>Create organization</button>
              </form>
              <h3>Add a registered member</h3>
              <form
                className="workspace-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  const v = new FormData(e.currentTarget)
                  void action(async () => {
                    await api(`/nile/organizations/${v.get('org')}/members`, 'POST', {
                      email: v.get('email'),
                      role: v.get('role'),
                    })
                    setMessage('Member added.')
                  })
                }}
              >
                <label>
                  Organization
                  <select name="org" required>
                    <option value="">Choose an organization you own</option>
                    {orgs
                      .filter((o) => o.role === 'owner')
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Registered email
                  <input type="email" name="email" required />
                </label>
                <label>
                  Role
                  <select name="role">
                    <option value="viewer">Viewer</option>
                    <option value="researcher">Researcher</option>
                  </select>
                </label>
                <button disabled={busy}>Add member</button>
              </form>
            </>
          )}
          {tab === 'API keys' && (
            <>
              <h2>API access</h2>
              <p>
                The public archive is accessible without a key. Organization keys provide read-only
                access to that organization’s findings. Store keys on your server.
              </p>
              <form
                className="workspace-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  const v = new FormData(e.currentTarget)
                  void action(async () => {
                    const result = await api<{ token: string }>('/nile/keys', 'POST', {
                      label: v.get('label'),
                      organizationId: v.get('org') || null,
                    })
                    setToken(result.token)
                    setKeys(await api<Key[]>('/nile/keys'))
                  })
                }}
              >
                <label>
                  Key label
                  <input name="label" required minLength={2} maxLength={80} />
                </label>
                <label>
                  Scope
                  <select name="org">
                    <option value="">Public research only</option>
                    {orgs.map((o) => (
                      <option value={o.id} key={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button disabled={busy}>Create 90-day API key</button>
              </form>
              {token && (
                <p className="workspace-message">
                  Copy this key now. It is shown once:{' '}
                  <code className="token-display">{token}</code>
                </p>
              )}
              {keys.map((k) => (
                <div className="transcript-row" key={k.id}>
                  <span>
                    {k.label} · {k.revoked_at ? 'Revoked' : `Expires ${k.expires_at.slice(0, 10)}`}
                  </span>
                  {!k.revoked_at && (
                    <button
                      onClick={() =>
                        void action(async () => {
                          await api(`/nile/keys/${k.id}`, 'DELETE')
                          setKeys(await api<Key[]>('/nile/keys'))
                        })
                      }
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
          {tab === 'Publication' && session.user?.role === 'admin' && (
            <>
              <h2>Publish Saerbridge research</h2>
              <p>
                Only independently reviewed Saerbridge transcripts are eligible. Organization
                uploads are excluded. Cells and complements below ten are suppressed; transcript
                text and quotes are never published.
              </p>
              <form
                className="workspace-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  const v = new FormData(e.currentTarget)
                  void action(async () => {
                    const r = await api<{ id: string }>('/nile/admin/releases', 'POST', {
                      demonstration: v.get('demo') === 'on',
                      methodology: v.get('methodology'),
                      disclosureReviewComplete: true,
                    })
                    setMessage(
                      `Release published: ${r.id}. Refresh the public dashboard to view it.`,
                    )
                  })
                }}
              >
                <label>
                  Methodology version
                  <input name="methodology" minLength={5} maxLength={120} required />
                </label>
                <label className="check-label">
                  <input type="checkbox" name="demo" />
                  Publish synthetic test data only
                </label>
                <label className="check-label">
                  <input type="checkbox" required />I completed disclosure review, checked
                  provenance and publication authority, and approve public release.
                </label>
                <button className="button primary" disabled={busy}>
                  Publish aggregate release
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
