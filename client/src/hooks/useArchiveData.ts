import { useContext } from 'react'
import { ArchiveContext } from '../context/ArchiveContext'
export function useArchive() {
  const value = useContext(ArchiveContext)
  if (!value) throw new Error('ArchiveProvider is required')
  return value
}
