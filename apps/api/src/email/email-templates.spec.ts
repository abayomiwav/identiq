import {
  renderCredentialIssuedEmail,
  renderCredentialRevokedEmail,
  renderPermissionGrantedEmail,
  renderPermissionRevokedEmail,
} from './email-templates';

describe('email-templates', () => {
  describe('renderCredentialIssuedEmail', () => {
    it('mentions the credential type and expiry in both subject and body', () => {
      const email = renderCredentialIssuedEmail({
        credentialType: 'KYC_TIER1',
        expiresAt: '2027-01-01T00:00:00.000Z',
        dashboardUrl: 'https://identiq.app/dashboard/credentials',
      });

      expect(email.subject).toContain('KYC_TIER1');
      expect(email.html).toContain('KYC_TIER1');
      expect(email.html).toContain('https://identiq.app/dashboard/credentials');
      expect(email.html).toContain('Valid until');
    });

    it('says a credential never expires when expiresAt is null', () => {
      const email = renderCredentialIssuedEmail({
        credentialType: 'EMAIL_VERIFIED',
        expiresAt: null,
        dashboardUrl: 'https://identiq.app/dashboard/credentials',
      });

      expect(email.html).toContain('does not expire');
    });

    it('renders a complete, well-formed HTML document', () => {
      const email = renderCredentialIssuedEmail({
        credentialType: 'KYC_TIER1',
        expiresAt: null,
        dashboardUrl: 'https://identiq.app',
      });

      expect(email.html).toMatch(/^<!doctype html>/);
      expect(email.html).toContain('<html>');
      expect(email.html).toContain('Identiq');
    });
  });

  describe('renderCredentialRevokedEmail', () => {
    it('mentions the credential type', () => {
      const email = renderCredentialRevokedEmail({
        credentialType: 'GOVERNMENT_ID',
        dashboardUrl: 'https://identiq.app/dashboard/credentials',
      });

      expect(email.subject).toContain('GOVERNMENT_ID');
      expect(email.html).toContain('revoked');
    });
  });

  describe('renderPermissionGrantedEmail', () => {
    it('mentions the app name and credential type', () => {
      const email = renderPermissionGrantedEmail({
        appName: 'Acme Marketplace',
        credentialType: 'KYC_TIER1',
        dashboardUrl: 'https://identiq.app/dashboard/permissions',
      });

      expect(email.subject).toContain('Acme Marketplace');
      expect(email.html).toContain('Acme Marketplace');
      expect(email.html).toContain('KYC_TIER1');
    });
  });

  describe('renderPermissionRevokedEmail', () => {
    it('mentions the app name', () => {
      const email = renderPermissionRevokedEmail({
        appName: 'Acme Marketplace',
        credentialType: 'KYC_TIER1',
        dashboardUrl: 'https://identiq.app/dashboard/permissions',
      });

      expect(email.subject).toContain('Acme Marketplace');
      expect(email.html).toContain('revoked');
    });
  });
});
