# @identiq/web

The Identiq web app: landing page, authentication, identity dashboard,
permission management, developer portal, and the `/authorize` consent
screen apps redirect users to.

## Development

```bash
cp .env.example .env.local
npm run dev --workspace @identiq/web
```

Requires `apps/api` running locally (defaults to `http://localhost:3000`,
override with `NEXT_PUBLIC_API_URL`). To register an on-chain identity from
the dashboard you'll also need the [Freighter](https://www.freighter.app/)
browser extension pointed at Stellar testnet.

Runs with `--webpack` rather than Turbopack — see the root README for why.
