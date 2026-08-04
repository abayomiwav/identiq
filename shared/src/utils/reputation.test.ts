import { describe, expect, it } from 'vitest';
import { computeReputationScore } from './reputation';

describe('computeReputationScore', () => {
  it('returns 0 for a brand new identity with nothing yet', () => {
    const score = computeReputationScore({
      accountAgeDays: 0,
      activeCredentialCount: 0,
      activePermissionGrantCount: 0,
      revokedCredentialCount: 0,
    });
    expect(score).toBe(0);
  });

  it('caps age contribution at 30 points once past one year', () => {
    const oneYear = computeReputationScore({
      accountAgeDays: 365,
      activeCredentialCount: 0,
      activePermissionGrantCount: 0,
      revokedCredentialCount: 0,
    });
    const twoYears = computeReputationScore({
      accountAgeDays: 730,
      activeCredentialCount: 0,
      activePermissionGrantCount: 0,
      revokedCredentialCount: 0,
    });
    expect(oneYear).toBe(30);
    expect(twoYears).toBe(30);
  });

  it('caps credential contribution at 5 credentials (50 points)', () => {
    const five = computeReputationScore({
      accountAgeDays: 0,
      activeCredentialCount: 5,
      activePermissionGrantCount: 0,
      revokedCredentialCount: 0,
    });
    const ten = computeReputationScore({
      accountAgeDays: 0,
      activeCredentialCount: 10,
      activePermissionGrantCount: 0,
      revokedCredentialCount: 0,
    });
    expect(five).toBe(50);
    expect(ten).toBe(50);
  });

  it('caps permission grant contribution at 5 grants (20 points)', () => {
    const score = computeReputationScore({
      accountAgeDays: 0,
      activeCredentialCount: 0,
      activePermissionGrantCount: 9,
      revokedCredentialCount: 0,
    });
    expect(score).toBe(20);
  });

  it('applies a real penalty for revoked credentials, not just an absence of credit', () => {
    const withoutRevocation = computeReputationScore({
      accountAgeDays: 365,
      activeCredentialCount: 3,
      activePermissionGrantCount: 2,
      revokedCredentialCount: 0,
    });
    const withRevocation = computeReputationScore({
      accountAgeDays: 365,
      activeCredentialCount: 3,
      activePermissionGrantCount: 2,
      revokedCredentialCount: 1,
    });
    expect(withRevocation).toBe(withoutRevocation - 15);
  });

  it('never goes below 0 even with heavy revocation penalties', () => {
    const score = computeReputationScore({
      accountAgeDays: 0,
      activeCredentialCount: 0,
      activePermissionGrantCount: 0,
      revokedCredentialCount: 10,
    });
    expect(score).toBe(0);
  });

  it('never exceeds 100', () => {
    const score = computeReputationScore({
      accountAgeDays: 3650,
      activeCredentialCount: 50,
      activePermissionGrantCount: 50,
      revokedCredentialCount: 0,
    });
    expect(score).toBe(100);
  });
});
