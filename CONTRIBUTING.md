# Contributing to Identiq

Identiq is an npm workspaces + [Turborepo](https://turborepo.com) monorepo.
Before opening a PR, please read this end to end — it's short.

## Monorepo layout

```
contracts/    Soroban identity registry contract (Rust)
backend/      NestJS REST API (@identiq/api)
frontend/     Next.js web app (@identiq/web)
shared/       Domain types shared by every workspace (@identiq/shared)
sdk/          Server-side TypeScript SDK (@identiq/sdk)
cli/          Developer CLI (@identiq/cli)
```

## Getting set up

```bash
git clone https://github.com/abayomiwav/identiq.git
cd identiq
npm install

docker compose up -d   # Postgres for the API

cd backend
cp .env.example .env   # fill in JWT_SECRET at minimum: openssl rand -hex 32
npx prisma migrate deploy
npm run start:dev --workspace @identiq/api

# in another shell
cd frontend
cp .env.example .env.local
npm run dev --workspace @identiq/web
```

The API listens on `:3000` (Swagger at `/docs`), the web app on `:3001`.
See the [README](./README.md) for the full quick-start, including wallet
setup and on-chain identity registration.

## Making a change

1. Open an issue first for anything non-trivial (new features, architecture
   changes) so we can agree on the approach before you write code. Small
   fixes and typos can skip straight to a PR.
2. Branch off `main`.
3. Keep changes scoped — a bug fix shouldn't carry an unrelated refactor.
4. Match the existing style in the file/package you're touching rather than
   introducing a new pattern.

## Before opening a PR

Run these from the repo root; each is scoped by Turborepo so only affected
workspaces actually re-run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Or scope any command to one workspace: `npm run test --workspace @identiq/api`.

For the smart contract:

```bash
cd contracts
cargo test --workspace
```

All of the above must pass before a PR is merged. If you're adding new
behavior (not just fixing a bug), add a test for it in the same PR.

## Commit messages and PRs

- Write commit messages that explain *why*, not just *what*.
- Reference the issue your PR closes with `Closes #123` in the PR
  description so it auto-closes on merge.
- Keep PRs focused — one PR per logical change. Large, unrelated batches are
  harder to review and revert.

## Reporting bugs / requesting features

Use the issue templates under **New Issue**. For security vulnerabilities,
do not open a public issue — see [SECURITY.md](./SECURITY.md) instead.

## Code of conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). By
participating, you're expected to uphold it.
