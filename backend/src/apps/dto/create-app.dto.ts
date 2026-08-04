import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateAppDto {
  @ApiProperty({ example: 'Acme Marketplace' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    type: [String],
    example: ['https://acme.example/oauth/callback'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({ require_tld: false }, { each: true })
  redirectUris!: string[];

  @ApiProperty({
    required: false,
    example: 'https://acme.example/webhooks/identiq',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  webhookUrl?: string;
}
