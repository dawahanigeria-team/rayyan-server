# ZeptoMail Integration for Rayyan Backend API

This document describes the ZeptoMail integration for sending transactional emails in the Rayyan Backend API.

## Overview

ZeptoMail is a transactional email service by Zoho that allows sending emails like password resets, welcome messages, and other automated communications. This integration provides a robust email service for the Rayyan application.

## Features

- **Password Reset Emails**: Send secure password reset links to users
- **Welcome Emails**: Send welcome messages to newly registered users
- **HTML & Text Templates**: Professional email templates with both HTML and plain text versions
- **Error Handling**: Graceful error handling with logging
- **Configuration**: Flexible configuration through environment variables

## Setup

### 1. ZeptoMail Account Setup

1. Sign up for a [ZeptoMail account](https://www.zoho.com/zeptomail/)
2. Create a Mail Agent in your ZeptoMail dashboard
3. Navigate to SMTP/API tab and copy your Send Mail Token
4. Configure your domain and verify it (for production use)

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# ZeptoMail Configuration
ZEPTOMAIL_URL=api.zeptomail.com/
ZEPTOMAIL_TOKEN=your-zeptomail-send-mail-token
ZEPTOMAIL_FROM_ADDRESS=noreply@yourdomain.com
ZEPTOMAIL_FROM_NAME=Rayyan App

# Frontend Configuration (for reset links)
FRONTEND_URL=http://localhost:3000
```

### 3. Domain Verification (Production)

For production use, you need to:
1. Add your domain to ZeptoMail
2. Verify domain ownership via DNS records
3. Update `ZEPTOMAIL_FROM_ADDRESS` to use your verified domain

## API Endpoints

### Password Reset Flow

#### 1. Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, we have sent a password reset link."
}
```

#### 2. Validate Reset Token
```http
GET /api/auth/validate-reset-token?token=your-reset-token
```

**Response:**
```json
{
  "valid": true,
  "message": "Token is valid"
}
```

#### 3. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "your-reset-token",
  "password": "NewPassword123"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

## Email Templates

### Password Reset Email

The password reset email includes:
- Professional HTML template with Rayyan branding
- Clear call-to-action button
- Fallback text link
- Security information (1-hour expiration)
- Plain text version for accessibility

### Welcome Email

The welcome email includes:
- Welcome message with user's name
- Overview of Rayyan features
- Professional branding
- Plain text version

## Security Features

### Password Reset Security

1. **Token Expiration**: Reset tokens expire after 1 hour
2. **Single Use**: Tokens are invalidated after use
3. **Token Invalidation**: New reset requests invalidate previous tokens
4. **No Email Enumeration**: Same response regardless of email existence
5. **Secure Token Generation**: Cryptographically secure random tokens

### Email Security

1. **No Tracking**: Click and open tracking disabled for privacy
2. **Secure Links**: HTTPS-only reset URLs
3. **Error Handling**: Email failures don't expose system information

## Usage Examples

### Sending Password Reset Email

```typescript
import { MailService } from './mail/mail.service';

// In your service
async sendPasswordReset(email: string) {
  const result = await this.usersService.createPasswordResetToken(email);
  
  if (result) {
    const { token, user } = result;
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    
    await this.mailService.sendPasswordResetEmail({
      to: user.email,
      name: `${user.firstName} ${user.lastName}`,
      resetToken: token,
      resetUrl,
    });
  }
}
```

### Sending Welcome Email

```typescript
// After user registration
await this.mailService.sendWelcomeEmail(
  user.email,
  `${user.firstName} ${user.lastName}`
);
```

## Error Handling

The mail service includes comprehensive error handling:

1. **Configuration Errors**: Warns if ZeptoMail token is not configured
2. **Network Errors**: Handles API failures gracefully
3. **Logging**: Detailed error logging for debugging
4. **Fallback**: Application continues to work even if emails fail

## Testing

### Unit Tests

Run the mail service tests:
```bash
npm test -- --testPathPatterns=mail
```

### Password Reset Tests

Run the password reset functionality tests:
```bash
npm test -- --testPathPatterns=password-reset
```

### Manual Testing

1. Set up ZeptoMail credentials in `.env`
2. Start the application: `npm run start:dev`
3. Test password reset flow:
   ```bash
   # Request password reset
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   
   # Check your email for the reset link
   # Use the token from the email to reset password
   curl -X POST http://localhost:3000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token":"your-token","password":"NewPassword123"}'
   ```

## Monitoring and Logging

### Log Messages

The service logs important events:
- Successful email sends
- Email failures with error details
- Configuration warnings

### Monitoring

Monitor these metrics in production:
- Email delivery success rate
- Token usage and expiration
- Failed email attempts

## Troubleshooting

### Common Issues

1. **"ZeptoMail token not configured"**
   - Add `ZEPTOMAIL_TOKEN` to your environment variables

2. **"Email service error"**
   - Check your ZeptoMail token validity
   - Verify domain configuration
   - Check network connectivity

3. **"Invalid or expired reset token"**
   - Tokens expire after 1 hour
   - Tokens are single-use only
   - Check token format and completeness

### Debug Mode

Enable debug logging by setting log level to debug in your configuration.

## Production Considerations

1. **Domain Verification**: Verify your sending domain with ZeptoMail
2. **Rate Limiting**: ZeptoMail has rate limits - implement appropriate throttling
3. **Monitoring**: Set up monitoring for email delivery failures
4. **Backup**: Consider backup email service for critical emails
5. **Templates**: Customize email templates to match your brand
6. **Localization**: Add multi-language support for international users

## API Rate Limits

ZeptoMail has the following limits:
- Free plan: 10,000 emails/month
- Paid plans: Higher limits based on subscription
- API rate limit: Check ZeptoMail documentation for current limits

## Support

For ZeptoMail-specific issues:
- [ZeptoMail Documentation](https://www.zoho.com/zeptomail/help/)
- [ZeptoMail Support](mailto:support@zeptomail.com)

For integration issues:
- Check the logs for detailed error messages
- Verify environment configuration
- Test with ZeptoMail's API directly to isolate issues