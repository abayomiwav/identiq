/** Frontend shapes for developer apps as returned by the API. */

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

export interface PublicApp {
  id: string;
  name: string;
  redirectUris: string[];
}
