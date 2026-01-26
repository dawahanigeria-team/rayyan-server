import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

describe('AuthService - Password Reset', () => {
  let service: AuthService;
  let usersService: UsersService;
  let mailService: MailService;

  const mockUser = {
    _id: 'user-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            createPasswordResetToken: jest.fn(),
            resetPassword: jest.fn(),
            validatePasswordResetToken: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                'app.frontendUrl': 'http://localhost:3000',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
  });

  describe('forgotPassword', () => {
    it('should send password reset email when user exists', async () => {
      const token = 'reset-token';
      jest.spyOn(usersService, 'createPasswordResetToken').mockResolvedValue({
        token,
        user: mockUser as any,
      });
      jest.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue({
        success: true,
        messageId: 'message-id',
      });

      const result = await service.forgotPassword({ email: 'john@example.com' });

      expect(result.message).toBe('If an account with that email exists, we have sent a password reset link.');
      expect(usersService.createPasswordResetToken).toHaveBeenCalledWith('john@example.com');
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        name: 'John Doe',
        resetToken: token,
        resetUrl: `http://localhost:3000/reset-password?token=${token}`,
      });
    });

    it('should return success message even when user does not exist', async () => {
      jest.spyOn(usersService, 'createPasswordResetToken').mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nonexistent@example.com' });

      expect(result.message).toBe('If an account with that email exists, we have sent a password reset link.');
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      const token = 'reset-token';
      jest.spyOn(usersService, 'createPasswordResetToken').mockResolvedValue({
        token,
        user: mockUser as any,
      });
      jest.spyOn(mailService, 'sendPasswordResetEmail').mockRejectedValue(new Error('Email error'));

      const result = await service.forgotPassword({ email: 'john@example.com' });

      expect(result.message).toBe('If an account with that email exists, we have sent a password reset link.');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with valid token', async () => {
      jest.spyOn(usersService, 'resetPassword').mockResolvedValue(true);

      const result = await service.resetPassword({
        token: 'valid-token',
        password: 'NewPassword123',
      });

      expect(result.message).toBe('Password has been reset successfully. You can now log in with your new password.');
      expect(usersService.resetPassword).toHaveBeenCalledWith('valid-token', 'NewPassword123');
    });

    it('should throw BadRequestException with invalid token', async () => {
      jest.spyOn(usersService, 'resetPassword').mockResolvedValue(false);

      await expect(service.resetPassword({
        token: 'invalid-token',
        password: 'NewPassword123',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateResetToken', () => {
    it('should return valid true for valid token', async () => {
      jest.spyOn(usersService, 'validatePasswordResetToken').mockResolvedValue({
        valid: true,
        user: mockUser as any,
      });

      const result = await service.validateResetToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.message).toBe('Token is valid');
    });

    it('should return valid false for invalid token', async () => {
      jest.spyOn(usersService, 'validatePasswordResetToken').mockResolvedValue({
        valid: false,
      });

      const result = await service.validateResetToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid or expired reset token');
    });
  });
});