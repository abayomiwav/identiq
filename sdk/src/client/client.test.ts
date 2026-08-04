import { CredentialType } from '@identiq/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IdentiqClient } from './client';
import { IdentiqApiError } from '../errors/errors';

describe('IdentiqClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when constructed without an API key', () => {
    expect(() => new IdentiqClient({ apiKey: '' })).toThrow('IdentiqClient requires an apiKey');
  });

  it('sends the API key header and posts the check-access request', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ verified: true, credential: null, checkedAt: '2026-01-01T00:00:00.000Z' }),
    });

    const client = new IdentiqClient({ apiKey: 'idq_test', baseUrl: 'https://api.example.test' });
    const result = await client.checkAccess({ identityId: 'identity-1', credentialType: CredentialType.KYC_TIER1 });

    expect(result.verified).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.test/permissions/check');
    expect(init.headers['x-identiq-api-key']).toBe('idq_test');
    expect(JSON.parse(init.body)).toEqual({ identityId: 'identity-1', credentialType: CredentialType.KYC_TIER1 });
  });

  it('throws IdentiqApiError with the response status when the request fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'No active permission grant for this credential type' }),
    });

    const client = new IdentiqClient({ apiKey: 'idq_test' });

    await expect(
      client.checkAccess({ identityId: 'identity-1', credentialType: CredentialType.KYC_TIER1 }),
    ).rejects.toMatchObject({
      name: 'IdentiqApiError',
      status: 403,
      message: 'No active permission grant for this credential type',
    });
  });

  it('strips a trailing slash from a custom base url', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ verified: false, credential: null, checkedAt: '' }) });
    const client = new IdentiqClient({ apiKey: 'idq_test', baseUrl: 'https://api.example.test/' });

    await client.checkAccess({ identityId: 'id', credentialType: CredentialType.EMAIL_VERIFIED });

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/permissions/check');
  });
});

describe('IdentiqApiError', () => {
  it('is an instance of Error with a stable name for narrowing', () => {
    const error = new IdentiqApiError('failed', 500, { detail: 'oops' });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('IdentiqApiError');
    expect(error.status).toBe(500);
    expect(error.body).toEqual({ detail: 'oops' });
  });
});
