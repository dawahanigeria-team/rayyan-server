import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { 
  LoginDto, RegisterDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto,
  MagicLinkDto, VerifyOtpDto, AuthTokenResponseDto, GoogleAuthDto, AppleAuthDto, RefreshTokenDto
} from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  // ==================== MAGIC LINK AUTH ====================

  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request magic link', description: 'Send a 6-digit OTP code to the provided email' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async requestMagicLink(@Body() magicLinkDto: MagicLinkDto): Promise<{ message: string }> {
    return this.authService.sendMagicLink(magicLinkDto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code', description: 'Verify the OTP code and return auth tokens' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<AuthTokenResponseDto> {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  // ==================== SOCIAL AUTH (Mobile) ====================

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google Sign-In', description: 'Authenticate with Google ID token from mobile app' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  async googleMobileAuth(@Body() googleAuthDto: GoogleAuthDto): Promise<AuthTokenResponseDto> {
    return this.authService.handleGoogleMobileAuth(googleAuthDto);
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apple Sign-In', description: 'Authenticate with Apple identity token from mobile app' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  async appleAuth(@Body() appleAuthDto: AppleAuthDto): Promise<AuthTokenResponseDto> {
    return this.authService.handleAppleAuth(appleAuthDto);
  }

  // ==================== TOKEN MANAGEMENT ====================

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token', description: 'Exchange refresh token for new access token' })
  @ApiResponse({ status: 200, description: 'New tokens generated' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthTokenResponseDto> {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout', description: 'Revoke refresh token' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<void> {
    return this.authService.revokeRefreshToken(refreshTokenDto.refreshToken);
  }

  // ==================== LEGACY WEB AUTH (OAuth redirect flow) ====================

  @Get('google/web')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth (Web)', description: 'Initiate Google OAuth redirect flow for web' })
  async googleAuth() {
    // This endpoint initiates the Google OAuth flow
    // The actual redirect is handled by Passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    // The AuthResponseDto is attached to the request by the GoogleStrategy
    const authResponse = req.user as AuthResponseDto;

    // For now, we'll return the auth response as JSON
    // In production, you might redirect to your frontend with the token
    res.json(authResponse);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  async validateResetToken(@Query('token') token: string): Promise<{ valid: boolean; message?: string }> {
    if (!token) {
      return {
        valid: false,
        message: 'Reset token is required',
      };
    }
    return this.authService.validateResetToken(token);
  }
}