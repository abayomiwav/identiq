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
