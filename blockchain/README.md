# blockchain/identity

The Identiq identity registry — a Soroban contract anchoring three things
on-chain, by hash only:

- **Identity registration** — one record per Stellar address, owner-signed.
- **Credential issuance/revocation** — an issuer attests that an identity
  satisfies a credential type, identified by `evidence_hash` (a hash of
  whatever was checked). Revocable by the issuer or the identity owner.
- **Permission grants** — an identity owner authorizing a specific app to
  check a specific credential type, with its own expiry and revocation.

Every state-changing call is gated by `require_auth()` against the actual
party it claims to act as — see `src/lib.rs` and the 16 tests in
`src/test.rs` for the exact authorization rules.

## Build & test

```bash
cargo test --workspace
stellar contract build
```

Produces `target/wasm32v1-none/release/identity.wasm`.

## Deploy to testnet

```bash
stellar keys generate platform --network testnet --fund

stellar contract deploy \
  --wasm target/wasm32v1-none/release/identity.wasm \
  --source platform \
  --network testnet
```

Copy the resulting contract id into `backend/.env` as
`IDENTITY_CONTRACT_ID`, and the `platform` key's secret as
`PLATFORM_SIGNER_SECRET` — this is the key `backend` uses to sign
credentials it issues as an attester. It is a platform operational key,
never a user's.

## Project structure

```
blockchain/
├── Cargo.toml              workspace root
└── contracts/identity/
    ├── Cargo.toml
    └── src/
        ├── lib.rs           contract implementation
        └── test.rs          unit tests (soroban-sdk testutils)
```
