import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { computeReputationScore, WalletReputation } from '@identiq/shared';
import { Identity } from '@prisma/client';
import { PrismaService } from '../../prisma/services/prisma.service';
import { StellarService } from '../../stellar/services/stellar.service';
import { ConfirmRegistrationDto } from '../dto/confirm-registration.dto';
import { CreateIdentityDto } from '../dto/create-identity.dto';

export interface IdentityWithUnsignedXdr {
  identity: Identity;
  unsignedXdr: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stellarService: StellarService,
  ) {}

  async createIdentity(
    userId: string,
    dto: CreateIdentityDto,
  ): Promise<IdentityWithUnsignedXdr> {
    const existing = await this.prisma.identity.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('This account already has an identity');
    }

    const publicKeyTaken = await this.prisma.identity.findUnique({
      where: { stellarPublicKey: dto.stellarPublicKey },
    });
    if (publicKeyTaken) {
      throw new ConflictException(
        'This Stellar address is already linked to another identity',
      );
    }

    const identity = await this.prisma.identity.create({
      data: { userId, stellarPublicKey: dto.stellarPublicKey },
    });

    const unsignedXdr = await this.stellarService.buildRegisterIdentityXdr(
      dto.stellarPublicKey,
    );

    return { identity, unsignedXdr };
  }

  async confirmRegistration(
    userId: string,
    dto: ConfirmRegistrationDto,
  ): Promise<Identity> {
    const identity = await this.getMyIdentity(userId);

    if (identity.chainIdentityId) {
      throw new ConflictException('Identity is already registered on-chain');
    }

    const { returnValue } = await this.stellarService.submitSignedTransaction(
      dto.signedXdr,
    );

    return this.prisma.identity.update({
      where: { id: identity.id },
      data: { chainIdentityId: String(returnValue) },
    });
  }

  async getMyIdentity(userId: string): Promise<Identity> {
    const identity = await this.prisma.identity.findUnique({
      where: { userId },
    });
    if (!identity) {
      throw new NotFoundException('No identity found for this account yet');
    }
    return identity;
  }

  async getReputation(userId: string): Promise<WalletReputation> {
    const identity = await this.getMyIdentity(userId);
    const now = new Date();

    const [
      activeCredentialCount,
      revokedCredentialCount,
      activePermissionGrantCount,
    ] = await Promise.all([
      this.prisma.credential.count({
        where: {
          identityId: identity.id,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      this.prisma.credential.count({
        where: { identityId: identity.id, status: 'REVOKED' },
      }),
      this.prisma.permissionGrant.count({
        where: {
          identityId: identity.id,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
    ]);

    const accountAgeDays = Math.floor(
      (now.getTime() - identity.createdAt.getTime()) / MS_PER_DAY,
    );
    const factors = {
      accountAgeDays,
      activeCredentialCount,
      activePermissionGrantCount,
      revokedCredentialCount,
    };

    return {
      identityId: identity.id,
      score: computeReputationScore(factors),
      factors,
      computedAt: now.toISOString(),
    };
  }
}
