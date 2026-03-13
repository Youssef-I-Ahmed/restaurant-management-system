const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../Controllers/authController');
const { authMiddleware } = require('../Middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;