const joi = require("joi");

const updateRoleSchema = joi.object({
  role: joi.string()
    .valid('admin', 'manager', 'cashier', 'kitchen')
    .required()
});

const updateUserSchema = joi
  .object({
    name: joi.string().trim().max(100),
    role: joi.string().valid('admin', 'manager', 'cashier', 'kitchen'),
    is_active: joi.boolean(),
    phone: joi.string().allow('').trim(),
    password: joi.string().min(6),
  })
  .min(1);

module.exports = { updateRoleSchema, updateUserSchema };
