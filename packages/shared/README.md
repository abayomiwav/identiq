# @identiq/shared

Domain types shared across every Identiq workspace: `Identity`,
`Credential` / `CredentialType`, `PermissionGrant`, `IdentiqApp`,
`WebhookPayload`, and the wallet reputation formula
(`computeReputationScore`). No framework dependencies — plain TypeScript,
consumed directly from `src/`.

```bash
npm run typecheck --workspace @identiq/shared
npm run test --workspace @identiq/shared
```
