import { isIP } from 'node:net';
import { registerDecorator, ValidationOptions } from 'class-validator';

/** True for loopback, private, link-local, CGNAT and unspecified IPv4/IPv6 literals. */
export function isNonPublicIp(host: string): boolean {
  const ip = host.replace(/^\[|\]$/g, '').toLowerCase();
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (version === 6) {
    if (ip === '::' || ip === '::1') return true;
    // IPv4-mapped addresses: dotted (::ffff:127.0.0.1) or, as WHATWG URL
    // normalises them, hex (::ffff:7f00:1).
    const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(ip);
    if (dotted) return isNonPublicIp(dotted[1]);
    const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(ip);
    if (hex) {
      const [hi, lo] = [parseInt(hex[1], 16), parseInt(hex[2], 16)];
      return isNonPublicIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    return /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip);
  }
  return false;
}

/**
 * Whether Identiq's servers may POST webhooks to `value`. Outside
 * development the URL must be https and must not point at localhost or a
 * private/link-local IP, so a developer can't aim deliveries at internal
 * infrastructure (cloud metadata, databases, admin panels).
 */
export function isPublicWebhookUrl(
  value: unknown,
  allowLocal = process.env.NODE_ENV !== 'production',
): boolean {
  if (typeof value !== 'string') return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  if (allowLocal) return true;

  const host = url.hostname.toLowerCase();
  return (
    url.protocol === 'https:' &&
    host !== 'localhost' &&
    !host.endsWith('.localhost') &&
    !isNonPublicIp(host)
  );
}

export function IsPublicWebhookUrl(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isPublicWebhookUrl',
      target: object.constructor,
      propertyName,
      options: {
        message:
          'webhookUrl must be a public https URL (not localhost or a private IP address)',
        ...options,
      },
      validator: { validate: (value: unknown) => isPublicWebhookUrl(value) },
    });
}
