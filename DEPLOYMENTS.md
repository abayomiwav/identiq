# Deployments

## Testnet

| | |
| --- | --- |
| Contract | `contracts/identity` |
| Network | Stellar testnet (`Test SDF Network ; September 2015`) |
| Contract ID | `CD2YUK4WXQFUSBXOH6G7WRJ5UIZBEM35RECCC3GFF2YDMMAUUKQAWA6C` |
| Platform signer (public) | `GCZ67AIAJO2VKMED5LALVSVFNDATQGSIGBUR7ZJFSZNNIJLROS64Q2QH` |
| Deployed | 2026-10-04 |
| Explorer | [lab.stellar.org](https://lab.stellar.org/r/testnet/contract/CD2YUK4WXQFUSBXOH6G7WRJ5UIZBEM35RECCC3GFF2YDMMAUUKQAWA6C) |

The platform signer's **secret** is not committed anywhere. It is the
`identiq-platform` key in the deployer's `stellar` CLI keystore; export it with
`stellar keys show identiq-platform` and set it as `PLATFORM_SIGNER_SECRET` in
the environment that runs the API (staging/demo). Never put it in `.env.example`.

Testnet is reset periodically by SDF. If the contract ID above stops
resolving, redeploy (below) and update this file and `backend/.env.example`.

### Redeploying

```bash
cd contracts
stellar contract build
stellar keys generate identiq-platform --network testnet --fund   # first time only
stellar contract deploy \
  --wasm target/wasm32v1-none/release/identity.wasm \
  --source identiq-platform \
  --network testnet
```

### Smoke-test runbook

Run after every deploy to confirm the contract round-trips end-to-end:

```bash
cd contracts
CONTRACT_ID=CD2YUK4WXQFUSBXOH6G7WRJ5UIZBEM35RECCC3GFF2YDMMAUUKQAWA6C ./scripts/smoke-test.sh
```

It creates a throwaway funded user key, then:

1. `register_identity` for that user
2. `issue_credential` (KYC_TIER1, SHA-256 evidence hash, 24h TTL) signed by `identiq-platform`
3. `grant_permission` from the user to an app address (1h TTL)
4. reads back the credential and the grant, both of which should show `status: 0` (Active)

and removes the throwaway key. Last run, 2026-10-04: passed (identity 4,
credential 3, grant 2).
