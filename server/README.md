# Saerbridge unified API

Express and PostgreSQL account gateway, extended with Nile's organization-scoped transcript workflow. Central Saerbridge and Nile use the same account UUID and session. Source and Thoth still require the staged adapters described in the launch plan; their existing databases have not been migrated.

## Run

Copy .env.example to .env, configure an isolated PostgreSQL database, then run npm ci, npm run release and npm start. Never run tests against production: tests reset fixtures. npm test and npm run lint validate the backend.

## Authentication

Google GIS ID tokens are verified server-side. Email sign-in uses expiring, single-use codes delivered through Resend; configure RESEND_API_KEY and verified EMAIL_FROM. Existing Google and email identities require authenticated linking. Production uses api.saerbridge.com, a Secure HttpOnly cookie scoped to .saerbridge.com, exact CLIENT_ORIGINS and CSRF tokens for writes. Preserve existing database, session and CSRF secrets during central migration.

## Nile

Public GET /api/v1/nile/public/archive serves reviewed aggregate releases with public CORS. Organization routes enforce current membership and roles. Only organization researchers upload text. Personal accounts have read-only API access. Organization API keys cannot write or read another organization's findings. Keys expire and are stored as hashes.

Transcripts are encrypted with TRANSCRIPT_ENCRYPTION_KEY (32 random bytes, base64). Keep a secure backup; loss makes stored transcripts unreadable. Privacy review and provider permission precede AI processing; human review follows AI. Only approved Saerbridge research can enter public releases, with small-count suppression and a separate publisher review. No organization upload becomes public automatically.

## AI and maintenance

Set OPENAI_ENABLED=true, a server-only OPENAI_API_KEY and OPENAI_MODEL=gpt-5.4-nano. Run npm run worker, or for a small pilot set NILE_BACKGROUND_ENABLED=true and NILE_RUN_WORKER=true to share the API container. Do not enable both deployment modes unnecessarily. Database job claims remain safe across replicas. Background mode also performs hourly retention maintenance; otherwise schedule npm run maintenance.

Org and global monthly reservation budgets, upload limits, input/output caps and zero SDK retries bound usage. These units are conservative token reservations, not a currency billing cap; configure provider spending controls too. The legacy general AI completion endpoint remains disabled.

NILE_DEMO_SEED=true explicitly seeds 60 fictional examples across Greenbushes and Walmer during release. Disable after initial deployment. This is synthetic demonstration data, not research.

Read DEPLOYMENT.md, SSO_INTEGRATION.md and ../docs/launch-plan.txt. The implementation is not a claim of ISO certification, complete WCAG conformance or legal compliance.
