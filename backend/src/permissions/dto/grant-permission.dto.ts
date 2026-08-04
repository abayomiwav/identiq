import { ApiProperty } from '@nestjs/swagger';
import { CredentialType } from '@identiq/shared';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class GrantPermissionDto {
  @ApiProperty({ description: 'The app being granted access.' })
  @IsUUID()
  appId!: string;

  @ApiProperty({ enum: CredentialType })
  @IsEnum(CredentialType)
  credentialType!: CredentialType;

  @ApiProperty({
    required: false,
    description: 'How long the grant stays active, in days. Defaults to 30.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  ttlDays?: number;
}

export class CheckAccessDto {
  @ApiProperty()
  @IsString()
  identityId!: string;

  @ApiProperty({ enum: CredentialType })
  @IsEnum(CredentialType)
  credentialType!: CredentialType;
}
