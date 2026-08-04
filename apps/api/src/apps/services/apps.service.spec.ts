import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AppsService } from './apps.service';

describe('AppsService', () => {
  let service: AppsService;
  let prisma: {
    identiqApp: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      identiqApp: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AppsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AppsService);
  });

  describe('registerApp', () => {
    it('returns the full API key exactly once and never persists it in plaintext', async () => {
      prisma.identiqApp.create.mockImplementation(({ data }) => ({
        id: 'app-1',
        apiKeyHash: data.apiKeyHash,
        apiKeyPrefix: data.apiKeyPrefix,
        webhookSecret: data.webhookSecret,
        ...data,
      }));

      const result = await service.registerApp('user-1', {
        name: 'Acme',
        redirectUris: ['https://acme.example/callback'],
      });

      expect(result.apiKey.startsWith('idq_')).toBe(true);
      expect(result.app).not.toHaveProperty('apiKeyHash');
      const persisted = prisma.identiqApp.create.mock.calls[0][0].data;
      expect(persisted.apiKeyHash).not.toBe(result.apiKey);
    });
  });

  describe('getMyApp / findOwnedApp', () => {
    it('rejects access to an app owned by a different user', async () => {
      prisma.identiqApp.findUnique.mockResolvedValue({
        id: 'app-1',
        ownerId: 'someone-else',
      });

      await expect(service.getMyApp('user-1', 'app-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('raises not found for a nonexistent app', async () => {
      prisma.identiqApp.findUnique.mockResolvedValue(null);

      await expect(service.getMyApp('user-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the sanitized app for its owner', async () => {
      prisma.identiqApp.findUnique.mockResolvedValue({
        id: 'app-1',
        ownerId: 'user-1',
        apiKeyHash: 'hash',
        name: 'Acme',
      });

      const result = await service.getMyApp('user-1', 'app-1');

      expect(result).not.toHaveProperty('apiKeyHash');
      expect(result.name).toBe('Acme');
    });
  });

  describe('getPublicApp', () => {
    it('returns only name and redirect URIs — never keys or secrets', async () => {
      prisma.identiqApp.findUnique.mockResolvedValue({
        id: 'app-1',
        name: 'Acme',
        redirectUris: ['https://acme.example/callback'],
      });

      const result = await service.getPublicApp('app-1');

      expect(result).toEqual({
        id: 'app-1',
        name: 'Acme',
        redirectUris: ['https://acme.example/callback'],
      });
      expect(prisma.identiqApp.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        select: { id: true, name: true, redirectUris: true },
      });
    });

    it('raises not found for a nonexistent app', async () => {
      prisma.identiqApp.findUnique.mockResolvedValue(null);

      await expect(service.getPublicApp('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('regenerateApiKey', () => {
    it('rotates the key and invalidates the old one', async () => {
      prisma.identiqApp.findUnique.mockResolvedValue({
        id: 'app-1',
        ownerId: 'user-1',
      });
      prisma.identiqApp.update.mockImplementation(({ data }) => ({
        id: 'app-1',
        ownerId: 'user-1',
        ...data,
      }));

      const result = await service.regenerateApiKey('user-1', 'app-1');

      expect(result.apiKey.startsWith('idq_')).toBe(true);
      expect(prisma.identiqApp.update).toHaveBeenCalled();
    });

    it('rejects rotation for an app the caller does not own', async () => {
      prisma.identiqApp.findUnique.mockResolvedValue({
        id: 'app-1',
        ownerId: 'someone-else',
      });

      await expect(service.regenerateApiKey('user-1', 'app-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.identiqApp.update).not.toHaveBeenCalled();
    });
  });
});
