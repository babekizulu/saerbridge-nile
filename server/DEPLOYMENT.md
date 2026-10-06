# Deployment — Saerbridge API (Railway)

## Custom domain (required for SSO)

Central authentication uses a cookie on `.saerbridge.com`.

The Railway-generated `*.railway.app` hostname **cannot** issue a `.saerbridge.com` cookie.

1. Deploy this service on Railway.
2. Attach the custom domain **`api.saerbridge.com`**.
3. Point DNS (CNAME or ALIAS) at the Railway domain Railway provides for that service.
4. Set `COOKIE_DOMAIN=.saerbridge.com`.
5. Set `CLIENT_ORIGINS` to the real HTTPS origins only.

Example:

```
CLIENT_ORIGINS=https://saerbridge.com,https://www.saerbridge.com,https://nile.saerbridge.com,https://andromeda.saerbridge.com,https://percival.saerbridge.com,https://source.saerbridge.com,https://thoth.saerbridge.com,https://alethea.saerbridge.com
```

## Railway variables

Set at least:

- `NODE_ENV=production`
- `PORT` — Railway injects this; do not hard-code 3000
- `DATABASE_URL` — Railway PostgreSQL plugin
- `SESSION_SECRET`
- `CSRF_SECRET`
- `GOOGLE_CLIENT_ID`
- `CLIENT_ORIGINS`
- `COOKIE_DOMAIN=.saerbridge.com`
- `ADMIN_EMAILS`
- `OPENAI_ENABLED` / `OPENAI_API_KEY` if AI is on

Optional legal fields: `COMPANY_REGISTRATION_NUMBER`, `INFORMATION_OFFICER_NAME`, `INFORMATION_OFFICER_EMAIL`, `INFORMATION_OFFICER_PHONE`, `REGISTERED_ADDRESS`. Leave blank rather than inventing values.

## Railway service settings

Connect babekizulu/saerbridge-nile with root directory /server on branch `main`. Use the supplied Dockerfile, start command
`npm start`, pre-deploy command `npm run release`, and health check `/readyz`.
The release command applies migrations and inserts missing catalogue/legal rows
without overwriting administrator edits. Set `ENABLE_TEST_AUTH=false` and
`NODE_ENV=production` explicitly.

New Railway services no longer opt into the legacy `railway.json` configuration
as of August 28, 2026. Verify these settings in the service dashboard.

For the main website, begin with
`CLIENT_ORIGINS=https://saerbridge.com,https://www.saerbridge.com`.
Add a product origin only when that product is ready to integrate.

## Release commands

For a manual first deployment, run:

```
npm run release
```

Configure a Railway cron or scheduled job:

```
npm run maintenance
```

Readiness check path: `/readyz` (includes database connectivity). Process health: `/healthz`.

## Proxy

Production sets `trust proxy = 1` so secure cookies and rate limits see `X-Forwarded-*` from Railway.

## Google Cloud

Authorised JavaScript origins must include production frontends. Authorised redirect URIs are not used for the GIS ID-token popup flow, and the client ID is obtained from the central auth/session response. Include https://nile.saerbridge.com among authorized JavaScript origins.

For the pilot, set NILE_BACKGROUND_ENABLED=true and NILE_RUN_WORKER=true to process durable jobs in the API container and run hourly maintenance. Set TRANSCRIPT_ENCRYPTION_KEY before uploading or seeding, and configure Resend email delivery. Larger deployments can run a separate worker and scheduled maintenance instead. Preserve the production PostgreSQL service and account UUIDs. Take a verified backup before migration; duplicate active emails deliberately stop migration for manual reconciliation.
