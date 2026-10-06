import { useEffect, useState, type ReactNode } from 'react'
import { ArchiveContext, type ArchiveState } from '../context/ArchiveContext'
import { getArchive } from '../services/archive'

export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<Omit<ArchiveState, 'retry'>>({
    data: null,
    loading: true,
    error: false,
  })
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    getArchive(controller.signal)
      .then((data) => {
        if (active) setState({ data, loading: false, error: false })
      })
      .catch(() => {
        if (active) setState({ data: null, loading: false, error: true })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [attempt])
  return (
    <ArchiveContext
      value={{
        ...state,
        retry: () => {
          setState({ data: null, loading: true, error: false })
          setAttempt((a) => a + 1)
        },
      }}
    >
      {children}
    </ArchiveContext>
  )
}
