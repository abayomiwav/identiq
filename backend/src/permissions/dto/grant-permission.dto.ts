import { ApiProperty } from '@nestjs/swagger';
import { CredentialType } from '@identiq/shared';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/** Consent is time-boxed: a grant lasts at most a year before the user re-approves. */
export const MAX_GRANT_TTL_DAYS = 365;

export class GrantPermissionDto {
  @ApiProperty({ description: 'The app being granted access.' })
  @IsUUID()
  appId!: string;

  @ApiProperty({ enum: CredentialType })
  @IsEnum(CredentialType)
  credentialType!: CredentialType;

  @ApiProperty({
    required: false,
    description:
      'How long the grant stays active, in days (1 to 365). Defaults to 30.',
    minimum: 1,
    maximum: MAX_GRANT_TTL_DAYS,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_GRANT_TTL_DAYS)
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
