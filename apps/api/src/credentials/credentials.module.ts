import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { IdentityModule } from '../identity/identity.module';
import { StellarModule } from '../stellar/stellar.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';

@Module({
  imports: [IdentityModule, StellarModule, WebhooksModule, EmailModule],
  controllers: [CredentialsController],
  providers: [CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
