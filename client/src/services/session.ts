export interface Session {
  authenticated: boolean
  csrfToken: string
  googleNonce: string
  googleClientId?: string
  user: null | { id: string; primaryEmail: string; displayName: string; role: string }
}
const base = import.meta.env.VITE_API_BASE_URL || '/api/v1'
let csrf = ''
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(base + path, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return undefined as T
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'The request could not be completed.')
  if (data.data?.csrfToken) csrf = data.data.csrfToken
  return data.data as T
}
export const getSession = () => api<Session>('/auth/session')
