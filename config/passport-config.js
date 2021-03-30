const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const config = require('./index');
const { userService } = require('../services');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    userService.getUserById(id).then((user) => {
        done(null, user);
    });
});


// local authentication
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    }, async (email, password, done) => {
        try {
            const user = await userService.loginWithEmailAndPassword(email, password);
            return done(null, user);
        } catch (error) {
            console.error(error.message);
            done(error, false, { message: error.message });
        }
    })
);


const opts = {};
// opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.jwtFromRequest = ExtractJwt.fromHeader('authorization');
opts.secretOrKey = config.jwt.secret;


// JWT auth
passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const user = await userService.getUserById(jwt_payload.id);
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        }
        catch (error) {
            console.error(error);
        }
    })
);

// Google auth
passport.use(
    new GoogleStrategy({
        // options for strategy
        callbackURL: 'http://localhost:5000/api/auth/google/callback',
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
    },
        async (accessToken, refreshToken, profile, done) => {
            // passport callback function
            try {
                const userData = {
                    firstName: profile._json.given_name.toLowerCase(),
                    lastName: profile._json.family_name.toLowerCase(),
                    email: profile._json.email,
                    picture: profile._json.picture,
                    isConfirmed: true,
                };
                const user = await userService.registerWithThirdParty(userData);
                done(null, user);
            } catch (error) {
                console.error(error.message);
                done(null, false);
            }
        })
);

passport.use(new FacebookStrategy({
    clientID: config.facebook.appID,
    clientSecret: config.facebook.appSecret,
    callbackURL: 'http://localhost:5000/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name'],
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const userData = {
                firstName: profile._json.first_name.toLowerCase(),
                lastName: profile._json.last_name.toLowerCase(),
                email: profile._json.email,
                isConfirmed: true,
            };
            const user = await userService.registerWithThirdParty(userData);
            done(null, user);
        } catch (error) {
            console.error(error.message);
            done(null, false);
        }
    }
));