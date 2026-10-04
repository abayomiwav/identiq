import { isPublicWebhookUrl } from './public-webhook-url.validator';

describe('isPublicWebhookUrl (production rules)', () => {
  const check = (url: string) => isPublicWebhookUrl(url, false);

  it('accepts a public https URL', () => {
    expect(check('https://api.acme.example/webhooks/identiq')).toBe(true);
    expect(check('https://8.8.8.8/hook')).toBe(true);
  });

  it.each([
    'http://api.acme.example/hook',
    'https://localhost/hook',
    'https://app.localhost/hook',
    'https://127.0.0.1/hook',
    'https://10.0.0.5/hook',
    'https://172.16.4.2/hook',
    'https://192.168.1.10/hook',
    'https://169.254.169.254/latest/meta-data/',
    'https://100.64.0.1/hook',
    'https://0.0.0.0/hook',
    'https://[::1]/hook',
    'https://[fd00::1]/hook',
    'https://[fe80::1]/hook',
    'https://[::ffff:127.0.0.1]/hook',
    'ftp://files.acme.example/hook',
    'not a url',
  ])('rejects %s', (url) => {
    expect(check(url)).toBe(false);
  });
});

describe('isPublicWebhookUrl (development)', () => {
  it('allows local http targets for testing', () => {
    expect(isPublicWebhookUrl('http://localhost:4000/hook', true)).toBe(true);
  });

  it('still rejects non-http schemes', () => {
    expect(isPublicWebhookUrl('file:///etc/passwd', true)).toBe(false);
  });
});
