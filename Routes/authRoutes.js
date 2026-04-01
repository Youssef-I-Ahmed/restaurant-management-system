const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../Controllers/authController');
const { authMiddleware, roleAuthorize } = require('../Middleware/authMiddleware');
const { validate } = require('../Middleware/validatorMiddleware');
const { registerSchema, loginSchema, changePasswordSchema } = require('../validation/authValidation');

router.post('/register', authMiddleware, roleAuthorize(['admin']), validate(registerSchema), register); // array cause we may want to allow more than one role to access this route
router.post('/login', validate(loginSchema), login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), changePassword);

module.exports = router;