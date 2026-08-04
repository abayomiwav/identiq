import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CredentialType, WebhookEventType } from '@identiq/shared';
import { EmailService } from '../../email/services/email.service';
import { IdentityService } from '../../identity/services/identity.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { WebhooksService } from '../../webhooks/services/webhooks.service';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: {
    identiqApp: { findUnique: jest.Mock };
    permissionGrant: {
      upsert: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    credential: { findFirst: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let identityService: { getMyIdentity: jest.Mock };
  let webhooksService: { dispatch: jest.Mock };
  let emailService: { send: jest.Mock };

  const identity = { id: 'identity-1', userId: 'user-1' };

  beforeEach(async () => {
    prisma = {
      identiqApp: { findUnique: jest.fn() },
      permissionGrant: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      credential: { findFirst: jest.fn() },
      user: {
        findUnique: jest.fn().mockResolvedValue({ email: 'a@identiq.app' }),
      },
    };
    identityService = { getMyIdentity: jest.fn().mockResolvedValue(identity) };
    webhooksService = { dispatch: jest.fn().mockResolvedValue(undefined) };
    emailService = { send: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: IdentityService, useValue: identityService },
        { provide: WebhooksService, useValue: webhooksService },
        { provide: EmailService, useValue: emailService },
        {
          provide: ConfigService,
          useValue: { get: () => 'http://localhost:3001' },
        },
      ],
    }).compile();

    service = moduleRef.get(PermissionsService);
  });

  describe('grantPermission', () => {
    it('creates a grant and notifies the app', async () => {
      prisma.identiqApp.findUnique.mockResolvedValue({
        id: 'app-1',
        name: 'Acme',
      });
      prisma.permissionGrant.upsert.mockImplementation(({ create }) => ({
        id: 'grant-1',
        ...create,
      }));

      const grant = await service.grantPermission('user-1', {
        appId: 'app-1',
        credentialType: CredentialType.KYC_TIER1,
      });

      expect(grant.id).toBe('grant-1');
      expect(webhooksService.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'app-1' }),
        WebhookEventType.PERMISSION_GRANTED,
        expect.objectContaining({ grantId: 'grant-1' }),
      );
      expect(emailService.send).toHaveBeenCalledWith(
        'a@identiq.app',
        expect.objectContaining({ subject: expect.stringContaining('Acme') }),
      );
    });

    it('rejects granting access to an app that does not exist', async () => {
      prisma.identiqApp.findUnique.mockResolvedValue(null);

      await expect(
        service.grantPermission('user-1', {
          appId: 'missing',
          credentialType: CredentialType.KYC_TIER1,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokePermission', () => {
    it('revokes an existing grant and notifies the app', async () => {
      prisma.permissionGrant.findFirst.mockResolvedValue({
        id: 'grant-1',
        identityId: 'identity-1',
        status: 'ACTIVE',
        credentialType: CredentialType.KYC_TIER1,
        app: { id: 'app-1', name: 'Acme' },
      });
      prisma.permissionGrant.update.mockImplementation(({ data }) => ({
        id: 'grant-1',
        ...data,
      }));

      const result = await service.revokePermission('user-1', 'grant-1');

      expect(result.status).toBe('REVOKED');
      expect(webhooksService.dispatch).toHaveBeenCalledWith(
        { id: 'app-1', name: 'Acme' },
        WebhookEventType.PERMISSION_REVOKED,
        expect.objectContaining({ grantId: 'grant-1' }),
      );
      expect(emailService.send).toHaveBeenCalledWith(
        'a@identiq.app',
        expect.any(Object),
      );
    });

    it('rejects revoking a grant that is already revoked', async () => {
      prisma.permissionGrant.findFirst.mockResolvedValue({
        id: 'grant-1',
        status: 'REVOKED',
      });

      await expect(
        service.revokePermission('user-1', 'grant-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects revoking a grant that does not belong to the caller', async () => {
      prisma.permissionGrant.findFirst.mockResolvedValue(null);

      await expect(
        service.revokePermission('user-1', 'not-mine'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkAccess', () => {
    it('returns verified: true when an active grant and a valid credential both exist', async () => {
      prisma.permissionGrant.findFirst.mockResolvedValue({
        id: 'grant-1',
        status: 'ACTIVE',
        expiresAt: null,
      });
      prisma.credential.findFirst.mockResolvedValue({
        type: CredentialType.KYC_TIER1,
        status: 'ACTIVE',
        issuedAt: new Date(),
        expiresAt: null,
      });

      const result = await service.checkAccess('app-1', {
        identityId: 'identity-1',
        credentialType: CredentialType.KYC_TIER1,
      });

      expect(result.verified).toBe(true);
      expect(result.credential).not.toBeNull();
    });

    it('returns verified: false when the grant is active but no credential of that type exists', async () => {
      prisma.permissionGrant.findFirst.mockResolvedValue({
        id: 'grant-1',
        status: 'ACTIVE',
        expiresAt: null,
      });
      prisma.credential.findFirst.mockResolvedValue(null);

      const result = await service.checkAccess('app-1', {
        identityId: 'identity-1',
        credentialType: CredentialType.KYC_TIER1,
      });

      expect(result.verified).toBe(false);
      expect(result.credential).toBeNull();
    });

    it('rejects the check outright when the app has no active grant — this is the access-control boundary', async () => {
      prisma.permissionGrant.findFirst.mockResolvedValue(null);

      await expect(
        service.checkAccess('app-1', {
          identityId: 'identity-1',
          credentialType: CredentialType.KYC_TIER1,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.credential.findFirst).not.toHaveBeenCalled();
    });

    it('rejects the check when the grant has expired', async () => {
      prisma.permissionGrant.findFirst.mockResolvedValue({
        id: 'grant-1',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.checkAccess('app-1', {
          identityId: 'identity-1',
          credentialType: CredentialType.KYC_TIER1,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
