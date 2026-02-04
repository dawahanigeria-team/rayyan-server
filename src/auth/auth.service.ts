import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { InvalidCredentialsException, AccountAlreadyExistsException, InvalidTokenException } from '../common/exceptions';
import { LoginDto, RegisterDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto, MagicLinkDto, VerifyOtpDto, AuthTokenResponseDto, GoogleAuthDto, AppleAuthDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { GoogleProfile } from './strategies/google.strategy';
import { Otp, OtpDocument } from './schemas/otp.schema';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';

@Injectable()
export class AuthService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;
  private readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    
    // Find user by email with password
    const user = await this.usersService.findUserWithPassword(email);
    if (!user) {
      throw new InvalidCredentialsException('Invalid email or password');
    }

    // Validate password
    const isPasswordValid = await this.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException('Invalid email or password');
    }

    // Generate JWT token
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Return response without password (schema transform handles this)
    const userResponse = user.toObject();
    
    return {
      access_token,
      accessToken: access_token,
      user: userResponse,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      throw new AccountAlreadyExistsException('An account with this email address already exists');
    }

    // Create user (password will be hashed by the schema pre-save middleware)
    const user = await this.usersService.createUser({
      firstName,
      lastName,
      email,
      password,
    });

      // Send welcome email (optional, don't fail registration if email fails)
      try {
          await this.mailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);
      } catch (error) {
          console.warn('Failed to send welcome email:', error);
      }

    // Generate JWT token
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Return response without password (schema transform handles this)
    const userResponse = JSON.parse(JSON.stringify(user));

    return {
      access_token,
      accessToken: access_token,
      user: userResponse,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findUserWithPassword(email);
    if (user && await this.validatePassword(password, user.password)) {
      return user.toObject();
    }
    return null;
  }

  generateJwtToken(user: any): string {
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    return this.jwtService.sign(payload);
  }

    async handleGoogleAuth(profile: GoogleProfile): Promise<AuthResponseDto> {
        const { id: googleId, emails, name } = profile;
        const email = emails[0]?.value;

        if (!email) {
            throw new UnauthorizedException('No email found in Google profile');
        }

        // Check if user exists with this Google ID
        let user = await this.usersService.findUserByGoogleId(googleId);

        if (!user) {
            // Check if user exists with this email (for linking accounts)
            user = await this.usersService.findUserByEmail(email);

            if (user) {
                // Link Google account to existing user
                user = await this.usersService.updateUser(user._id.toString(), { googleId });
            } else {
                // Create new user from Google profile
                user = await this.usersService.createUser({
                    firstName: name.givenName,
                    lastName: name.familyName,
                    email,
                    password: Math.random().toString(36).slice(-8), // Random password for OAuth users
                    googleId,
                });
            }
        }

        // Generate JWT token
        const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
        const access_token = this.jwtService.sign(payload);

        // Return response without password (schema transform handles this)
        const userResponse = JSON.parse(JSON.stringify(user));

    return {
      access_token,
      accessToken: access_token,
      user: userResponse,
    };
    }

  private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
        const { email } = forgotPasswordDto;

        // Create password reset token (returns null if user doesn't exist)
        const result = await this.usersService.createPasswordResetToken(email);

        // Always return success message for security (don't reveal if email exists)
        if (result) {
            const { token, user } = result;
            const resetUrl = this.buildResetUrl(token);

            // Send password reset email
            try {
                await this.mailService.sendPasswordResetEmail({
                    to: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    resetToken: token,
                    resetUrl,
                });
            } catch (error) {
                console.error('Failed to send password reset email:', error);
                // Don't throw error to avoid revealing email existence
            }
        }

        return {
            message: 'If an account with that email exists, we have sent a password reset link.',
        };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
        const { token, password } = resetPasswordDto;

        // Validate token and reset password
        const success = await this.usersService.resetPassword(token, password);

        if (!success) {
          throw new InvalidTokenException('Invalid or expired reset token');
        }

        return {
            message: 'Password has been reset successfully. You can now log in with your new password.',
        };
    }

    async validateResetToken(token: string): Promise<{ valid: boolean; message?: string }> {
        const result = await this.usersService.validatePasswordResetToken(token);

        if (!result.valid) {
            return {
                valid: false,
                message: 'Invalid or expired reset token',
            };
        }

        return {
            valid: true,
            message: 'Token is valid',
        };
    }

    private buildResetUrl(token: string): string {
        const baseUrl = this.configService.get<string>('app.frontendUrl', 'http://localhost:3000');
        return `${baseUrl}/reset-password?token=${token}`;
    }

  // ==================== MAGIC LINK AUTH ====================

  async sendMagicLink(dto: MagicLinkDto): Promise<{ message: string }> {
    const { email } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // Invalidate any existing OTPs for this email
    await this.otpModel.updateMany(
      { email: normalizedEmail, used: false },
      { used: true }
    );

    // Generate 6-digit OTP
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Check if user exists to get their name
    const existingUser = await this.usersService.findUserByEmail(normalizedEmail);

    // Store OTP
    await this.otpModel.create({
      email: normalizedEmail,
      code: await bcrypt.hash(code, 10),
      expiresAt,
      user: existingUser?._id,
    });

    // Send OTP email
    await this.mailService.sendOtpEmail({
      to: normalizedEmail,
      code,
      name: existingUser ? `${existingUser.firstName}` : undefined,
    });

    return { message: 'Check your email for the verification code' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthTokenResponseDto> {
    const { email, code } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // Find valid OTP
    const otp = await this.otpModel.findOne({
      email: normalizedEmail,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      throw new InvalidCredentialsException('Invalid or expired verification code');
    }

    // Check attempts
    if (otp.attempts >= this.MAX_OTP_ATTEMPTS) {
      otp.used = true;
      await otp.save();
      throw new BadRequestException('Too many failed attempts. Please request a new code.');
    }

    // Verify code
    const isValid = await bcrypt.compare(code, otp.code);
    if (!isValid) {
      otp.attempts += 1;
      await otp.save();
      throw new InvalidCredentialsException('Invalid verification code');
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    // Find or create user
    let user = await this.usersService.findUserByEmail(normalizedEmail);
    if (!user) {
      user = await this.usersService.createUser({
        email: normalizedEmail,
        firstName: 'User',
        lastName: '',
        password: crypto.randomBytes(32).toString('hex'),
      });
    }

    // Generate tokens
    return this.generateAuthTokens(user);
  }

  // ==================== SOCIAL AUTH (Mobile) ====================

  async handleGoogleMobileAuth(dto: GoogleAuthDto): Promise<AuthTokenResponseDto> {
    const { idToken } = dto;

    // Verify Google ID token
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID'));

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { email, given_name, family_name, sub: googleId } = payload;

      // Find or create user
      let user = await this.usersService.findUserByGoogleId(googleId);
      if (!user) {
        user = await this.usersService.findUserByEmail(email);
        if (user) {
          user = await this.usersService.updateUser(user._id.toString(), { googleId });
        } else {
          user = await this.usersService.createUser({
            email,
            firstName: given_name || 'User',
            lastName: family_name || '',
            password: crypto.randomBytes(32).toString('hex'),
            googleId,
          });
        }
      }

      return this.generateAuthTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  async handleAppleAuth(dto: AppleAuthDto): Promise<AuthTokenResponseDto> {
    const { identityToken } = dto;

    // Decode Apple identity token (JWT)
    try {
      const decoded = this.jwtService.decode(identityToken) as any;
      if (!decoded || !decoded.email) {
        throw new UnauthorizedException('Invalid Apple token');
      }

      const { email, sub: appleId } = decoded;

      // Find or create user
      let user = await this.usersService.findUserByEmail(email);
      if (!user) {
        user = await this.usersService.createUser({
          email,
          firstName: 'User',
          lastName: '',
          password: crypto.randomBytes(32).toString('hex'),
          appleId,
        });
      } else if (!user.appleId) {
        user = await this.usersService.updateUser(user._id.toString(), { appleId });
      }

      return this.generateAuthTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Failed to verify Apple token');
    }
  }

  // ==================== TOKEN MANAGEMENT ====================

  private async generateAuthTokens(user: any): Promise<AuthTokenResponseDto> {
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };

    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token (long-lived)
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await this.refreshTokenModel.create({
      user: user._id,
      token: refreshTokenValue,
      expiresAt: refreshTokenExpiry,
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokenResponseDto> {
    const tokenDoc = await this.refreshTokenModel.findOne({
      token: refreshToken,
      revoked: false,
      expiresAt: { $gt: new Date() },
    }).populate('user');

    if (!tokenDoc || !tokenDoc.user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke current refresh token (rotation)
    tokenDoc.revoked = true;
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();

    // Generate new tokens
    return this.generateAuthTokens(tokenDoc.user);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { token: refreshToken },
      { revoked: true, revokedAt: new Date() }
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { user: userId, revoked: false },
      { revoked: true, revokedAt: new Date() }
    );
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
