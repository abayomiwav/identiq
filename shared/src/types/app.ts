/** A third-party application registered through the Identiq developer portal. */
export interface IdentiqApp {
  id: string;
  ownerId: string;
  name: string;
  redirectUris: string[];
  /** First 8 characters of the API key, shown in the dashboard; the full key is only ever shown once at creation. */
  apiKeyPrefix: string;
  webhookUrl: string | null;
  createdAt: string;
}

/** Fields a developer supplies when registering an app (POST /apps). */
export interface CreateAppInput {
  name: string;
  redirectUris: string[];
  webhookUrl?: string;
}
