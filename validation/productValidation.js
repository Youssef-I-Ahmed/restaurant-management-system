const joi = require("joi");

const createProductSchema = joi.object({
  name: joi.string().min(2).max(100).required(),
  category: joi.string().required(), // ObjectId
  price: joi.number().positive().required(),
  cost: joi.number().min(0).required(),
  is_available: joi.boolean().optional(),
  description: joi.string().allow("").optional(),
});

const updateProductSchema = joi.object({
  name: joi.string().min(2).max(100),
  category: joi.string(),
  price: joi.number().positive(),
  cost: joi.number().min(0),
  is_available: joi.boolean(),
  description: joi.string().allow("").optional(),
});

module.exports = { createProductSchema, updateProductSchema };