import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookEventType } from '@identiq/shared';
import { PermissionGrant } from '@prisma/client';
import { EmailService } from '../email/email.service';
import {
  renderPermissionGrantedEmail,
  renderPermissionRevokedEmail,
} from '../email/email-templates';
import { IdentityService } from '../identity/identity.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { CheckAccessDto, GrantPermissionDto } from './dto/grant-permission.dto';

const DEFAULT_GRANT_TTL_DAYS = 30;

export interface AccessCheckResult {
  verified: boolean;
  credential: { type: string; issuedAt: Date; expiresAt: Date | null } | null;
  checkedAt: string;
}

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identityService: IdentityService,
    private readonly webhooksService: WebhooksService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async grantPermission(
    userId: string,
    dto: GrantPermissionDto,
  ): Promise<PermissionGrant> {
    const identity = await this.identityService.getMyIdentity(userId);
    const app = await this.prisma.identiqApp.findUnique({
      where: { id: dto.appId },
    });
    if (!app) {
      throw new NotFoundException('App not found');
    }

    const ttlDays = dto.ttlDays ?? DEFAULT_GRANT_TTL_DAYS;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const grant = await this.prisma.permissionGrant.upsert({
      where: {
        identityId_appId_credentialType: {
          identityId: identity.id,
          appId: dto.appId,
          credentialType: dto.credentialType,
        },
      },
      create: {
        identityId: identity.id,
        appId: dto.appId,
        credentialType: dto.credentialType,
        expiresAt,
      },
      update: {
        status: 'ACTIVE',
        grantedAt: new Date(),
        expiresAt,
        revokedAt: null,
      },
    });

    await this.webhooksService.dispatch(
      app,
      WebhookEventType.PERMISSION_GRANTED,
      {
        grantId: grant.id,
        identityId: identity.id,
        credentialType: grant.credentialType,
      },
    );

    await this.notifyOwner(userId, (dashboardUrl) =>
      renderPermissionGrantedEmail({
        appName: app.name,
        credentialType: grant.credentialType,
        dashboardUrl,
      }),
    );

    return grant;
  }

  async revokePermission(
    userId: string,
    grantId: string,
  ): Promise<PermissionGrant> {
    const identity = await this.identityService.getMyIdentity(userId);
    const grant = await this.prisma.permissionGrant.findFirst({
      where: { id: grantId, identityId: identity.id },
      include: { app: true },
    });

    if (!grant) {
      throw new NotFoundException('Permission grant not found');
    }
    if (grant.status === 'REVOKED') {
      throw new ConflictException('Permission grant is already revoked');
    }

    const updated = await this.prisma.permissionGrant.update({
      where: { id: grant.id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    await this.webhooksService.dispatch(
      grant.app,
      WebhookEventType.PERMISSION_REVOKED,
      {
        grantId: grant.id,
        identityId: identity.id,
        credentialType: grant.credentialType,
      },
    );

    await this.notifyOwner(userId, (dashboardUrl) =>
      renderPermissionRevokedEmail({
        appName: grant.app.name,
        credentialType: grant.credentialType,
        dashboardUrl,
      }),
    );

    return updated;
  }

  async listMyGrants(userId: string): Promise<PermissionGrant[]> {
    const identity = await this.identityService.getMyIdentity(userId);
    return this.prisma.permissionGrant.findMany({
      where: { identityId: identity.id },
      orderBy: { grantedAt: 'desc' },
    });
  }

  /** Called by third-party apps (API key auth) to check what a granted identity is willing to reveal. */
  async checkAccess(
    appId: string,
    dto: CheckAccessDto,
  ): Promise<AccessCheckResult> {
    const now = new Date();
    const grant = await this.prisma.permissionGrant.findFirst({
      where: {
        identityId: dto.identityId,
        appId,
        credentialType: dto.credentialType,
        status: 'ACTIVE',
      },
    });

    if (!grant || (grant.expiresAt && grant.expiresAt <= now)) {
      throw new ForbiddenException(
        'No active permission grant for this credential type',
      );
    }

    const credential = await this.prisma.credential.findFirst({
      where: {
        identityId: dto.identityId,
        type: dto.credentialType,
        status: 'ACTIVE',
      },
      orderBy: { issuedAt: 'desc' },
    });

    const verified =
      !!credential && (!credential.expiresAt || credential.expiresAt > now);

    return {
      verified,
      credential: credential
        ? {
            type: credential.type,
            issuedAt: credential.issuedAt,
            expiresAt: credential.expiresAt,
          }
        : null,
      checkedAt: now.toISOString(),
    };
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
    const dashboardUrl = `${this.configService.get<string>('webUrl')}/dashboard/permissions`;
    await this.emailService.send(user.email, render(dashboardUrl));
  }
}
