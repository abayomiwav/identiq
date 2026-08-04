import { Module } from '@nestjs/common';
import { StellarService } from './services/stellar.service';

@Module({
  providers: [StellarService],
  exports: [StellarService],
})
export class StellarModule {}
