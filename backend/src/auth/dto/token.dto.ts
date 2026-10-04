import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token from the verification email link.' })
  @IsString()
  token!: string;
}

export class EmailOnlyDto {
  @ApiProperty({ example: 'founder@acme.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token from the password reset email link.' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'a-strong-password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
