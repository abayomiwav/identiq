import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CredentialType, WebhookEventType } from '@identiq/shared';
import { EmailService } from '../../email/services/email.service';
import { IdentityService } from '../../identity/services/identity.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { StellarService } from '../../stellar/services/stellar.service';
import { WebhooksService } from '../../webhooks/services/webhooks.service';
import { CredentialsService } from './credentials.service';

describe('CredentialsService', () => {
  let service: CredentialsService;
  let prisma: {
    credential: {
      create: jest.Mock;
      update: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
    user: { findUnique: jest.Mock };
  };
  let identityService: { getMyIdentity: jest.Mock };
  let stellarService: {
    issueCredentialOnChain: jest.Mock;
    revokeCredentialOnChainAsPlatform: jest.Mock;
  };
  let webhooksService: { notifyGrantedApps: jest.Mock };
  let emailService: { send: jest.Mock };

  const anchoredIdentity = {
    id: 'identity-1',
    userId: 'user-1',
    chainIdentityId: '42',
  };

  beforeEach(async () => {
    prisma = {
      credential: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ email: 'a@identiq.app' }),
      },
    };
    identityService = {
      getMyIdentity: jest.fn().mockResolvedValue(anchoredIdentity),
    };
    stellarService = {
      issueCredentialOnChain: jest.fn().mockResolvedValue(99n),
      revokeCredentialOnChainAsPlatform: jest.fn().mockResolvedValue(undefined),
    };
    webhooksService = {
      notifyGrantedApps: jest.fn().mockResolvedValue(undefined),
    };
    emailService = { send: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CredentialsService,
        { provide: PrismaService, useValue: prisma },
        { provide: IdentityService, useValue: identityService },
        { provide: StellarService, useValue: stellarService },
        { provide: WebhooksService, useValue: webhooksService },
        { provide: EmailService, useValue: emailService },
        {
          provide: ConfigService,
          useValue: { get: () => 'http://localhost:3001' },
        },
      ],
    }).compile();

    service = moduleRef.get(CredentialsService);
  });

  describe('issueCredential', () => {
    it('hashes the evidence, anchors on-chain, and never persists the raw evidence', async () => {
      prisma.credential.create.mockImplementation(({ data }) => ({
        id: 'cred-1',
        ...data,
      }));

      const result = await service.issueCredential('user-1', {
        type: CredentialType.KYC_TIER1,
        evidence: 'raw-passport-scan-bytes',
      });

      const createArgs = prisma.credential.create.mock.calls[0][0].data;
      expect(createArgs.evidenceHash).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(createArgs)).not.toContain(
        'raw-passport-scan-bytes',
      );
      expect(createArgs.chainCredentialId).toBe('99');
      expect(result.id).toBe('cred-1');
      expect(webhooksService.notifyGrantedApps).toHaveBeenCalledWith(
        'identity-1',
        CredentialType.KYC_TIER1,
        WebhookEventType.CREDENTIAL_ISSUED,
        expect.objectContaining({ credentialId: 'cred-1' }),
      );
      expect(emailService.send).toHaveBeenCalledWith(
        'a@identiq.app',
        expect.objectContaining({
          subject: expect.stringContaining('KYC_TIER1'),
        }),
      );
    });

    it('applies the default TTL for the credential type when none is given', async () => {
      prisma.credential.create.mockImplementation(({ data }) => ({
        id: 'cred-1',
        ...data,
      }));

      await service.issueCredential('user-1', {
        type: CredentialType.KYC_TIER1,
        evidence: 'evidence',
      });

      const createArgs = prisma.credential.create.mock.calls[0][0].data;
      expect(createArgs.expiresAt).toBeInstanceOf(Date);
      const daysUntilExpiry =
        (createArgs.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysUntilExpiry).toBeGreaterThan(364);
      expect(daysUntilExpiry).toBeLessThan(366);
    });

    it('leaves expiresAt null for credential types with no default TTL', async () => {
      prisma.credential.create.mockImplementation(({ data }) => ({
        id: 'cred-1',
        ...data,
      }));

      await service.issueCredential('user-1', {
        type: CredentialType.EMAIL_VERIFIED,
        evidence: 'evidence',
      });

      expect(
        prisma.credential.create.mock.calls[0][0].data.expiresAt,
      ).toBeNull();
    });

    it('rejects issuance when the identity has not been anchored on-chain yet', async () => {
      identityService.getMyIdentity.mockResolvedValue({
        id: 'identity-1',
        chainIdentityId: null,
      });

      await expect(
        service.issueCredential('user-1', {
          type: CredentialType.KYC_TIER1,
          evidence: 'evidence',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(stellarService.issueCredentialOnChain).not.toHaveBeenCalled();
    });
  });

  describe('revokeCredential', () => {
    it('revokes on-chain and off-chain, and notifies apps with an active grant', async () => {
      prisma.credential.findFirst.mockResolvedValue({
        id: 'cred-1',
        identityId: 'identity-1',
        type: CredentialType.KYC_TIER1,
        status: 'ACTIVE',
        chainCredentialId: '99',
      });
      prisma.credential.update.mockImplementation(({ data }) => ({
        id: 'cred-1',
        ...data,
      }));

      await service.revokeCredential('user-1', 'cred-1');

      expect(
        stellarService.revokeCredentialOnChainAsPlatform,
      ).toHaveBeenCalledWith(99n);
      expect(prisma.credential.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'REVOKED' }),
        }),
      );
      expect(webhooksService.notifyGrantedApps).toHaveBeenCalledWith(
        'identity-1',
        CredentialType.KYC_TIER1,
        WebhookEventType.CREDENTIAL_REVOKED,
        expect.objectContaining({ credentialId: 'cred-1' }),
      );
      expect(emailService.send).toHaveBeenCalledWith(
        'a@identiq.app',
        expect.any(Object),
      );
    });

    it('rejects revoking a credential that belongs to someone else', async () => {
      prisma.credential.findFirst.mockResolvedValue(null);

      await expect(
        service.revokeCredential('user-1', 'not-mine'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects double revocation', async () => {
      prisma.credential.findFirst.mockResolvedValue({
        id: 'cred-1',
        status: 'REVOKED',
      });

      await expect(
        service.revokeCredential('user-1', 'cred-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
