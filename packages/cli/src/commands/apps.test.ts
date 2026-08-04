import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveConfig } from '../config/config';
import { createApp, listApps, rotateApiKey } from './apps';

describe('apps commands', () => {
  let tempDir: string;
  const fetchMock = vi.fn();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'identiq-cli-test-'));
    process.env.IDENTIQ_CONFIG_DIR = tempDir;
    saveConfig({ apiUrl: 'https://api.example.test', accessToken: 'token-abc', email: 'a@identiq.app' });
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    delete process.env.IDENTIQ_CONFIG_DIR;
    rmSync(tempDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it('createApp sends the authenticated request and returns the created app', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ app: { id: 'app-1', name: 'Acme' }, apiKey: 'idq_secret' }),
    });

    const result = await createApp({ name: 'Acme', redirectUris: ['https://acme.example/callback'] });

    expect(result.apiKey).toBe('idq_secret');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.test/apps');
    expect(init.headers.authorization).toBe('Bearer token-abc');
  });

  it('listApps returns the caller’s apps', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [{ id: 'app-1', name: 'Acme' }] });

    const result = await listApps();

    expect(result).toHaveLength(1);
    expect(fetchMock.mock.calls[0][1].method).toBe('GET');
  });

  it('rotateApiKey posts to the rotate-key endpoint for the given app', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ app: { id: 'app-1' }, apiKey: 'idq_new' }),
    });

    const result = await rotateApiKey('app-1');

    expect(result.apiKey).toBe('idq_new');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/apps/app-1/rotate-key');
  });

  it('requires the caller to be logged in', async () => {
    process.env.IDENTIQ_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'identiq-cli-loggedout-'));

    await expect(listApps()).rejects.toThrow('Not logged in');
  });
});
