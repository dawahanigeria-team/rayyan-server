const jwt = require("jsonwebtoken");
const config = require("../config");
const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID =
  "192166565512-gig71o1306r36hguag9nvfve42phb0be.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

const maxAge = config.jwt.maxAge || 365 * 24 * 60 * 60; //3 * 24 * 60 * 60;
const jwtSecret = config.jwt.secret;

// create json web token
const createToken = (payload, secret = jwtSecret, expiresIn = maxAge) => {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  });
};

const verifyToken = (token, secret = jwtSecret) => {
  return jwt.verify(token, secret);
};

const verifyAccessToken = (token) => {
  return client.getTokenInfo(token);
};

module.exports = {
  createToken,
  verifyToken,
  verifyAccessToken,
};
