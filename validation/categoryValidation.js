const joi = require("joi");

const createCategorySchema = joi.object({
  name: joi.string().min(2).max(100).required(),
  parent: joi.string().optional().allow(null),
});

const updateCategorySchema = joi
  .object({
    name: joi.string().min(2).max(100),
    parent: joi.string().optional().allow(null),
  })
  .min(1);

module.exports = { createCategorySchema, updateCategorySchema };
