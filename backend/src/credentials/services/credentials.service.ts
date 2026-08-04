import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CredentialType,
  DEFAULT_CREDENTIAL_TTL_DAYS,
  WebhookEventType,
} from '@identiq/shared';
import { Credential } from '@prisma/client';
import { hashEvidence } from '../../common/utils/crypto.util';
import { EmailService } from '../../email/services/email.service';
import {
  renderCredentialIssuedEmail,
  renderCredentialRevokedEmail,
} from '../../email/templates/email-templates';
import { IdentityService } from '../../identity/services/identity.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { StellarService } from '../../stellar/services/stellar.service';
import { WebhooksService } from '../../webhooks/services/webhooks.service';
import { IssueCredentialDto } from '../dto/issue-credential.dto';

const SECONDS_PER_DAY = 24 * 60 * 60;
/** Contract requires a non-zero ttl; credentials with no natural expiry get a long-lived anchor instead. */
const NO_EXPIRY_TTL_SECONDS = 100 * 365 * SECONDS_PER_DAY;

@Injectable()
export class CredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identityService: IdentityService,
    private readonly stellarService: StellarService,
    private readonly webhooksService: WebhooksService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async issueCredential(
    userId: string,
    dto: IssueCredentialDto,
  ): Promise<Credential> {
    const identity = await this.identityService.getMyIdentity(userId);
    if (!identity.chainIdentityId) {
      throw new BadRequestException(
        'Identity must be registered on-chain before credentials can be issued',
      );
    }

    const evidenceHash = hashEvidence(dto.evidence);
    const ttlDays = dto.ttlDays ?? DEFAULT_CREDENTIAL_TTL_DAYS[dto.type];
    const expiresAt = ttlDays
      ? new Date(Date.now() + ttlDays * SECONDS_PER_DAY * 1000)
      : null;
    const ttlSeconds = ttlDays
      ? ttlDays * SECONDS_PER_DAY
      : NO_EXPIRY_TTL_SECONDS;

    const chainCredentialId = await this.stellarService.issueCredentialOnChain(
      BigInt(identity.chainIdentityId),
      dto.type,
      Buffer.from(evidenceHash, 'hex'),
      ttlSeconds,
    );

    const credential = await this.prisma.credential.create({
      data: {
        identityId: identity.id,
        type: dto.type,
        evidenceHash,
        expiresAt,
        chainCredentialId: String(chainCredentialId),
      },
    });

    await this.webhooksService.notifyGrantedApps(
      identity.id,
      dto.type,
      WebhookEventType.CREDENTIAL_ISSUED,
      {
        credentialId: credential.id,
        type: credential.type,
      },
    );

    await this.notifyOwner(userId, (dashboardUrl) =>
      renderCredentialIssuedEmail({
        credentialType: credential.type,
        expiresAt: credential.expiresAt?.toISOString() ?? null,
        dashboardUrl,
      }),
    );

    return credential;
  }

  async revokeCredential(
    userId: string,
    credentialId: string,
  ): Promise<Credential> {
    const identity = await this.identityService.getMyIdentity(userId);
    const credential = await this.prisma.credential.findFirst({
      where: { id: credentialId, identityId: identity.id },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }
    if (credential.status === 'REVOKED') {
      throw new ConflictException('Credential is already revoked');
    }

    if (credential.chainCredentialId) {
      await this.stellarService.revokeCredentialOnChainAsPlatform(
        BigInt(credential.chainCredentialId),
      );
    }

    const revoked = await this.prisma.credential.update({
      where: { id: credential.id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    await this.webhooksService.notifyGrantedApps(
      identity.id,
      credential.type as CredentialType,
      WebhookEventType.CREDENTIAL_REVOKED,
      { credentialId: credential.id, type: credential.type },
    );

    await this.notifyOwner(userId, (dashboardUrl) =>
      renderCredentialRevokedEmail({
        credentialType: credential.type,
        dashboardUrl,
      }),
    );

    return revoked;
  }

  async listMyCredentials(userId: string): Promise<Credential[]> {
    const identity = await this.identityService.getMyIdentity(userId);
    return this.prisma.credential.findMany({
      where: { identityId: identity.id },
      orderBy: { issuedAt: 'desc' },
    });
  }

  private async notifyOwner(
    userId: string,
    render: (dashboardUrl: string) => { subject: string; html: string },
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) return;
    const dashboardUrl = `${this.configService.get<string>('webUrl')}/dashboard/credentials`;
    await this.emailService.send(user.email, render(dashboardUrl));
  }
}
