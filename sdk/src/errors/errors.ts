/** Error type thrown by the SDK for failed Identiq API calls. */

export class IdentiqApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'IdentiqApiError';
  }
}
