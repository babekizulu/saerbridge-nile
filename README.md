# Saerbridge Nile

Township qualitative research: a public Saerbridge archive and private organization workspaces. Monorepo: `client/` (React/Vite), `server/` (central Saerbridge Express/PostgreSQL API). This extends the central account service; it is not a second password database.

## Run locally

Use Node 24 and PostgreSQL 16+. Run `npm ci` in each folder. Configure `server/.env` from `.env.example`, then run `npm run migrate`. Start `npm run dev` in both folders. Vite proxies `/api` to port 8080. Set a fresh 32-byte base64 `TRANSCRIPT_ENCRYPTION_KEY` and strong session/CSRF secrets. Keep keys outside Git and preserve the encryption key across restarts.

Optional fictional pilot: set `NILE_DEMO_SEED=true` and run `npm run seed:demo`. This creates 30 fictional Greenbushes and 30 fictional Walmer township transcripts and an explicitly labelled public synthetic release. It never generates real research. Reruns are idempotent. No demo login/password is created. Disabled seed authors cannot sign in.

Email registration/login uses a single-use eight-digit code, not passwords. Configure `RESEND_API_KEY` and a verified `EMAIL_FROM`. Configure Google Identity Services using the same central Google client ID and authorized web origins. Existing email accounts must sign in by email before linking Google. Server allowlists alone control platform administrators.

## Research and API

`GET /api/v1/nile/public/archive`: anonymous public snapshot, wildcard CORS without credentials, no transcripts. Public rate: 120/minute/IP plus global 300/15 minutes/IP. API keys: 60/minute/key, 90-day expiry, read-only. Private `GET /api/v1/nile/organizations/:id/transcripts` requires a current organization member/session or scoped API key. Initial list is capped at the newest 100 records. Server integrations should keep keys out of browsers.

`/account`: verified email/Google account. `/research`: organization creation, registered member addition, text upload, privacy/evidence review, API keys, and administrator public publication. Individuals have no personal transcript collection. Organizations cannot publish their private transcripts to the public archive.

Upload JSON accepts only title, township, text, consentReference, permissionConfirmed and demonstration. Text limit 40,000 characters. No audio endpoint exists. Duplicate hashes are scoped to the organization. AES-256-GCM protects stored transcript text. Database/storage encryption, key custody, staff access and backup controls remain deployment responsibilities.

The map initially fits all South Africa. Only two pilot research markers are shown; marker coordinates are approximate and are not study boundaries or participant locations. Verify Greenbushes classification and both study geographies before real fieldwork. Leaflet uses attributed OSM tiles; assess a supported tile service before substantial traffic. Recharts adds keyboard-accessible comparisons, with HTML tables and suppression notices.

## AI worker

Set `OPENAI_ENABLED=true`, `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5.4-nano`, `AI_MONTHLY_TOKEN_BUDGET` and `AI_GLOBAL_MONTHLY_TOKEN_BUDGET`; run `npm run worker` separately, or set `NILE_BACKGROUND_ENABLED=true` and `NILE_RUN_WORKER=true` to share the API container for the pilot. Default allowances are conservative reservation units, not billable-token reports or currency budgets. Set OpenAI project spend limits too. No provider call occurs before privacy approval. Requests use strict structured output, exact evidence validation, no tools, store:false, bounded output and no SDK retries. Provider failure requires review; it is not silently retried. Evidence approval is a separate human step. Synthetic seed analysis is deterministic and makes no AI calls.

Run `npm run maintenance` daily to enforce 90-day transcript expiry, expire challenges/limits, prune operational records and mark interrupted jobs failed. Restore/versioned encryption-key management, audit archival and backup erasure must be configured before real data. The legacy general AI endpoint stays disabled unless `LEGACY_AI_ENABLED=true`; do not enable it without a separate cost review.

## Checks

Client: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
Server: `npm run lint`, `npm test`. Use an isolated test PostgreSQL database in DATABASE_URL and DATABASE_URL_TEST; tests create fixture accounts and records. Never use production. Tests include tenant isolation, scoped key revocation by membership, CSRF, email replay, text validation, duplicate rejection, grounded AI evidence and suppression. Integration tests mock email and AI providers; real provider delivery remains a deployment smoke test.

Independent dummy consumer: `node server/examples/public-api-demo/server.cjs`, visit localhost:4599 and enter the public archive URL. It sends no cookies/API key, proving public CORS separately from Nile.

## Deployment

Netlify uses root `netlify.toml`, base client, publish dist, domain nile.saerbridge.com. Production API is api.saerbridge.com/api/v1. Build API mode only after the central backend exposes the Nile routes.

Railway: root /server, Dockerfile, predeploy `npm run release`, start `npm start`, health /readyz. Preserve central DATABASE_URL, session secrets, cookie domain and UUIDs. Add exact Nile origin to CLIENT_ORIGINS and Google allowed origins. The deployed pilot shares the API container for queue processing and hourly retention maintenance. A separate worker and scheduled maintenance remain available as load grows. Back up and restore-test the existing central database before changing the live service source. New migrations are additive, except that duplicate existing emails intentionally block identity-uniqueness migration for manual reconciliation. No automatic rollback SQL drops research.

Thoth and Source require staged identity adapters; Andromeda/Aletheia source access was unavailable and needs review. Do not copy production accounts into a fresh Nile identity database or silently merge email matches. See docs/launch-plan.txt for migration/subscription/legal decisions and known gaps.

## Assurance status

Implemented controls are not proof of WCAG conformance, POPIA compliance or ISO certification. Before real sensitive data, complete privacy/AI assessments, admin MFA, independent security/accessibility review, least-privilege database roles, backup/restore drills, processor contracts and approved research governance. Public code licensing and public data licensing are separate owner decisions; no licence has been invented by this build.

