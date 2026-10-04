/** Email module: exports EmailService for transactional notifications. */

import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
