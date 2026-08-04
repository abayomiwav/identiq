import { CredentialType } from "@identiq/shared";

export interface Grant {
  id: string;
  appId: string;
  credentialType: CredentialType;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  grantedAt: string;
  expiresAt: string | null;
}
