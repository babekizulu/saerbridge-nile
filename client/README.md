# Nile frontend

React 19, Vite, strict TypeScript and SCSS implementation of the supplied Saerbridge Nile v0 reference. The existing Vite architecture and React Compiler are retained. No Next.js or Tailwind was introduced.

## Run

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Production hosting must rewrite non-asset routes to `index.html` for React Router deep links. Fonts are bundled locally; no Google Fonts request is made.

## Routes

- `/`: archive overview, atlas, featured area, editorial quote, methodology and resources.
- `/areas`, `/areas/:slug`: searchable catalogue and area evidence dashboards.
- `/findings` (also `/themes`), `/themes/:slug`: filterable findings and theme context. Filters persist in URL query parameters.
- `/datasets`: JSON, CSV and JSONL demonstration releases.
- `/developers`: proposed API contract and data dictionary.
- `/methodology`, `/about`: interpretation, privacy, methods and project context.
- `/research`, `/research/projects`, `/research/interviews`, `/research/uploads`, `/research/privacy-review`, `/research/analysis`, `/research/quotes`, `/research/releases`, `/research/audit`: clearly labelled research preview. No fake login, private requests, uploads, analysis or publication actions.

## Structure

- `src/types/domain.ts`: explicit models and discriminated suppression type.
- `src/data/fixtures.ts`: fictional areas, waves, findings, quotation, releases and research workflow.
- `src/services/archive.ts`: Axios adapter and lazy mock service; components never import fixtures.
- `src/hooks/useArchive.tsx`: shared cancellable loading, error and retry state.
- `src/components/`: layout, atlas, accessible bars/table, evidence, filters, feedback and methodology.
- `src/pages/`: public routes and lazy-loaded research shell.
- `src/scss/`: tokens, responsive layouts and component styles.
- `src/utils/`: formatting, export serialization and privacy allowlists.
- `src/test/`: privacy, export, filtering and error-recovery tests.

## Backend integration

Copy `.env.example` to `.env.local` if needed. `VITE_DATA_MODE=demo` is the default. `VITE_API_BASE_URL` defaults to `/api/v1`; `VITE_DATA_MODE=api` selects the public adapter's `GET /archive`. The proposed response is `APIResponse<Archive>`. This is a proposed contract, not an existing endpoint; the server is currently a placeholder.

Before connecting real data:

1. Agree the API contract and add runtime schema validation. Replace demonstration-only provenance types and labels with approved real-research metadata. Never silently relabel fixtures.
2. Implement server-enforced consent, publication permissions and suppression. Suppression MUST happen before data crosses the network; the frontend allowlist is additional defence, not access control.
3. Add authentication, authorisation, session expiry and server-side API protection. This public research preview contains only fictional examples. Never put sensitive data in bundles, environment variables or fixtures.
4. Add authenticated uploads, encryption, retention, review, quote approval, releases and append-only audit APIs. No OpenAI pipeline was added.
5. Add pagination/caching and real boundary geometry or MapLibre tiles as the archive grows.

## Privacy & interpretation

Every finding and download is marked **Demonstration data — not real research findings.** Suppressed records contain only `suppressed`, `reason` and `minimumRequired`; no count or percentage. Charts expose no hidden numeric attributes in that branch. JSON/JSONL/CSV explicitly whitelist measurement properties and include the demo notice. CSV cells are escaped and formula-like leading characters neutralised.

Counts describe interviewed participants. Theme mentions overlap and are not population prevalence or confidence intervals. Provenance includes sample count, wave, fieldwork, methodology and source. The illustrative publication threshold is 10; a threshold alone does not ensure anonymity.

## Design reference & adaptations

Reference inspected in Chrome: https://saerbridge-nile-ui-ux-design.v0.build/ (v0 chat: https://v0.app/babekizulus-projects/chat/tyB3CEYjnGh).

Preserved: cream `#F2EFE7`, mint `#C8DFDB`, navy `#142F48`, large Manrope headline, IBM Plex Mono labels, Cormorant Garamond quotation, editorial spacing, thin borders, chart palette and dark research desk.

Adaptations:

- Single-page anchors and inactive controls become routes, filters, downloads and chart table controls.
- Demo notices appear near data, not only in the footer.
- Counts derive from fixtures: 3 areas, 130 interviews, 3 waves, 18 theme records; the prototype's 4 waves / 246 units were unsupported.
- Overlapping prototype map markers become a lightweight, explicitly schematic SVG atlas with labelled controls. It is not a geographic boundary dataset or participant map.
- Research actions have explicit unavailable states. Consent completion is 256 of 284 illustrative intake records (90%, rounded).
- Native HTML/CSS bars and a text table avoid a large library for simple qualitative summaries. Colour supplements text labels.

Accessibility includes landmarks, skip links, visible focus, native modal filters with Escape/focus return, chart text alternatives, responsive tables and reduced motion. WCAG 2.2 AA is a target, not a formal certification claim.
