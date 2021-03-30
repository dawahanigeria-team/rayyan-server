const dotenv = require('dotenv');

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
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
};