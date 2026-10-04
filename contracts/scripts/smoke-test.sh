#!/usr/bin/env bash
# End-to-end smoke test against a deployed identity contract.
#
#   CONTRACT_ID=C... ./scripts/smoke-test.sh
#
# Needs two funded testnet keys in the stellar CLI keystore:
#   stellar keys generate identiq-platform   --network testnet --fund   # attester / issuer
#   stellar keys generate identiq-smoke-user --network testnet --fund   # stands in for an end user
#
# Each run uses a fresh smoke-user key (register_identity is once per owner),
# so it is safe to re-run.
set -euo pipefail

: "${CONTRACT_ID:?set CONTRACT_ID to the deployed contract id}"
NETWORK="${NETWORK:-testnet}"
ISSUER="${ISSUER:-identiq-platform}"
USER_KEY="identiq-smoke-user-$(date +%s)"

stellar keys generate "$USER_KEY" --network "$NETWORK" --fund >/dev/null
OWNER=$(stellar keys address "$USER_KEY")
ISSUER_ADDR=$(stellar keys address "$ISSUER")

# Public testnet RPC occasionally drops a request (`client error (SendRequest)`),
# so retry each call a few times before giving up.
invoke() {
  local source=$1
  shift
  local attempt
  for attempt in 1 2 3; do
    if stellar contract invoke --id "$CONTRACT_ID" --source "$source" --network "$NETWORK" -- "$@"; then
      return 0
    fi
    echo "   (attempt $attempt failed, retrying)" >&2
    sleep 5
  done
  return 1
}

echo "1. register_identity for $OWNER"
IDENTITY_ID=$(invoke "$USER_KEY" register_identity --owner "$OWNER")
echo "   identity_id=$IDENTITY_ID"

echo "2. issue_credential KYC_TIER1 from $ISSUER_ADDR"
EVIDENCE_HASH=$(printf 'smoke-test-evidence-%s' "$IDENTITY_ID" | shasum -a 256 | cut -d' ' -f1)
CREDENTIAL_ID=$(invoke "$ISSUER" issue_credential \
  --issuer "$ISSUER_ADDR" --identity_id "$IDENTITY_ID" \
  --credential_type KYC_TIER1 --evidence_hash "$EVIDENCE_HASH" --ttl_seconds 86400)
echo "   credential_id=$CREDENTIAL_ID"

echo "3. grant_permission to app $ISSUER_ADDR"
GRANT_ID=$(invoke "$USER_KEY" grant_permission \
  --owner "$OWNER" --identity_id "$IDENTITY_ID" --app "$ISSUER_ADDR" \
  --credential_type KYC_TIER1 --ttl_seconds 3600)
echo "   grant_id=$GRANT_ID"

echo "4. read back"
invoke "$USER_KEY" get_credential --credential_id "$CREDENTIAL_ID"
invoke "$USER_KEY" get_permission_grant --grant_id "$GRANT_ID"

stellar keys rm --force "$USER_KEY" >/dev/null 2>&1 || true
echo "Smoke test passed."
