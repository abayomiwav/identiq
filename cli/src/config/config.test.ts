import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearConfig, loadConfig, requireConfig, resolveApiUrl, saveConfig } from './config';

describe('config', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'identiq-cli-test-'));
    process.env.IDENTIQ_CONFIG_DIR = tempDir;
  });

  afterEach(() => {
    delete process.env.IDENTIQ_CONFIG_DIR;
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns null when no config has been saved yet', () => {
    expect(loadConfig()).toBeNull();
  });

  it('round-trips a saved config', () => {
    saveConfig({ apiUrl: 'https://api.example.test', accessToken: 'token-123', email: 'a@identiq.app' });

    expect(loadConfig()).toEqual({
      apiUrl: 'https://api.example.test',
      accessToken: 'token-123',
      email: 'a@identiq.app',
    });
  });

  it.skipIf(process.platform === 'win32')('saves config.json with owner-only (600) permissions', () => {
    saveConfig({ apiUrl: 'https://api.example.test', accessToken: 'token-abc', email: 'a@identiq.app' });

    expect(statSync(join(tempDir, 'config.json')).mode & 0o777).toBe(0o600);
  });

  it.skipIf(process.platform === 'win32')('tightens a pre-existing world-readable config.json to 600', () => {
    writeFileSync(join(tempDir, 'config.json'), '{}', { mode: 0o644 });

    saveConfig({ apiUrl: 'https://api.example.test', accessToken: 'token-abc', email: 'a@identiq.app' });

    expect(statSync(join(tempDir, 'config.json')).mode & 0o777).toBe(0o600);
  });

  it.skipIf(process.platform === 'win32')('creates a missing config directory as 700', () => {
    const nested = join(tempDir, 'nested');
    process.env.IDENTIQ_CONFIG_DIR = nested;

    saveConfig({ apiUrl: 'https://api.example.test', accessToken: 'token-abc', email: 'a@identiq.app' });

    expect(statSync(nested).mode & 0o777).toBe(0o700);
  });

  it('clearConfig removes a saved config', () => {
    saveConfig({ apiUrl: 'https://api.example.test', accessToken: 'token-123', email: 'a@identiq.app' });

    clearConfig();

    expect(loadConfig()).toBeNull();
  });

  it('clearConfig is a no-op when nothing is saved', () => {
    expect(() => clearConfig()).not.toThrow();
  });

  it('requireConfig throws a helpful message when logged out', () => {
    expect(() => requireConfig()).toThrow('Not logged in');
  });

  it('resolveApiUrl prefers an explicit override over the saved config', () => {
    saveConfig({ apiUrl: 'https://saved.example.test', accessToken: 't', email: 'a@identiq.app' });

    expect(resolveApiUrl('https://override.example.test')).toBe('https://override.example.test');
  });

  it('resolveApiUrl falls back to the production API when nothing is saved or overridden', () => {
    expect(resolveApiUrl()).toBe('https://api.identiq.app');
  });
});
