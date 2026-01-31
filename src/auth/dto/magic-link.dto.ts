import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MagicLinkDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address to send magic link' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address used for login' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsString()
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code!: string;
}

export class AppleAuthDto {
  @ApiProperty({ description: 'Apple Identity Token from Sign in with Apple' })
  @IsString()
  identityToken!: string;
}

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID Token from Google Sign-In' })
  @IsString()
  idToken!: string;
}

export class AuthTokenResponseDto {
  @ApiProperty({ description: 'JWT access token for API authentication' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token for obtaining new access tokens' })
  refreshToken!: string;

  @ApiProperty({ description: 'User information' })
  user!: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token to exchange for new access token' })
  @IsString()
  refreshToken!: string;
}
