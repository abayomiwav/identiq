import { withEffectiveStatus } from './effective-status.util';

describe('withEffectiveStatus', () => {
  const now = new Date('2026-10-04T12:00:00Z');
  const past = new Date('2026-10-01T00:00:00Z');
  const future = new Date('2026-12-01T00:00:00Z');

  it('reports an ACTIVE row past expiresAt as EXPIRED', () => {
    expect(
      withEffectiveStatus({ status: 'ACTIVE', expiresAt: past }, now).status,
    ).toBe('EXPIRED');
  });

  it('leaves unexpired and non-expiring ACTIVE rows alone', () => {
    expect(
      withEffectiveStatus({ status: 'ACTIVE', expiresAt: future }, now).status,
    ).toBe('ACTIVE');
    expect(
      withEffectiveStatus({ status: 'ACTIVE', expiresAt: null }, now).status,
    ).toBe('ACTIVE');
  });

  it('never overrides REVOKED', () => {
    expect(
      withEffectiveStatus({ status: 'REVOKED', expiresAt: past }, now).status,
    ).toBe('REVOKED');
  });
});
