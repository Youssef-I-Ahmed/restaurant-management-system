const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  updateUserRole,
  getUserById,
  deactivateUser,
} = require('../Controllers/userController');
const { authMiddleware, roleAuthorize } = require('../Middleware/authMiddleware');
const { validate } = require('../Middleware/validatorMiddleware');
const { updateRoleSchema, updateUserSchema } = require('../validation/userValidation');

router.use(authMiddleware);
router.get("/:id", getUserById);
router.use(roleAuthorize(['admin']));
router.get('/', getAllUsers);
router.put('/:id', validate(updateUserSchema), updateUser);
router.put('/:id/role', validate(updateRoleSchema), updateUserRole);
router.delete('/:id', deactivateUser);

module.exports = router;
