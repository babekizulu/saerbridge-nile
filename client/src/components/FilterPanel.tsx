import { useRef } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import type { Area, Theme } from '../types/domain'

export interface Filters {
  area: string
  theme: string
  category: string
  wave: string
}
const emptyFilters: Filters = { area: '', theme: '', category: '', wave: '' }
export function FilterPanel({
  areas,
  themes,
  value,
  onChange,
}: {
  areas: Area[]
  themes: Theme[]
  value: Filters
  onChange: (value: Filters) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  function controls(prefix: string) {
    return (
      <>
        <label htmlFor={`${prefix}-area`}>
          Area
          <select
            id={`${prefix}-area`}
            value={value.area}
            onChange={(e) => onChange({ ...value, area: e.target.value })}
          >
            <option value="">All areas</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${prefix}-theme`}>
          Theme
          <select
            id={`${prefix}-theme`}
            value={value.theme}
            onChange={(e) => onChange({ ...value, theme: e.target.value })}
          >
            <option value="">All themes</option>
            {themes.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${prefix}-category`}>
          Evidence type
          <select
            id={`${prefix}-category`}
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value })}
          >
            <option value="">All types</option>
            {['Need', 'Want', 'Aspiration', 'Asset'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label htmlFor={`${prefix}-wave`}>
          Research wave
          <select
            id={`${prefix}-wave`}
            value={value.wave}
            onChange={(e) => onChange({ ...value, wave: e.target.value })}
          >
            <option value="">All waves</option>
            {[...new Set(areas.map((a) => a.provenance.wave))].map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </label>
        <button className="text-link" onClick={() => onChange(emptyFilters)}>
          Reset filters
        </button>
      </>
    )
  }
  return (
    <>
      <aside className="filter-panel" aria-label="Filter findings">
        <p className="eyebrow">
          <SlidersHorizontal size={14} aria-hidden="true" /> Refine the evidence
        </p>
        {controls('desktop')}
      </aside>
      <button className="mobile-filter" onClick={() => dialog.current?.showModal()}>
        <SlidersHorizontal size={16} />
        Filters{Object.values(value).some(Boolean) ? ' · active' : ''}
      </button>
      <dialog ref={dialog} className="filter-dialog" aria-labelledby="filter-title">
        <div className="section-heading">
          <h2 id="filter-title">Filter findings</h2>
          <button
            className="icon-button"
            aria-label="Close filters"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        {controls('mobile')}
        <button className="primary" onClick={() => dialog.current?.close()}>
          Show results
        </button>
      </dialog>
    </>
  )
}
