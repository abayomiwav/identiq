import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
/** Stores the CLI session (API URL, token, email) in ~/.identiq/config.json. */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface CliConfig {
  apiUrl: string;
  accessToken: string;
  email: string;
}

const DEFAULT_API_URL = 'https://api.identiq.app';

function configDir(): string {
  return process.env.IDENTIQ_CONFIG_DIR ?? join(homedir(), '.identiq');
}

function configPath(): string {
  return join(configDir(), 'config.json');
}

export function loadConfig(): CliConfig | null {
  const path = configPath();
  if (!existsSync(path)) return null;

  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as CliConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: CliConfig): void {
  const dir = configDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  // Owner-only permissions — this file holds a live access token. `mode` on
  // writeFileSync only applies when the file is created, so chmod explicitly
  // to tighten a file that already existed with looser permissions.
  const path = configPath();
  writeFileSync(path, JSON.stringify(config, null, 2), { mode: 0o600 });
  chmodSync(path, 0o600);
}

export function clearConfig(): void {
  const path = configPath();
  if (existsSync(path)) {
    rmSync(path);
  }
}

export function resolveApiUrl(override?: string): string {
  return override ?? loadConfig()?.apiUrl ?? DEFAULT_API_URL;
}

export function requireConfig(): CliConfig {
  const config = loadConfig();
  if (!config) {
    throw new Error('Not logged in. Run `identiq login` first.');
  }
  return config;
}

export { DEFAULT_API_URL };
