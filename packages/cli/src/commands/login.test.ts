import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../config';
import { login } from './login';

describe('login command', () => {
  let tempDir: string;
  const fetchMock = vi.fn();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'identiq-cli-test-'));
    process.env.IDENTIQ_CONFIG_DIR = tempDir;
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    delete process.env.IDENTIQ_CONFIG_DIR;
    rmSync(tempDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it('persists the access token returned by the API so subsequent commands can reuse it', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'token-abc', user: { id: 'u1', email: 'a@identiq.app' } }),
    });

    const config = await login({ email: 'a@identiq.app', password: 'secret', apiUrl: 'https://api.example.test' });

    expect(config.accessToken).toBe('token-abc');
    expect(loadConfig()).toEqual({
      apiUrl: 'https://api.example.test',
      accessToken: 'token-abc',
      email: 'a@identiq.app',
    });
  });

  it('propagates an authentication failure without saving a config', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Invalid email or password' }) });

    await expect(
      login({ email: 'a@identiq.app', password: 'wrong', apiUrl: 'https://api.example.test' }),
    ).rejects.toThrow('Invalid email or password');
    expect(loadConfig()).toBeNull();
  });
});
