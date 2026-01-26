import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

// Mock ZeptoMail
jest.mock('zeptomail', () => ({
  SendMailClient: jest.fn().mockImplementation(() => ({
    sendMail: jest.fn().mockResolvedValue({
      data: [{ message_id: 'test-message-id' }],
    }),
  })),
}));

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                'zeptomail.url': 'api.zeptomail.com/',
                'zeptomail.token': 'test-token',
                'zeptomail.fromAddress': 'test@example.com',
                'zeptomail.fromName': 'Test App',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const emailData = {
        to: 'user@example.com',
        name: 'Test User',
        resetToken: 'test-token',
        resetUrl: 'http://example.com/reset?token=test-token',
      };

      const result = await service.sendPasswordResetEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
    });

    it('should handle email sending errors gracefully', async () => {
      // Mock the sendMail to throw an error
      const mockSendMail = jest.fn().mockRejectedValue(new Error('Email service error'));
      (service as any).client.sendMail = mockSendMail;

      const emailData = {
        to: 'user@example.com',
        name: 'Test User',
        resetToken: 'test-token',
        resetUrl: 'http://example.com/reset?token=test-token',
      };

      const result = await service.sendPasswordResetEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service error');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const result = await service.sendWelcomeEmail('user@example.com', 'Test User');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
    });

    it('should handle welcome email errors gracefully', async () => {
      // Mock the sendMail to throw an error
      const mockSendMail = jest.fn().mockRejectedValue(new Error('Email service error'));
      (service as any).client.sendMail = mockSendMail;

      const result = await service.sendWelcomeEmail('user@example.com', 'Test User');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service error');
    });
  });
});