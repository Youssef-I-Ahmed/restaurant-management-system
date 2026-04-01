const express = require("express");
const router = express.Router();

const {
  listInventory,
  getInventoryByProduct,
  updateInventoryQuantity,
  restockInventory,
  listLowStock,
  listInventoryLogs,
} = require("../Controllers/inventoryController");

const { authMiddleware, roleAuthorize } = require("../Middleware/authMiddleware");
const { validate } = require("../Middleware/validatorMiddleware");

const {
  updateInventorySchema,
  restockInventorySchema,
} = require("../validation/inventoryValidation");

router.get("/", authMiddleware, roleAuthorize(["admin", "manager"]), listInventory);
router.get(
  "/logs",
  authMiddleware,
  roleAuthorize(["admin", "manager"]),
  listInventoryLogs
);
router.get(
  "/low-stock",
  authMiddleware,
  roleAuthorize(["admin", "manager"]),
  listLowStock
);
router.get(
  "/:productId",
  authMiddleware,
  roleAuthorize(["admin", "manager"]),
  getInventoryByProduct
);

router.put(
  "/:productId",
  authMiddleware,
  roleAuthorize(["admin", "manager"]),
  validate(updateInventorySchema),
  updateInventoryQuantity
);

router.post(
  "/restock",
  authMiddleware,
  roleAuthorize(["admin", "manager"]),
  validate(restockInventorySchema),
  restockInventory
);

module.exports = router;
