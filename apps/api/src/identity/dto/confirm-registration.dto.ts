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
