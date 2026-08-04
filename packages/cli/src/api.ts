export class CliApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'CliApiError';
  }
}

export interface RequestOptions {
  apiUrl: string;
  accessToken?: string;
  body?: unknown;
}

export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  options: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.accessToken) {
    headers.authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${options.apiUrl.replace(/\/$/, '')}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = (payload as { message?: string | string[] })?.message;
    throw new CliApiError(
      Array.isArray(message) ? message.join(', ') : (message ?? `Request failed with status ${response.status}`),
      response.status,
    );
  }

  return payload as T;
}
