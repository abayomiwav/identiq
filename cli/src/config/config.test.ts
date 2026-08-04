import { mkdtempSync, rmSync } from 'node:fs';
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
