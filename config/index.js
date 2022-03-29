const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  PORT: process.env.PORT,
  mongo: {
    url: process.env.MONGO_URI,
    dbName: process.env.MONGO_DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    maxAge: process.env.JWT_MAX_AGE,
    emailSecret: process.env.JWT_EMAIL_SECRET,
  },
  google: {
    clientID:
      "192166565512-sridjrda8ao5o1789t7pdr970e9rc2po.apps.googleusercontent.com",
    clientSecret: "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",
  },
  facebook: {
    appID: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
  },
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    service: process.env.EMAIL_SERVICE,
  },
  client: {
    url: process.env.CLIENT_URL,
    resetUrl: process.env.CLIENT_RESET_URL,
    oauthRedirectUrl: process.env.CLIENT_OAUTH_REDIRECT_URL,
    confirmUrl: process.env.CLIENT_CONFIRM_URL,
  },
  mailJet: {
    apiKey: process.env.MAILJET_API_KEY,
    secretKey: process.env.MAILJET_SECRET_KEY,
  },
};
