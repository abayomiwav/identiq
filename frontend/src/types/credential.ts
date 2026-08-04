import { CredentialType } from "@identiq/shared";

export interface Credential {
  id: string;
  type: CredentialType;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  evidenceHash: string;
  issuedAt: string;
  expiresAt: string | null;
  chainCredentialId: string | null;
}
