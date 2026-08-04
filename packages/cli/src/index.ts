#!/usr/bin/env node
import { Command } from 'commander';
import { createApp, listApps, rotateApiKey } from './commands/apps';
import { login } from './commands/login';
import { logout } from './commands/logout';
import { whoami } from './commands/whoami';
import { CliApiError } from './api';

const program = new Command();

program.name('identiq').description('Identiq developer CLI — verify once, access everywhere.').version('0.1.0');

program
  .command('login')
  .description('Authenticate with your Identiq account')
  .requiredOption('-e, --email <email>', 'account email')
  .requiredOption('-p, --password <password>', 'account password')
  .option('--api-url <url>', 'override the Identiq API base URL')
  .action(async (opts: { email: string; password: string; apiUrl?: string }) => {
    const config = await login(opts);
    console.log(`Logged in as ${config.email} (${config.apiUrl})`);
  });

program
  .command('logout')
  .description('Clear stored Identiq credentials')
  .action(() => {
    logout();
    console.log('Logged out.');
  });

program
  .command('whoami')
  .description('Show the currently authenticated account')
  .action(() => {
    const result = whoami();
    console.log(`${result.email} (${result.apiUrl})`);
  });

const apps = program.command('apps').description('Manage your Identiq developer apps');

apps
  .command('create')
  .description('Register a new app')
  .argument('<name>', 'app name')
  .requiredOption('-r, --redirect-uri <uri...>', 'allowed redirect URI(s) for the consent flow')
  .option('-w, --webhook-url <url>', 'URL to receive credential/permission webhook events')
  .action(async (name: string, opts: { redirectUri: string[]; webhookUrl?: string }) => {
    const created = await createApp({ name, redirectUris: opts.redirectUri, webhookUrl: opts.webhookUrl });
    console.log(`Created app "${created.app.name}" (${created.app.id})`);
    console.log(`API key: ${created.apiKey}`);
    console.log('Save this key now — it will not be shown again.');
  });

apps
  .command('list')
  .description('List your apps')
  .action(async () => {
    const result = await listApps();
    if (result.length === 0) {
      console.log('No apps yet. Create one with `identiq apps create <name>`.');
      return;
    }
    for (const app of result) {
      console.log(`${app.id}  ${app.name}  (key ${app.apiKeyPrefix}...)`);
    }
  });

apps
  .command('rotate-key')
  .description('Rotate an app’s API key — the old key stops working immediately')
  .argument('<appId>', 'app id')
  .action(async (appId: string) => {
    const rotated = await rotateApiKey(appId);
    console.log(`New API key: ${rotated.apiKey}`);
    console.log('Save this key now — it will not be shown again.');
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  if (error instanceof CliApiError) {
    console.error(`Error (${error.status}): ${error.message}`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
