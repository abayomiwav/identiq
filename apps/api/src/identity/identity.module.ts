import { Module } from '@nestjs/common';
import { StellarModule } from '../stellar/stellar.module';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';

@Module({
  imports: [StellarModule],
  controllers: [IdentityController],
  providers: [IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
