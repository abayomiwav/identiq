import { CredentialType } from '@identiq/shared';
import { describe, expect, it } from 'vitest';
import { buildAuthorizeUrl } from './authorize-url';

describe('buildAuthorizeUrl', () => {
  it('builds a consent URL carrying the app, redirect, and requested credential types', () => {
    const url = buildAuthorizeUrl({
      baseUrl: 'https://identiq.app',
      appId: 'app-1',
      redirectUri: 'https://acme.example/callback',
      credentialTypes: [CredentialType.KYC_TIER1, CredentialType.EMAIL_VERIFIED],
      state: 'xyz',
    });

    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/authorize');
    expect(parsed.searchParams.get('app_id')).toBe('app-1');
    expect(parsed.searchParams.get('redirect_uri')).toBe('https://acme.example/callback');
    expect(parsed.searchParams.get('credential_types')).toBe('KYC_TIER1,EMAIL_VERIFIED');
    expect(parsed.searchParams.get('state')).toBe('xyz');
  });

  it('omits the state param when none is given', () => {
    const url = buildAuthorizeUrl({
      appId: 'app-1',
      redirectUri: 'https://acme.example/callback',
      credentialTypes: [CredentialType.KYC_TIER1],
    });

    expect(new URL(url).searchParams.has('state')).toBe(false);
  });

  it('rejects an empty credential type list — an authorize link must request something', () => {
    expect(() =>
      buildAuthorizeUrl({ appId: 'app-1', redirectUri: 'https://acme.example/callback', credentialTypes: [] }),
    ).toThrow('at least one credential type');
  });

  it('defaults to the production Identiq host when no baseUrl is given', () => {
    const url = buildAuthorizeUrl({
      appId: 'app-1',
      redirectUri: 'https://acme.example/callback',
      credentialTypes: [CredentialType.KYC_TIER1],
    });

    expect(url.startsWith('https://identiq.app/authorize')).toBe(true);
  });
});
