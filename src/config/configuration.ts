export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rayyan-backend',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/auth/google/callback',
  },
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  },
  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200'],
  },
  zeptomail: {
    url: process.env.ZEPTOMAIL_URL || 'api.zeptomail.com/',
    token: process.env.ZEPTOMAIL_TOKEN,
    fromAddress: process.env.ZEPTOMAIL_FROM_ADDRESS || 'noreply@rayyan.app',
    fromName: process.env.ZEPTOMAIL_FROM_NAME || 'Rayyan App',
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});
