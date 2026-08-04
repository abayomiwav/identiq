# Identiq - Stellar Identity Network

**Verify Once. Access Everywhere.**

Identiq is decentralized identity infrastructure on the Stellar network.
People verify their identity once; the apps they use request permission to
check the result, and never collect another document upload. Identiq itself
never stores raw evidence — only a hash of whatever was checked, anchored
on-chain alongside the identity, credential, and permission records it
belongs to.

- **Website:** identiq.app (placeholder)
- **Network:** Stellar / Soroban, testnet
- **License:** MIT

## Why

Every app that needs to know "is this a real, verified person" today asks
you to upload a passport again. Identiq breaks that loop: verify once,
then grant each app a scoped, expiring, revocable permission to check the
result. The app gets a pass/fail answer — never the document.

## How it's non-custodial

Two boundaries, drawn deliberately:

1. **Identiq never takes custody of a user's Stellar keys.** Identity
   registration and permission grants are actions only the identity owner
   can authorize — the API builds an *unsigned* transaction, the user's own
   wallet (e.g. [Freighter](https://www.freighter.app/)) signs it, and only
   the signed transaction comes back for submission. See
   `apps/api/src/stellar/stellar.service.ts`.
2. **Identiq never stores raw evidence.** Issuing a credential hashes
   whatever was checked (`hashEvidence` in
   `apps/api/src/common/crypto.util.ts`) and anchors only that hash,
   on-chain and off. A credential can be independently re-verified without
   Identiq — or anyone else — holding the original file.

The platform does hold its own operational Stellar signer
(`PLATFORM_SIGNER_SECRET`), used only to sign credentials Identiq itself
issues as an attester — the same non-custodial boundary drawn around a
platform's own keys versus its users'.

## Monorepo layout

```
contracts/         Soroban identity registry contract (Rust)
apps/api/           NestJS REST API — auth, identity, credentials,
                     permissions, developer apps, webhooks, Stellar
                     integration. Swagger docs at /docs.
apps/web/            Next.js web app — landing page, auth, dashboard,
                     /authorize consent screen, developer portal.
packages/shared/    Domain types shared by every workspace
                     (Credential, PermissionGrant, IdentiqApp, ...).
packages/sdk/        @identiq/sdk — server-side TypeScript SDK for apps
                     integrating with Identiq.
packages/cli/        @identiq/cli — developer CLI (login, manage apps
                     and API keys).
```

## Quick start

```bash
git clone https://github.com/abayomiwav/identiq.git
cd identiq
npm install

# Postgres for the API
docker compose up -d

cd apps/api
cp .env.example .env
# fill in JWT_SECRET at minimum: openssl rand -hex 32
npx prisma migrate deploy
npm run start:dev --workspace @identiq/api

# in another shell
cd apps/web
cp .env.example .env.local
npm run dev --workspace @identiq/web
```

The API listens on `:3000` (Swagger at `/docs`), the web app on `:3001`.

To register an identity on-chain from the dashboard, install
[Freighter](https://www.freighter.app/), switch it to Stellar testnet, and
fund a testnet account via
[the Laboratory](https://laboratory.stellar.org/#account-creator?network=test).
The identity contract itself must be deployed and `IDENTITY_CONTRACT_ID` /
`PLATFORM_SIGNER_SECRET` set in `apps/api/.env` before credential issuance
or on-chain anchoring will work — see `contracts/README.md`.

## Development

This is an npm workspaces + [Turborepo](https://turborepo.com) monorepo.

```bash
npm run build       # turbo run build, all workspaces
npm run test         # turbo run test
npm run lint          # turbo run lint
npm run typecheck      # turbo run typecheck
```

Scope any command to one workspace: `npm run test --workspace @identiq/api`.

The web app runs with `next dev --webpack` / `next build --webpack` rather
than Turbopack — this machine's Next.js install is missing the native
Turbopack binary; webpack is a fully supported fallback.

### Contract

```bash
cd contracts
cargo test --workspace
stellar contract build
```

See `contracts/README.md` for deployment instructions.

## Architecture

| Layer | What it owns |
|---|---|
| `contracts/identity` | On-chain source of truth: identity registration, credential issuance/revocation (by hash), permission grant/revoke — all owner- or issuer-authorized via `require_auth()`. |
| `apps/api` | Off-chain source of truth for fast reads and access control: Postgres via Prisma, JWT auth for identity owners, API-key auth for third-party apps, webhook dispatch, email notifications. Mirrors on-chain state via `chainIdentityId` / `chainCredentialId` / `chainPermissionId`. |
| `packages/sdk` | What a third-party app actually imports: `checkAccess()`, an `/authorize` URL builder, and webhook signature verification. |
| `packages/cli` | The same operations apps/api exposes, from a terminal. |
| `apps/web` | Where a human does all of the above: create an identity, issue/revoke credentials, review permission grants, register a developer app, approve a consent request. |

## Wallet reputation

A transparent, deterministically-computed 0–100 trust signal — not a
black-box score. Every input (account age, active credentials, active
grants, revocations) is independently checkable through the API. Formula
and tests: `packages/shared/src/reputation.ts`.

## Roadmap

- Zero-knowledge proofs — prove a credential's result without revealing
  the underlying data even to Identiq.
- Mainnet deployment and usage-based pricing.
