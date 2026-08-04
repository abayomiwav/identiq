# @identiq/api

The Identiq REST API — auth, identity, credentials, permissions, developer
apps, webhooks, and Stellar integration. Swagger docs served at `/docs`
once running.

## Setup

```bash
docker compose up -d   # from the repo root — starts Postgres
cp .env.example .env   # fill in JWT_SECRET at minimum
npx prisma migrate deploy
npm run start:dev --workspace @identiq/api
```

`IDENTITY_CONTRACT_ID` and `PLATFORM_SIGNER_SECRET` are only required for
endpoints that touch the chain (identity registration, credential
issuance/revocation) — see `blockchain/README.md` for deploying the
contract those values point at.

## Tests

```bash
npm run test --workspace @identiq/api        # unit tests, no DB required
npm run test:e2e --workspace @identiq/api    # requires DATABASE_URL
```

## Structure

Each domain lives in its own Nest module under `src/`: `auth`, `identity`,
`credentials`, `apps` (third-party developer apps, not this app itself),
`permissions`, `webhooks`, `email`, `stellar` (the non-custodial
build-XDR/sign/submit boundary), `prisma`, `config`.
