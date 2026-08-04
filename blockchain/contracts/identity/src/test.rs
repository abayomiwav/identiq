#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Env,
};

fn setup(env: &Env) -> IdentityContractClient<'_> {
    env.mock_all_auths();
    let contract_id = env.register(IdentityContract, ());
    IdentityContractClient::new(env, &contract_id)
}

fn hash(env: &Env, seed: u8) -> BytesN<32> {
    BytesN::from_array(env, &[seed; 32])
}

#[test]
fn registers_an_identity() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = client.register_identity(&owner);
    assert_eq!(id, 1);

    let identity = client.get_identity(&id);
    assert_eq!(identity.owner, owner);
    assert_eq!(identity.status, Status::Active);
}

#[test]
fn rejects_double_registration_of_the_same_owner() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);

    client.register_identity(&owner);
    let result = client.try_register_identity(&owner);

    assert_eq!(result, Err(Ok(ContractError::IdentityAlreadyRegistered)));
}

#[test]
fn looks_up_identity_by_owner() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = client.register_identity(&owner);
    let identity = client.get_identity_by_owner(&owner);

    assert_eq!(identity.id, id);
}

#[test]
fn issues_a_credential_anchored_only_by_hash() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let issuer = Address::generate(&env);

    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");
    let evidence_hash = hash(&env, 7);

    let credential_id = client.issue_credential(
        &issuer,
        &identity_id,
        &credential_type,
        &evidence_hash,
        &31_536_000,
    );

    let credential = client.get_credential(&credential_id);
    assert_eq!(credential.identity_id, identity_id);
    assert_eq!(credential.issuer, issuer);
    assert_eq!(credential.evidence_hash, evidence_hash);
    assert_eq!(credential.status, Status::Active);
}

#[test]
fn rejects_credential_issuance_against_unknown_identity() {
    let env = Env::default();
    let client = setup(&env);
    let issuer = Address::generate(&env);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let result = client.try_issue_credential(&issuer, &999, &credential_type, &hash(&env, 1), &1000);

    assert_eq!(result, Err(Ok(ContractError::IdentityNotFound)));
}

#[test]
fn rejects_zero_ttl_credential() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let issuer = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let result =
        client.try_issue_credential(&issuer, &identity_id, &credential_type, &hash(&env, 1), &0);

    assert_eq!(result, Err(Ok(ContractError::InvalidTtl)));
}

#[test]
fn credential_expires_after_its_ttl_elapses() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let issuer = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let credential_id =
        client.issue_credential(&issuer, &identity_id, &credential_type, &hash(&env, 1), &100);

    env.ledger().with_mut(|l| l.timestamp += 101);

    let credential = client.get_credential(&credential_id);
    assert_eq!(credential.status, Status::Expired);
}

#[test]
fn issuer_can_revoke_their_own_credential() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let issuer = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let credential_id =
        client.issue_credential(&issuer, &identity_id, &credential_type, &hash(&env, 1), &1000);
    client.revoke_credential(&issuer, &credential_id);

    let credential = client.get_credential(&credential_id);
    assert_eq!(credential.status, Status::Revoked);
}

#[test]
fn identity_owner_can_revoke_a_credential_issued_about_them() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let issuer = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let credential_id =
        client.issue_credential(&issuer, &identity_id, &credential_type, &hash(&env, 1), &1000);
    client.revoke_credential(&owner, &credential_id);

    let credential = client.get_credential(&credential_id);
    assert_eq!(credential.status, Status::Revoked);
}

#[test]
fn rejects_revocation_by_an_unrelated_address() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let issuer = Address::generate(&env);
    let stranger = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let credential_id =
        client.issue_credential(&issuer, &identity_id, &credential_type, &hash(&env, 1), &1000);
    let result = client.try_revoke_credential(&stranger, &credential_id);

    assert_eq!(result, Err(Ok(ContractError::NotAuthorized)));
}

#[test]
fn rejects_double_revocation() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let issuer = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let credential_id =
        client.issue_credential(&issuer, &identity_id, &credential_type, &hash(&env, 1), &1000);
    client.revoke_credential(&issuer, &credential_id);
    let result = client.try_revoke_credential(&issuer, &credential_id);

    assert_eq!(result, Err(Ok(ContractError::AlreadyRevoked)));
}

#[test]
fn owner_grants_permission_to_an_app() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let app = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let grant_id = client.grant_permission(&owner, &identity_id, &app, &credential_type, &2_592_000);

    let grant = client.get_permission_grant(&grant_id);
    assert_eq!(grant.app, app);
    assert_eq!(grant.identity_id, identity_id);
    assert_eq!(grant.status, Status::Active);
}

#[test]
fn rejects_permission_grant_from_a_non_owner() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let stranger = Address::generate(&env);
    let app = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let result =
        client.try_grant_permission(&stranger, &identity_id, &app, &credential_type, &2_592_000);

    assert_eq!(result, Err(Ok(ContractError::NotAuthorized)));
}

#[test]
fn permission_grant_expires_after_its_ttl_elapses() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let app = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let grant_id = client.grant_permission(&owner, &identity_id, &app, &credential_type, &100);
    env.ledger().with_mut(|l| l.timestamp += 101);

    let grant = client.get_permission_grant(&grant_id);
    assert_eq!(grant.status, Status::Expired);
}

#[test]
fn owner_revokes_a_permission_grant() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let app = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let grant_id = client.grant_permission(&owner, &identity_id, &app, &credential_type, &2_592_000);
    client.revoke_permission(&owner, &grant_id);

    let grant = client.get_permission_grant(&grant_id);
    assert_eq!(grant.status, Status::Revoked);
}

#[test]
fn rejects_permission_revocation_by_a_non_owner() {
    let env = Env::default();
    let client = setup(&env);
    let owner = Address::generate(&env);
    let stranger = Address::generate(&env);
    let app = Address::generate(&env);
    let identity_id = client.register_identity(&owner);
    let credential_type = Symbol::new(&env, "KYC_TIER1");

    let grant_id = client.grant_permission(&owner, &identity_id, &app, &credential_type, &2_592_000);
    let result = client.try_revoke_permission(&stranger, &grant_id);

    assert_eq!(result, Err(Ok(ContractError::NotAuthorized)));
}
