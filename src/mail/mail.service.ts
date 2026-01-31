import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMailClient } from 'zeptomail';

export interface PasswordResetEmailData {
  to: string;
  name: string;
  resetToken: string;
  resetUrl: string;
}

export interface OtpEmailData {
  to: string;
  code: string;
  name?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: SendMailClient;
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('zeptomail.url', 'api.zeptomail.com/');
    const token = this.configService.get<string>('zeptomail.token');

    this.logger.log(`ZeptoMail Configuration:`);
    this.logger.log(`- URL: ${url}`);
    this.logger.log(`- Token configured: ${token ? 'Yes (length: ' + token.length + ')' : 'No'}`);

    if (!token) {
      this.logger.warn('ZeptoMail token not configured. Email functionality will be disabled.');
      // Use a dummy token to prevent initialization errors
      this.client = new SendMailClient({ url, token: 'dummy-token' });
    } else {
      this.client = new SendMailClient({ url, token });
    }

    this.fromAddress = this.configService.get<string>('zeptomail.fromAddress', 'noreply@rayyan.app');
    this.fromName = this.configService.get<string>('zeptomail.fromName', 'Rayyan App');

    this.logger.log(`- From Address: ${this.fromAddress}`);
    this.logger.log(`- From Name: ${this.fromName}`);
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<EmailResponse> {
    try {
      const { to, name, resetToken, resetUrl } = data;

      const htmlBody = this.generatePasswordResetHtml(name, resetUrl, resetToken);
      const textBody = this.generatePasswordResetText(name, resetUrl, resetToken);

      this.logger.debug(`Attempting to send password reset email to ${to}`);
      this.logger.debug(`Using from address: ${this.fromAddress}, name: ${this.fromName}`);

      const response = await this.client.sendMail({
        from: {
          address: this.fromAddress,
          name: this.fromName,
        },
        to: [
          {
            email_address: {
              address: to,
              name: name,
            },
          },
        ],
        subject: 'Reset Your Rayyan Password',
        htmlbody: htmlBody,
        textbody: textBody,
        track_clicks: false,
        track_opens: false,
      });

      this.logger.log(`Password reset email sent successfully to ${to}`);
      this.logger.debug(`Response: ${JSON.stringify(response)}`);
      return {
        success: true,
        messageId: response?.data?.[0]?.message_id,
      };
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${data.to}:`);
      this.logger.error(JSON.stringify(error, null, 2));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async sendOtpEmail(data: OtpEmailData): Promise<EmailResponse> {
    try {
      const { to, code, name } = data;
      const displayName = name || 'there';

      const htmlBody = this.generateOtpHtml(displayName, code, to);
      const textBody = this.generateOtpText(displayName, code, to);

      this.logger.debug(`Attempting to send OTP email to ${to}`);

      const response = await this.client.sendMail({
        from: {
          address: this.fromAddress,
          name: this.fromName,
        },
        to: [
          {
            email_address: {
              address: to,
              name: displayName,
            },
          },
        ],
        subject: `${code} is your Rayyan verification code`,
        htmlbody: htmlBody,
        textbody: textBody,
        track_clicks: false,
        track_opens: false,
      });

      this.logger.log(`OTP email sent successfully to ${to}`);
      return {
        success: true,
        messageId: response?.data?.[0]?.message_id,
      };
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${data.to}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<EmailResponse> {
    try {
      const htmlBody = this.generateWelcomeHtml(name);
      const textBody = this.generateWelcomeText(name);

      const response = await this.client.sendMail({
        from: {
          address: this.fromAddress,
          name: this.fromName,
        },
        to: [
          {
            email_address: {
              address: to,
              name: name,
            },
          },
        ],
        subject: 'Welcome to Rayyan - Your Fasting Journey Begins!',
        htmlbody: htmlBody,
        textbody: textBody,
        track_clicks: false,
        track_opens: false,
      });

      this.logger.log(`Welcome email sent successfully to ${to}`);
      return {
        success: true,
        messageId: response?.data?.[0]?.message_id,
      };
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private generatePasswordResetHtml(name: string, resetUrl: string, resetToken: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .token { background-color: #e8e8e8; padding: 10px; font-family: monospace; word-break: break-all; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your Rayyan account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            
            <p>If the link doesn't work, you can use this reset token:</p>
            <div class="token">${resetToken}</div>
            
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            
            <p>If you continue to have problems, please contact our support team.</p>
            
            <p>Best regards,<br>The Rayyan Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 Rayyan App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetText(name: string, resetUrl: string, resetToken: string): string {
    return `
Hello ${name},

We received a request to reset your password for your Rayyan account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${resetUrl}

Or use this reset token: ${resetToken}

This link will expire in 1 hour for security reasons.

If you continue to have problems, please contact our support team.

Best regards,
The Rayyan Team

---
This is an automated message. Please do not reply to this email.
© 2024 Rayyan App. All rights reserved.
    `.trim();
  }

  private generateOtpHtml(name: string, code: string, email: string): string {
    const deepLink = `rayyan://verify?token=${code}&email=${encodeURIComponent(email)}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 40px 30px; background-color: #f9f9f9; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .code-box { background-color: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace; }
          .divider { text-align: center; color: #888; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background-color: #f0f0f0; border-radius: 0 0 10px 10px; }
          .warning { font-size: 14px; color: #888; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌙 Rayyan</h1>
            <p>Your Fasting Companion</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>You requested to sign in to your Rayyan account. Tap the button below to open the app and complete your login:</p>
            
            <div style="text-align: center;">
              <a href="${deepLink}" class="button">Open Rayyan App</a>
            </div>
            
            <p class="divider">— or enter this code manually —</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p><strong>This code expires in 10 minutes.</strong></p>
            
            <p class="warning">If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.</p>
            
            <p>May your fasting journey be blessed,<br>The Rayyan Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2026 Rayyan App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateOtpText(name: string, code: string, email: string): string {
    const deepLink = `rayyan://verify?token=${code}&email=${encodeURIComponent(email)}`;
    
    return `
Hello ${name}!

You requested to sign in to your Rayyan account.

Tap this link to open the app and sign in:
${deepLink}

Or enter this code manually: ${code}

This code expires in 10 minutes.

If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.

May your fasting journey be blessed,
The Rayyan Team

---
This is an automated message. Please do not reply to this email.
© 2026 Rayyan App. All rights reserved.
    `.trim();
  }

  private generateWelcomeHtml(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Rayyan</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .feature { margin: 15px 0; padding: 10px; background-color: white; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Rayyan!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Welcome to Rayyan, your personal fasting companion! We're excited to help you on your fasting journey.</p>
            
            <h3>What you can do with Rayyan:</h3>
            <div class="feature">
              <strong>📅 Track Daily Fasts:</strong> Log your daily fasting activities with ease
            </div>
            <div class="feature">
              <strong>📊 Monitor Progress:</strong> Keep track of your fasting streaks and missed days
            </div>
            <div class="feature">
              <strong>🎯 Set Goals:</strong> Create and manage your fasting schedule
            </div>
            <div class="feature">
              <strong>📱 Stay Connected:</strong> Access your data from anywhere
            </div>
            
            <p>Your account is now ready to use. Start by logging your first fast and begin building healthy habits!</p>
            
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            
            <p>Happy fasting!<br>The Rayyan Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 Rayyan App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeText(name: string): string {
    return `
Hello ${name},

Welcome to Rayyan, your personal fasting companion! We're excited to help you on your fasting journey.

What you can do with Rayyan:
• Track Daily Fasts: Log your daily fasting activities with ease
• Monitor Progress: Keep track of your fasting streaks and missed days  
• Set Goals: Create and manage your fasting schedule
• Stay Connected: Access your data from anywhere

Your account is now ready to use. Start by logging your first fast and begin building healthy habits!

If you have any questions or need help getting started, don't hesitate to reach out to our support team.

Happy fasting!
The Rayyan Team

---
This is an automated message. Please do not reply to this email.
© 2024 Rayyan App. All rights reserved.
    `.trim();
  }
}