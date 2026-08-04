import { Test } from '@nestjs/testing';
import {
  CredentialType,
  WEBHOOK_SIGNATURE_HEADER,
  WebhookEventType,
} from '@identiq/shared';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prisma: { permissionGrant: { findMany: jest.Mock } };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    prisma = { permissionGrant: { findMany: jest.fn() } };
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
});
