import { apiRequest } from '../api';
import { CliConfig, resolveApiUrl, saveConfig } from '../config';

export interface LoginOptions {
  email: string;
  password: string;
  apiUrl?: string;
}

interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string };
}

export async function login(options: LoginOptions): Promise<CliConfig> {
  const apiUrl = resolveApiUrl(options.apiUrl);

  const result = await apiRequest<LoginResponse>('POST', '/auth/login', {
    apiUrl,
    body: { email: options.email, password: options.password },
  });

  const config: CliConfig = { apiUrl, accessToken: result.accessToken, email: result.user.email };
  saveConfig(config);
  return config;
}
