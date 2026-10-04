import { CredentialType } from "@identiq/shared";

export interface Grant {
  id: string;
  appId: string;
  credentialType: CredentialType;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  grantedAt: string;
  expiresAt: string | null;
  /** The app this grant is for, so the UI can show its name instead of a UUID. */
  app: { id: string; name: string };
}
