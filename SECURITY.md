# Security Policy

Identiq currently runs on Stellar's public testnet. See
[identiq.app/security](https://identiq.app/security) (or `frontend/src/app/security/page.tsx`)
for how the non-custodial architecture and evidence-hashing model actually
work — this file is only about reporting a vulnerability.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, use GitHub's private reporting:

1. Go to the [Security tab](https://github.com/abayomiwav/identiq/security) of this repository.
2. Click **Report a vulnerability** to open a private advisory.

This applies to any vulnerability in:

- `blockchain/` — the Soroban identity registry contract
- `backend/` — the API, including auth, permission checks, and the
  non-custodial transaction flow
- `sdk/` / `cli/` — webhook signature verification, API key handling
- `frontend/` — the dashboard and `/authorize` consent flow

## What to include

- A description of the vulnerability and its potential impact
- Steps to reproduce, or a proof of concept
- Which package/workspace it affects

## Scope note

This project runs on testnet with test funds only — there is no mainnet
deployment and no real user funds at risk today. That said, non-custodial
key handling and permission-check logic are treated as security-sensitive
regardless of network, since the same code will run in production.
