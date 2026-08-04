import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/services/prisma.service';
import { hashApiKey } from '../utils/crypto.util';

export const API_KEY_HEADER = 'x-identiq-api-key';

export interface AuthenticatedApp {
  appId: string;
  ownerId: string;
  name: string;
}

interface RequestWithApp extends Omit<Request, 'app'> {
  app: AuthenticatedApp;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithApp>();
    const apiKey = request.headers[API_KEY_HEADER];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException(`Missing ${API_KEY_HEADER} header`);
    }

    const app = await this.prisma.identiqApp.findFirst({
      where: { apiKeyHash: hashApiKey(apiKey) },
      select: { id: true, ownerId: true, name: true },
    });

    if (!app) {
      throw new UnauthorizedException('Invalid API key');
    }

    const authenticatedApp: AuthenticatedApp = {
      appId: app.id,
      ownerId: app.ownerId,
      name: app.name,
    };
    request.app = authenticatedApp;
    return true;
  }
}
