import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { InvalidCredentialsException, AccountAlreadyExistsException, InvalidTokenException } from '../common/exceptions';
import { LoginDto, RegisterDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { GoogleProfile } from './strategies/google.strategy';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
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
}