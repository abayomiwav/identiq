/** Global Prisma module so every feature module can inject PrismaService. */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
