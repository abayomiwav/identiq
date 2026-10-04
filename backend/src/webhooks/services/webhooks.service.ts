import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CredentialType,
  WEBHOOK_SIGNATURE_HEADER,
  WebhookEventType,
  WebhookPayload,
} from '@identiq/shared';
import { IdentiqApp, Prisma } from '@prisma/client';
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

  /** Delays before each retry of a transiently failed delivery (after the first attempt). */
  retryDelaysMs: number[] = [5_000, 30_000, 120_000];

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
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        appId: app.id,
        event,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    await this.attempt(app, delivery.id, payload, 1);
  }

  /**
   * Sends one delivery attempt and records the outcome. Network errors and
   * 5xx responses are retried with backoff (in the background, so callers
   * aren't held up); 4xx means the app rejected the event on purpose and is
   * not retried.
   */
  private async attempt(
    app: IdentiqApp,
    deliveryId: string,
    payload: WebhookPayload,
    attempt: number,
  ): Promise<void> {
    const rawBody = JSON.stringify(payload);
    const signature = signWebhookPayload(app.webhookSecret, rawBody);

    let status: number | undefined;
    let error: string | undefined;
    try {
      const response = await fetch(app.webhookUrl!, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [WEBHOOK_SIGNATURE_HEADER]: signature,
        },
        body: rawBody,
      });
      status = response.status;
      if (!response.ok) error = `HTTP ${response.status}`;
    } catch (e) {
      error = (e as Error).message;
    }

    const transient =
      error !== undefined && (status === undefined || status >= 500);
    const willRetry = transient && attempt <= this.retryDelaysMs.length;

    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: attempt,
        lastStatus: status ?? null,
        lastError: error ?? null,
        status: !error ? 'SUCCEEDED' : willRetry ? 'PENDING' : 'FAILED',
      },
    });

    if (!error) return;

    this.logger.warn(
      `Webhook delivery ${deliveryId} to ${app.id} failed (attempt ${attempt}): ${error}` +
        (willRetry ? ' — will retry' : ''),
    );

    if (willRetry) {
      setTimeout(
        () => {
          void this.attempt(app, deliveryId, payload, attempt + 1).catch((e) =>
            this.logger.error(
              `Webhook retry for ${deliveryId} crashed: ${(e as Error).message}`,
            ),
          );
        },
        this.retryDelaysMs[attempt - 1],
      ).unref();
    }
  }
}
