const joi = require("joi");

const updateInventorySchema = joi.object({
  quantity: joi.number().integer().min(0).required(),
  low_stock_threshold: joi.number().integer().min(0).optional(),
});

const restockInventorySchema = joi.object({
  product: joi.string().optional(),
  productId: joi.string().optional(),
  quantity: joi.number().integer().min(1).required(),
  reason: joi.string().allow("").optional(),
}).or("product", "productId");

module.exports = {
  updateInventorySchema,
  restockInventorySchema,
};
