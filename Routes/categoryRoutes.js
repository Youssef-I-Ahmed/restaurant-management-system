const express = require("express");
const router = express.Router();

const { createCategory, getCategories, getCategory, updateCategory, deleteCategory, } = require("../Controllers/categoryController");

const { authMiddleware, roleAuthorize } = require("../Middleware/authMiddleware");
const { validate } = require("../Middleware/validatorMiddleware");

const { createCategorySchema, updateCategorySchema } = require("../validation/categoryValidation");

router.get("/", authMiddleware, getCategories);
router.get("/:id", authMiddleware, getCategory);

router.post("/", authMiddleware, roleAuthorize(["admin", "manager"]), validate(createCategorySchema), createCategory);


router.put("/:id", authMiddleware, roleAuthorize(["admin", "manager"]), validate(updateCategorySchema), updateCategory);

router.delete("/:id", authMiddleware, roleAuthorize(["admin", "manager"]), deleteCategory);

module.exports = router;