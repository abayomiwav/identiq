import { Module } from '@nestjs/common';
import { WebhooksService } from './services/webhooks.service';

@Module({
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
