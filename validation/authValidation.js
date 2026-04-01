const joi = require("joi");

const registerSchema = joi.object({
    name: joi.string().min(3).max(100).required(),
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
    role: joi.string().valid('admin', 'manager', 'cashier', 'kitchen'),
    is_active: joi.boolean(),
});

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
});

const changePasswordSchema = joi.object({
  currentPassword: joi.string().required(),
  newPassword: joi.string().min(8).required()
});

module.exports = { registerSchema, loginSchema, changePasswordSchema };