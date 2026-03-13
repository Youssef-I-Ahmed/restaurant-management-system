const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, deactivateUser } = require('../Controllers/userController');
const { authMiddleware, roleAuthorize } = require('../Middleware/authMiddleware');

router.use(authMiddleware, roleAuthorize('admin'));

router.get('/', getAllUsers);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deactivateUser);

module.exports = router;