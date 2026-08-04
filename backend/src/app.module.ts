import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppsModule } from './apps/apps.module';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { CredentialsModule } from './credentials/credentials.module';
import { HealthController } from './health/controllers/health.controller';
import { IdentityModule } from './identity/identity.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PrismaModule } from './prisma/prisma.module';
import { StellarModule } from './stellar/stellar.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate }),
    PrismaModule,
    StellarModule,
    AuthModule,
    IdentityModule,
    CredentialsModule,
    AppsModule,
    PermissionsModule,
    WebhooksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
