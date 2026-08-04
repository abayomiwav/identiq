import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CredentialType,
  WEBHOOK_SIGNATURE_HEADER,
  WebhookEventType,
  WebhookPayload,
} from '@identiq/shared';
import { IdentiqApp } from '@prisma/client';
import { signWebhookPayload } from '../../common/utils/crypto.util';
import { PrismaService } from '../../prisma/services/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Notifies every app that currently holds an active permission grant for this identity + credential type. */
  async notifyGrantedApps(
    identityId: string,
    credentialType: CredentialType,
    event: WebhookEventType,
    data: Record<string, unknown>,
  ): Promise<void> {
    const grants = await this.prisma.permissionGrant.findMany({
      where: { identityId, credentialType, status: 'ACTIVE' },
      include: { app: true },
    });

    await Promise.all(
      grants.map((grant) =>
        this.dispatch(grant.app, event, { identityId, ...data }),
      ),
    );
  }

  async dispatch(
    app: IdentiqApp,
    event: WebhookEventType,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (!app.webhookUrl) return;

    const payload: WebhookPayload = {
      event,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      data,
    };
    const rawBody = JSON.stringify(payload);
    const signature = signWebhookPayload(app.webhookSecret, rawBody);

    try {
      const response = await fetch(app.webhookUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [WEBHOOK_SIGNATURE_HEADER]: signature,
        },
        body: rawBody,
      });

      if (!response.ok) {
        this.logger.warn(
          `Webhook delivery to ${app.id} returned status ${response.status}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Webhook delivery to ${app.id} failed: ${(error as Error).message}`,
      );
    }
  }
}
