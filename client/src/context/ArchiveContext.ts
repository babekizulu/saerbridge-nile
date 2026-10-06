import { createContext } from 'react'
import type { Archive } from '../types/domain'
export interface ArchiveState {
  data: Archive | null
  loading: boolean
  error: boolean
  retry: () => void
}
export const ArchiveContext = createContext<ArchiveState | null>(null)
