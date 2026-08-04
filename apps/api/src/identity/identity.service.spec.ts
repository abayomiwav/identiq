import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StellarService } from '../stellar/stellar.service';
import { IdentityService } from './identity.service';

describe('IdentityService', () => {
  let service: IdentityService;
  let prisma: {
    identity: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    credential: { count: jest.Mock };
    permissionGrant: { count: jest.Mock };
  };
  let stellarService: {
    buildRegisterIdentityXdr: jest.Mock;
    submitSignedTransaction: jest.Mock;
  };

  const STELLAR_PUBLIC_KEY =
    'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';

  beforeEach(async () => {
    prisma = {
      identity: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      credential: { count: jest.fn() },
      permissionGrant: { count: jest.fn() },
    };
    stellarService = {
      buildRegisterIdentityXdr: jest.fn().mockResolvedValue('unsigned-xdr'),
      submitSignedTransaction: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IdentityService,
        { provide: PrismaService, useValue: prisma },
        { provide: StellarService, useValue: stellarService },
      ],
    }).compile();

    service = moduleRef.get(IdentityService);
  });

  describe('createIdentity', () => {
    it('creates an off-chain identity and returns unsigned XDR for the owner to sign', async () => {
      prisma.identity.findUnique.mockResolvedValue(null);
      prisma.identity.create.mockResolvedValue({
        id: 'identity-1',
        userId: 'user-1',
        stellarPublicKey: STELLAR_PUBLIC_KEY,
      });

      const result = await service.createIdentity('user-1', {
        stellarPublicKey: STELLAR_PUBLIC_KEY,
      });

      expect(result.unsignedXdr).toBe('unsigned-xdr');
      expect(result.identity.id).toBe('identity-1');
      expect(stellarService.buildRegisterIdentityXdr).toHaveBeenCalledWith(
        STELLAR_PUBLIC_KEY,
      );
    });

    it('rejects a second identity for the same account', async () => {
      prisma.identity.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        service.createIdentity('user-1', {
          stellarPublicKey: STELLAR_PUBLIC_KEY,
        }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.identity.create).not.toHaveBeenCalled();
    });

    it('rejects a Stellar address already linked to a different identity', async () => {
      prisma.identity.findUnique
        .mockResolvedValueOnce(null) // no identity for this user
        .mockResolvedValueOnce({ id: 'someone-elses-identity' }); // key already taken

      await expect(
        service.createIdentity('user-1', {
          stellarPublicKey: STELLAR_PUBLIC_KEY,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('confirmRegistration', () => {
    it('submits the signed transaction and stores the on-chain identity id', async () => {
      prisma.identity.findUnique.mockResolvedValue({
        id: 'identity-1',
        userId: 'user-1',
        chainIdentityId: null,
        createdAt: new Date(),
      });
      stellarService.submitSignedTransaction.mockResolvedValue({
        hash: 'abc',
        returnValue: 7n,
      });
      prisma.identity.update.mockResolvedValue({
        id: 'identity-1',
        chainIdentityId: '7',
      });

      const result = await service.confirmRegistration('user-1', {
        signedXdr: 'signed-xdr',
      });

      expect(prisma.identity.update).toHaveBeenCalledWith({
        where: { id: 'identity-1' },
        data: { chainIdentityId: '7' },
      });
      expect(result.chainIdentityId).toBe('7');
    });

    it('rejects re-confirming an identity that is already anchored on-chain', async () => {
      prisma.identity.findUnique.mockResolvedValue({
        id: 'identity-1',
        chainIdentityId: '7',
      });

      await expect(
        service.confirmRegistration('user-1', { signedXdr: 'signed-xdr' }),
      ).rejects.toThrow(ConflictException);
      expect(stellarService.submitSignedTransaction).not.toHaveBeenCalled();
    });

    it('raises not found when the account has no identity yet', async () => {
      prisma.identity.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmRegistration('user-1', { signedXdr: 'signed-xdr' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReputation', () => {
    it('computes the reputation score from live counts, not a stored value', async () => {
      const createdAt = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      prisma.identity.findUnique.mockResolvedValue({
        id: 'identity-1',
        userId: 'user-1',
        createdAt,
      });
      prisma.credential.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
      prisma.permissionGrant.count.mockResolvedValue(2);

      const reputation = await service.getReputation('user-1');

      expect(reputation.identityId).toBe('identity-1');
      expect(reputation.factors).toEqual({
        accountAgeDays: 365,
        activeCredentialCount: 3,
        activePermissionGrantCount: 2,
        revokedCredentialCount: 1,
      });
      // 30 (age) + 30 (credentials, capped contribution from 3*10) + 8 (grants, 2*4) - 15 (1 revocation) = 53
      expect(reputation.score).toBe(53);
    });
  });
});
