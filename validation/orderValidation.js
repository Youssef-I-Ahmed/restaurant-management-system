const joi = require("joi");

const orderItemSchema = joi.object({
  product: joi.string().required(),
  quantity: joi.number().integer().min(1).required(),
});

const createOrderSchema = joi.object({
  items: joi.array().items(orderItemSchema).min(1).required(),
});

const updateOrderSchema = joi.object({
  items: joi.array().items(orderItemSchema).min(1).required(),
});

const updateOrderStatusSchema = joi.object({
  status: joi.string().valid("preparing", "ready", "completed").required(),
});

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
};
