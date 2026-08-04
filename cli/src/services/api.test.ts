import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, CliApiError } from './api';

describe('apiRequest', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a bearer token when one is provided', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    await apiRequest('GET', '/apps', { apiUrl: 'https://api.example.test', accessToken: 'token-123' });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBe('Bearer token-123');
  });

  it('omits the authorization header when no token is provided', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    await apiRequest('POST', '/auth/login', { apiUrl: 'https://api.example.test', body: { email: 'a' } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual({ email: 'a' });
  });

  it('throws CliApiError with the server message on failure', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Invalid credentials' }) });

    await expect(apiRequest('POST', '/auth/login', { apiUrl: 'https://api.example.test' })).rejects.toMatchObject({
      name: 'CliApiError',
      status: 401,
      message: 'Invalid credentials',
    });
  });

  it('joins an array of validation messages into a single readable string', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: ['email must be an email', 'password too short'] }),
    });

    await expect(apiRequest('POST', '/auth/register', { apiUrl: 'https://api.example.test' })).rejects.toThrow(
      'email must be an email, password too short',
    );
  });

  it('strips a trailing slash from the configured API URL', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    await apiRequest('GET', '/apps', { apiUrl: 'https://api.example.test/' });

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/apps');
  });
});

describe('CliApiError', () => {
  it('carries the HTTP status', () => {
    const error = new CliApiError('failed', 500);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(500);
  });
});
