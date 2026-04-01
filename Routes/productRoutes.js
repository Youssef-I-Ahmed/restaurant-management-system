const express = require("express");
const router = express.Router();

const {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
} = require("../Controllers/productController");

const { authMiddleware, roleAuthorize } = require("../Middleware/authMiddleware");
const { validate } = require("../Middleware/validatorMiddleware");

const {
    createProductSchema,
    updateProductSchema,
} = require("../validation/productValidation");

router.get("/", authMiddleware, getProducts);
router.get("/:id", authMiddleware, getProduct);

router.post(
    "/",
    authMiddleware,
    roleAuthorize(["admin", "manager"]),
    validate(createProductSchema),
    createProduct
);

router.put(
    "/:id",
    authMiddleware,
    roleAuthorize(["admin", "manager"]),
    validate(updateProductSchema),
    updateProduct
);

router.delete(
    "/:id",
    authMiddleware,
    roleAuthorize(["admin", "manager"]),
    deleteProduct
);

router.patch(
    "/:id/status",
    authMiddleware,
    roleAuthorize(["admin", "manager"]),
    toggleProductStatus
);

module.exports = router;