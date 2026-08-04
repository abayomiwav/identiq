#![no_std]

//! Identiq identity registry contract.
//!
//! This contract anchors three things on-chain — it never stores raw PII:
//! - Identity registration: one on-chain record per user, owned by their Stellar address.
//! - Credential anchoring: a hash of whatever an issuer verified (e.g. "KYC_TIER1"),
//!   plus its status and expiry. The evidence itself lives off-chain; only its hash
//!   is anchored here, so a credential can be independently re-verified without
//!   Identiq (or this contract) ever holding the original document.
//! - Permission grants: a user authorizing a specific app to check a specific
//!   credential type on their behalf, with its own expiry and revocation.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    Symbol,
};

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Status {
    Active = 0,
    Revoked = 1,
    Expired = 2,
}

#[contracttype]
#[derive(Clone)]
pub struct Identity {
    pub id: u64,
    pub owner: Address,
    pub registered_at: u64,
    pub status: Status,
}

#[contracttype]
#[derive(Clone)]
pub struct Credential {
    pub id: u64,
    pub identity_id: u64,
    pub issuer: Address,
    pub credential_type: Symbol,
    pub evidence_hash: BytesN<32>,
    pub issued_at: u64,
    pub expires_at: u64,
    pub status: Status,
}

#[contracttype]
#[derive(Clone)]
pub struct PermissionGrant {
    pub id: u64,
    pub identity_id: u64,
    pub app: Address,
    pub credential_type: Symbol,
    pub granted_at: u64,
    pub expires_at: u64,
    pub status: Status,
}

#[contracttype]
pub enum DataKey {
    NextIdentityId,
    NextCredentialId,
    NextGrantId,
    Identity(u64),
    OwnerIdentity(Address),
    Credential(u64),
    Grant(u64),
}

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    IdentityAlreadyRegistered = 1,
    IdentityNotFound = 2,
    CredentialNotFound = 3,
    GrantNotFound = 4,
    NotAuthorized = 5,
    AlreadyRevoked = 6,
    InvalidTtl = 7,
}

#[contract]
pub struct IdentityContract;

#[contractimpl]
impl IdentityContract {
    /// Register a new on-chain identity for `owner`. Idempotent guard: an
    /// address can only register once, mirroring "verify once" — re-running
    /// this for an already-registered owner fails rather than silently
    /// creating a duplicate identity.
    pub fn register_identity(env: Env, owner: Address) -> Result<u64, ContractError> {
        owner.require_auth();

        let owner_key = DataKey::OwnerIdentity(owner.clone());
        if env.storage().persistent().has(&owner_key) {
            return Err(ContractError::IdentityAlreadyRegistered);
        }

        let id = next_id(&env, DataKey::NextIdentityId);
        let identity = Identity {
            id,
            owner: owner.clone(),
            registered_at: env.ledger().timestamp(),
            status: Status::Active,
        };

        env.storage().persistent().set(&DataKey::Identity(id), &identity);
        env.storage().persistent().set(&owner_key, &id);

        env.events()
            .publish((symbol_short!("identity"), symbol_short!("reg")), id);

        Ok(id)
    }

    pub fn get_identity(env: Env, identity_id: u64) -> Result<Identity, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Identity(identity_id))
            .ok_or(ContractError::IdentityNotFound)
    }

    pub fn get_identity_by_owner(env: Env, owner: Address) -> Result<Identity, ContractError> {
        let id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerIdentity(owner))
            .ok_or(ContractError::IdentityNotFound)?;
        Self::get_identity(env, id)
    }

    /// Anchor a credential: `issuer` attests that `identity_id` satisfies
    /// `credential_type`, identified only by `evidence_hash` (a hash of the
    /// off-chain evidence the issuer checked — never the evidence itself).
    pub fn issue_credential(
        env: Env,
        issuer: Address,
        identity_id: u64,
        credential_type: Symbol,
        evidence_hash: BytesN<32>,
        ttl_seconds: u64,
    ) -> Result<u64, ContractError> {
        issuer.require_auth();

        if ttl_seconds == 0 {
            return Err(ContractError::InvalidTtl);
        }

        let identity: Identity = env
            .storage()
            .persistent()
            .get(&DataKey::Identity(identity_id))
            .ok_or(ContractError::IdentityNotFound)?;
        if identity.status != Status::Active {
            return Err(ContractError::IdentityNotFound);
        }

        let now = env.ledger().timestamp();
        let id = next_id(&env, DataKey::NextCredentialId);
        let credential = Credential {
            id,
            identity_id,
            issuer,
            credential_type,
            evidence_hash,
            issued_at: now,
            expires_at: now + ttl_seconds,
            status: Status::Active,
        };

        env.storage().persistent().set(&DataKey::Credential(id), &credential);

        env.events()
            .publish((symbol_short!("cred"), symbol_short!("issued")), id);

        Ok(id)
    }

    pub fn get_credential(env: Env, credential_id: u64) -> Result<Credential, ContractError> {
        let mut credential: Credential = env
            .storage()
            .persistent()
            .get(&DataKey::Credential(credential_id))
            .ok_or(ContractError::CredentialNotFound)?;

        if credential.status == Status::Active && env.ledger().timestamp() >= credential.expires_at
        {
            credential.status = Status::Expired;
        }

        Ok(credential)
    }

    /// Revoke a credential. Callable by either the original issuer (e.g. it
    /// discovers the underlying evidence was fraudulent) or the identity
    /// owner (e.g. they want to stop relying on it) — anyone else is
    /// rejected.
    pub fn revoke_credential(
        env: Env,
        revoker: Address,
        credential_id: u64,
    ) -> Result<(), ContractError> {
        revoker.require_auth();

        let mut credential: Credential = env
            .storage()
            .persistent()
            .get(&DataKey::Credential(credential_id))
            .ok_or(ContractError::CredentialNotFound)?;

        let identity: Identity = env
            .storage()
            .persistent()
            .get(&DataKey::Identity(credential.identity_id))
            .ok_or(ContractError::IdentityNotFound)?;

        if revoker != credential.issuer && revoker != identity.owner {
            return Err(ContractError::NotAuthorized);
        }
        if credential.status == Status::Revoked {
            return Err(ContractError::AlreadyRevoked);
        }

        credential.status = Status::Revoked;
        env.storage()
            .persistent()
            .set(&DataKey::Credential(credential_id), &credential);

        env.events()
            .publish((symbol_short!("cred"), symbol_short!("revoked")), credential_id);

        Ok(())
    }

    /// Grant `app` permission to check `credential_type` for the caller's
    /// identity. Only the identity owner can grant on their own behalf.
    pub fn grant_permission(
        env: Env,
        owner: Address,
        identity_id: u64,
        app: Address,
        credential_type: Symbol,
        ttl_seconds: u64,
    ) -> Result<u64, ContractError> {
        owner.require_auth();

        if ttl_seconds == 0 {
            return Err(ContractError::InvalidTtl);
        }

        let identity: Identity = env
            .storage()
            .persistent()
            .get(&DataKey::Identity(identity_id))
            .ok_or(ContractError::IdentityNotFound)?;
        if identity.owner != owner {
            return Err(ContractError::NotAuthorized);
        }

        let now = env.ledger().timestamp();
        let id = next_id(&env, DataKey::NextGrantId);
        let grant = PermissionGrant {
            id,
            identity_id,
            app,
            credential_type,
            granted_at: now,
            expires_at: now + ttl_seconds,
            status: Status::Active,
        };

        env.storage().persistent().set(&DataKey::Grant(id), &grant);

        env.events()
            .publish((symbol_short!("grant"), symbol_short!("created")), id);

        Ok(id)
    }

    pub fn get_permission_grant(env: Env, grant_id: u64) -> Result<PermissionGrant, ContractError> {
        let mut grant: PermissionGrant = env
            .storage()
            .persistent()
            .get(&DataKey::Grant(grant_id))
            .ok_or(ContractError::GrantNotFound)?;

        if grant.status == Status::Active && env.ledger().timestamp() >= grant.expires_at {
            grant.status = Status::Expired;
        }

        Ok(grant)
    }

    /// Revoke a permission grant. Only the identity owner who created it can
    /// revoke — an app cannot un-revoke its own access, and cannot revoke
    /// another identity's grant.
    pub fn revoke_permission(env: Env, owner: Address, grant_id: u64) -> Result<(), ContractError> {
        owner.require_auth();

        let mut grant: PermissionGrant = env
            .storage()
            .persistent()
            .get(&DataKey::Grant(grant_id))
            .ok_or(ContractError::GrantNotFound)?;

        let identity: Identity = env
            .storage()
            .persistent()
            .get(&DataKey::Identity(grant.identity_id))
            .ok_or(ContractError::IdentityNotFound)?;
        if identity.owner != owner {
            return Err(ContractError::NotAuthorized);
        }
        if grant.status == Status::Revoked {
            return Err(ContractError::AlreadyRevoked);
        }

        grant.status = Status::Revoked;
        env.storage().persistent().set(&DataKey::Grant(grant_id), &grant);

        env.events()
            .publish((symbol_short!("grant"), symbol_short!("revoked")), grant_id);

        Ok(())
    }
}

fn next_id(env: &Env, key: DataKey) -> u64 {
    let current: u64 = env.storage().instance().get(&key).unwrap_or(0);
    let next = current + 1;
    env.storage().instance().set(&key, &next);
    next
}

mod test;
