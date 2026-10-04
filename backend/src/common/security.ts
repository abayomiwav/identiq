import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/**
 * Baseline HTTP security headers (nosniff, HSTS, frame-ancestors, referrer
 * policy, no X-Powered-By). CSP is turned off: this is a JSON API, and
 * helmet's default CSP blocks the inline scripts Swagger UI at /docs needs.
 */
export function applySecurityHeaders(app: INestApplication): void {
  app.use(helmet({ contentSecurityPolicy: false }));
}
