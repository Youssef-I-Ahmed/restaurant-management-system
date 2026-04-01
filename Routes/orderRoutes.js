const express = require("express");
const router = express.Router();

const {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
} = require("../Controllers/orderController");

const { authMiddleware, roleAuthorize } = require("../Middleware/authMiddleware");
const { validate } = require("../Middleware/validatorMiddleware");

const {
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
} = require("../validation/orderValidation");

router.get(
  "/",
  authMiddleware,
  roleAuthorize(["admin", "manager", "cashier", "kitchen"]),
  listOrders
);
router.get(
  "/:id",
  authMiddleware,
  roleAuthorize(["admin", "manager", "cashier", "kitchen"]),
  getOrder
);

router.post(
  "/",
  authMiddleware,
  roleAuthorize(["cashier", "admin"]),
  validate(createOrderSchema),
  createOrder
);

router.put(
  "/:id",
  authMiddleware,
  roleAuthorize(["cashier", "admin"]),
  validate(updateOrderSchema),
  updateOrder
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleAuthorize(["kitchen", "cashier", "admin"]),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

router.delete(
  "/:id",
  authMiddleware,
  roleAuthorize(["cashier", "admin", "manager"]),
  cancelOrder
);

module.exports = router;
