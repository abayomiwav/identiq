/**
 * Request body for POST /identity/confirm: the wallet-signed register_identity
 * transaction.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmRegistrationDto {
  @ApiProperty({
    description:
      'The register_identity transaction, signed by the owning wallet.',
  })
  @IsString()
  signedXdr!: string;
}
