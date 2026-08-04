import { ApiProperty } from '@nestjs/swagger';
import { CredentialType } from '@identiq/shared';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

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
    description: 'Override the default validity window, in days.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  ttlDays?: number;
}
