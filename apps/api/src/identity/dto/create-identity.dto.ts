import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CreateIdentityDto {
  @ApiProperty({
    description:
      'The Stellar public key (G...) this identity will be anchored to.',
    example: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
  })
  @IsString()
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'stellarPublicKey must be a valid Stellar public key',
  })
  stellarPublicKey!: string;
}
