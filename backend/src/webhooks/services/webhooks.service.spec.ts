import { Test } from '@nestjs/testing';
import {
  CredentialType,
  WEBHOOK_SIGNATURE_HEADER,
  WebhookEventType,
} from '@identiq/shared';
import { PrismaService } from '../../prisma/services/prisma.service';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prisma: {
    permissionGrant: { findMany: jest.Mock };
    webhookDelivery: { create: jest.Mock; update: jest.Mock };
  };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    prisma = {
      permissionGrant: { findMany: jest.fn() },
      webhookDelivery: {
        create: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock;

    const moduleRef = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(WebhooksService);
  });

  it('notifies every app with a matching active grant, and only those apps', async () => {
    prisma.permissionGrant.findMany.mockResolvedValue([
      {
        app: {
          id: 'app-1',
          webhookUrl: 'https://app1.example/hook',
          webhookSecret: 'secret-1',
        },
      },
      {
        app: {
          id: 'app-2',
          webhookUrl: 'https://app2.example/hook',
          webhookSecret: 'secret-2',
        },
      },
    ]);

    await service.notifyGrantedApps(
      'identity-1',
      CredentialType.KYC_TIER1,
      WebhookEventType.CREDENTIAL_ISSUED,
      {
        credentialId: 'cred-1',
      },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(prisma.permissionGrant.findMany).toHaveBeenCalledWith({
      where: {
        identityId: 'identity-1',
        credentialType: CredentialType.KYC_TIER1,
        status: 'ACTIVE',
      },
      include: { app: true },
    });
  });

  it('signs the payload with the receiving app’s own webhook secret', async () => {
    await service.dispatch(
      {
        id: 'app-1',
        webhookUrl: 'https://app1.example/hook',
        webhookSecret: 'secret-1',
      } as never,
      WebhookEventType.CREDENTIAL_ISSUED,
      { credentialId: 'cred-1' },
    );

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers[WEBHOOK_SIGNATURE_HEADER]).toBeDefined();
    expect(typeof options.headers[WEBHOOK_SIGNATURE_HEADER]).toBe('string');
  });

  it('skips apps that have no webhook url configured', async () => {
    await service.dispatch(
      { id: 'app-1', webhookUrl: null, webhookSecret: 'secret-1' } as never,
      WebhookEventType.CREDENTIAL_ISSUED,
      {},
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not throw when a webhook delivery fails — dispatch is best-effort', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));

    await expect(
      service.dispatch(
        {
          id: 'app-1',
          webhookUrl: 'https://app1.example/hook',
          webhookSecret: 'secret-1',
        } as never,
        WebhookEventType.CREDENTIAL_ISSUED,
        {},
      ),
    ).resolves.not.toThrow();
  });

  describe('delivery retries', () => {
    const app = {
      id: 'app-1',
      webhookUrl: 'https://app1.example/hook',
      webhookSecret: 'secret-1',
    } as never;

    beforeEach(() => {
      service.retryDelaysMs = [0, 0, 0];
    });

    const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

    it('records a successful first attempt as SUCCEEDED', async () => {
      await service.dispatch(app, WebhookEventType.CREDENTIAL_ISSUED, {});

      expect(prisma.webhookDelivery.create).toHaveBeenCalledTimes(1);
      expect(prisma.webhookDelivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
        data: expect.objectContaining({ attempts: 1, status: 'SUCCEEDED' }),
      });
    });

    it('retries 5xx and network errors until it succeeds', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      await service.dispatch(app, WebhookEventType.CREDENTIAL_ISSUED, {});
      await flush();

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(prisma.webhookDelivery.update).toHaveBeenLastCalledWith({
        where: { id: 'delivery-1' },
        data: expect.objectContaining({ attempts: 3, status: 'SUCCEEDED' }),
      });
    });

    it('marks the delivery FAILED once retries are exhausted', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      await service.dispatch(app, WebhookEventType.CREDENTIAL_ISSUED, {});
      await flush();

      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(prisma.webhookDelivery.update).toHaveBeenLastCalledWith({
        where: { id: 'delivery-1' },
        data: expect.objectContaining({
          attempts: 4,
          status: 'FAILED',
          lastStatus: 500,
        }),
      });
    });

    it('does not retry a 4xx rejection', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 400 });

      await service.dispatch(app, WebhookEventType.CREDENTIAL_ISSUED, {});
      await flush();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(prisma.webhookDelivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
        data: expect.objectContaining({ status: 'FAILED', lastStatus: 400 }),
      });
    });
  });
});
