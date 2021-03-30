const jwt = require('jsonwebtoken');
const config = require('../config');


const maxAge = config.jwt.maxAge || 365 * 24 * 60 * 60; //3 * 24 * 60 * 60;
const jwtSecret = config.jwt.secret;


// create json web token
const createToken = (payload, secret = jwtSecret, expiresIn = maxAge) => {
    return jwt.sign(payload, secret, {
        expiresIn: expiresIn
    });
};

const verifyToken = (token, secret = jwtSecret) => {
    return jwt.verify(token, secret);
}

module.exports = {
    createToken,
    verifyToken,
}