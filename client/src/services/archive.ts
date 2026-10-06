import axios from 'axios'
import type { APIResponse, Archive, ResearchOverview } from '../types/domain'
import { publicFinding } from '../utils/privacy'

export const useDemoData = import.meta.env.VITE_DATA_MODE === 'demo'
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
})
export async function getArchive(signal?: AbortSignal): Promise<Archive> {
  const archive = useDemoData
    ? (await import('../data/fixtures')).archiveFixture
    : (await client.get<APIResponse<Archive>>('/nile/public/archive', { signal })).data.data
  return { ...archive, findings: archive.findings.map(publicFinding) }
}
export async function getResearchPreview(): Promise<ResearchOverview> {
  // No private endpoint or authentication claims. Replace only after server-side auth exists.
  return (await import('../data/fixtures')).researchFixture
}
