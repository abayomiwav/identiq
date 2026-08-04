import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IdentiqApp } from '@prisma/client';
import {
  generateApiKey,
  generateWebhookSecret,
  hashApiKey,
} from '../../common/utils/crypto.util';
import { PrismaService } from '../../prisma/services/prisma.service';
import { CreateAppDto } from '../dto/create-app.dto';

export type SanitizedApp = Omit<IdentiqApp, 'apiKeyHash'>;

export interface CreatedApp {
  app: SanitizedApp;
  /** The full API key — returned exactly once. It cannot be retrieved again after this response. */
  apiKey: string;
}

function sanitize(app: IdentiqApp): SanitizedApp {
  const { apiKeyHash: _apiKeyHash, ...sanitized } = app;
  return sanitized;
}

@Injectable()
export class AppsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerApp(ownerId: string, dto: CreateAppDto): Promise<CreatedApp> {
    const { fullKey, prefix } = generateApiKey();
    const webhookSecret = generateWebhookSecret();

    const app = await this.prisma.identiqApp.create({
      data: {
        ownerId,
        name: dto.name,
        redirectUris: dto.redirectUris,
        webhookUrl: dto.webhookUrl,
        apiKeyPrefix: prefix,
        apiKeyHash: hashApiKey(fullKey),
        webhookSecret,
      },
    });

    return { app: sanitize(app), apiKey: fullKey };
  }

  async listMyApps(ownerId: string): Promise<SanitizedApp[]> {
    const apps = await this.prisma.identiqApp.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
    return apps.map(sanitize);
  }

  async getMyApp(ownerId: string, appId: string): Promise<SanitizedApp> {
    const app = await this.findOwnedApp(ownerId, appId);
    return sanitize(app);
  }

  /** Public, unauthenticated lookup used by the consent screen — name and redirect URIs only, no secrets. */
  async getPublicApp(
    appId: string,
  ): Promise<{ id: string; name: string; redirectUris: string[] }> {
    const app = await this.prisma.identiqApp.findUnique({
      where: { id: appId },
      select: { id: true, name: true, redirectUris: true },
    });
    if (!app) {
      throw new NotFoundException('App not found');
    }
    return app;
  }

  async regenerateApiKey(ownerId: string, appId: string): Promise<CreatedApp> {
    await this.findOwnedApp(ownerId, appId);
    const { fullKey, prefix } = generateApiKey();

    const app = await this.prisma.identiqApp.update({
      where: { id: appId },
      data: { apiKeyPrefix: prefix, apiKeyHash: hashApiKey(fullKey) },
    });

    return { app: sanitize(app), apiKey: fullKey };
  }

  async deleteApp(ownerId: string, appId: string): Promise<void> {
    await this.findOwnedApp(ownerId, appId);
    await this.prisma.identiqApp.delete({ where: { id: appId } });
  }

  private async findOwnedApp(
    ownerId: string,
    appId: string,
  ): Promise<IdentiqApp> {
    const app = await this.prisma.identiqApp.findUnique({
      where: { id: appId },
    });
    if (!app) {
      throw new NotFoundException('App not found');
    }
    if (app.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this app');
    }
    return app;
  }
}
