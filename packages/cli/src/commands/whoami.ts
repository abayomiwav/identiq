import { requireConfig } from '../config/config';

export interface WhoamiResult {
  email: string;
  apiUrl: string;
}

export function whoami(): WhoamiResult {
  const config = requireConfig();
  return { email: config.email, apiUrl: config.apiUrl };
}
