# Nile client

React 19, Vite, TypeScript and SCSS, based on the supplied v0 design. Leaflet maps cover South Africa; approximate township markers currently include only Greenbushes and Walmer. Recharts provides quantitative views with an accessible table alternative.

## Run

npm ci; npm run dev. Validate with npm test, npm run lint and npm run build. Local Vite proxies /api to port 8080. Netlify configuration is in the monorepo root.

## Data and accounts

API mode is the default: GET /api/v1/nile/public/archive. Set VITE_API_BASE_URL=https://api.saerbridge.com/api/v1 for production. Explicit VITE_DATA_MODE=demo loads the 60 fictional interview fixtures; never use these as research. The API's release metadata controls demo labels and export notices.

/account provides central email-code and Google sign-in. /research contains organization-scoped text upload, privacy review, AI evidence review, API keys and admin publication. Individual accounts cannot upload until they create or join an organization. All permissions are enforced server-side. No provider keys belong in VITE variables.

Whole-country map bounds do not imply a complete township census or authoritative settlement boundaries. Theme shares describe the selected interview sample, not population prevalence. Published small counts and complements below ten are suppressed by the server.

Accessibility features include keyboard navigation, focus states, skip links, reduced-motion behavior and chart tables. WCAG 2.2 AA remains an audit target. Independent assistive-technology testing and the release checklist are required before claiming conformance.
