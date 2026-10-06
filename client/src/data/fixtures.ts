import type { Archive, ResearchOverview } from '../types/domain'
import demo from './township-demo.json'
export const archiveFixture = demo as Archive
export const researchFixture: ResearchOverview = {
  demonstration: true,
  projects: [],
  pipeline: [],
  activity: [],
}
