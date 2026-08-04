import { apiRequest } from '../api';
import { requireConfig } from '../config';

export interface RemoteApp {
  id: string;
  name: string;
  redirectUris: string[];
  apiKeyPrefix: string;
  webhookUrl: string | null;
  webhookSecret: string;
  createdAt: string;
}

export interface CreatedApp {
  app: RemoteApp;
  apiKey: string;
}

export interface CreateAppOptions {
  name: string;
  redirectUris: string[];
  webhookUrl?: string;
}

export async function createApp(options: CreateAppOptions): Promise<CreatedApp> {
  const config = requireConfig();
  return apiRequest<CreatedApp>('POST', '/apps', {
    apiUrl: config.apiUrl,
    accessToken: config.accessToken,
    body: { name: options.name, redirectUris: options.redirectUris, webhookUrl: options.webhookUrl },
  });
}

export async function listApps(): Promise<RemoteApp[]> {
  const config = requireConfig();
  return apiRequest<RemoteApp[]>('GET', '/apps', { apiUrl: config.apiUrl, accessToken: config.accessToken });
}

export async function rotateApiKey(appId: string): Promise<CreatedApp> {
  const config = requireConfig();
  return apiRequest<CreatedApp>('POST', `/apps/${appId}/rotate-key`, {
    apiUrl: config.apiUrl,
    accessToken: config.accessToken,
  });
}
