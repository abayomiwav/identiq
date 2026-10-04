import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { IsPublicWebhookUrl } from '../../common/validators/public-webhook-url.validator';

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
    description:
      'Where Identiq POSTs signed events. In production it must be a public https URL — localhost and private/link-local IPs are rejected.',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @IsPublicWebhookUrl()
  webhookUrl?: string;
}
