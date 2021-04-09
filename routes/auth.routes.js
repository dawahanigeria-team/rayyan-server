const { Router } = require('express');
const { authController } = require('../controllers');
const passport = require('passport');

const router = Router();

// local auth
router.route('/register')
    .post(authController.registerUser);

router.route('/login')
    .post(authController.loginWithEmailAndPassword);

// password reset
router.route('/password-reset/get-code')
    .post(authController.sendResetPasswordEmail);

router.route('/password-reset/verify/:token')
    .post( authController.resetPassword);

// google auth
router.route('/google').get(authController.loginWithGoogle);

router.route('/google/callback')
    .get(passport.authenticate('google'), authController.authThirdPartyCallback);

// facebook auth
router.route('/facebook').get(authController.loginWithFacebook);

router.route('/facebook/callback')
    .get(passport.authenticate('facebook'), authController.authThirdPartyCallback);

module.exports = router;