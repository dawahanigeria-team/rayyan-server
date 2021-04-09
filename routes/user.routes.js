const { Router } = require('express');
const { userController } = require('../controllers');
const { authMiddleware } = require('../middlewares');
const { requireAuth, isAdmin } = authMiddleware;

const router = Router();

router.route('/')
    .get([requireAuth, isAdmin], userController.getUsers)
    .post([
        requireAuth,
        isAdmin,
        
    ], userController.createUser);


router.route('/profile')
    .get(requireAuth, userController.getUserProfile)
    .put([
        requireAuth,
        
    ], userController.updateUserProfile);


router.route('/get-activation-email')
    .get(userController.sendConfirmEmail);

router.route('/confirmation/:token')
    .get(userController.confirmEmail);

router.route('/:id')
    .get([requireAuth, isAdmin], userController.getUserById)
    .delete([requireAuth, isAdmin], userController.deleteUser)
    .put([
        requireAuth,
        isAdmin
    ], userController.updateUser);

module.exports = router;
