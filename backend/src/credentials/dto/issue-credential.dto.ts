import { ApiProperty } from '@nestjs/swagger';
import { CredentialType } from '@identiq/shared';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

/** Upper bound keeps `expiresAt` a valid Date and credentials meaningfully time-boxed. */
export const MAX_CREDENTIAL_TTL_DAYS = 3650;

export class IssueCredentialDto {
  @ApiProperty({ enum: CredentialType })
  @IsEnum(CredentialType)
  type!: CredentialType;

  @ApiProperty({
    description:
      'The evidence that was checked to satisfy this credential (e.g. a document reference or verification payload). Identiq stores only its SHA-256 hash — never this value.',
  })
  @IsString()
  @MinLength(1)
  evidence!: string;

  @ApiProperty({
    required: false,
    description:
      'Override the default validity window, in days (1 to 3650, i.e. at most 10 years).',
    minimum: 1,
    maximum: MAX_CREDENTIAL_TTL_DAYS,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_CREDENTIAL_TTL_DAYS)
  ttlDays?: number;
}
