const Category = require('../Models/Category');
const Product = require("../Models/Product");

// createCategory
// if user Not authorized return 403
const createCategory = async (req, res) => {
    try {
        const { name, parent } = req.body;

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category name already exists',
            });
        }

        if (parent) {
            const parentExists = await Category.findById(parent);
            if (!parentExists) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid parent category.",
                });
            }
        }

        const category = await Category.create({ name, parent: parent || null });

        res.status(201).json({
            success: true,
            message: "Category created successfully.",
            data: { category },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// getCategories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().lean();
        const products = await Product.find({}, 'category').lean();
        const map = {};
        const tree = [];
        const countMap = {};

        products.forEach((product) => {
            const categoryId = product.category.toString();
            countMap[categoryId] = (countMap[categoryId] || 0) + 1;
        });

        categories.forEach((category) => {
            const categoryId = category._id.toString();
            map[categoryId] = {
                ...category,
                count: countMap[categoryId] || 0,
                children: [],
            };
        });

        categories.forEach((category) => {
            const current = map[category._id.toString()];
            const parentId = category.parent ? category.parent.toString() : null;

            if (parentId && map[parentId]) {
                map[parentId].children.push(current);
                return;
            }

            tree.push(current);
        });

        res.status(200).json({
            success: true,
            data: { categories: tree, count: categories.length },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
// getCategory
const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('parent');

        if (!category)
            return res.status(404).json({
                success: false,
                message: "Category not found.",
            });

        res.status(200).json({
            success: true,
            data: { category },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
// updateCategory
const updateCategory = async (req, res) => {
    try {
        const { name, parent } = req.body;

        if (parent && parent === req.params.id) {
            return res.status(400).json({
                success: false,
                message: "Category cannot be its own parent.",
            });
        }

        if (parent) {
            const parentExists = await Category.findById(parent);
            if (!parentExists) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid parent category.",
                });
            }
        }

        if (name) {
            const existingCategory = await Category.findOne({
                name,
                _id: { $ne: req.params.id },
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Category name already exists",
                });
            }
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (parent !== undefined) updateData.parent = parent || null;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!category)
            return res.status(404).json({
                success: false,
                message: "Category not found.",
            });

        res.status(200).json({
            success: true,
            message: "Category updated.",
            data: { category },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
// deleteCategory

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        const hasChildren = await Category.findOne({ parent: categoryId });

        if (hasChildren)
            return res.status(400).json({
                success: false,
                message: "Cannot delete category with subcategories.",
            });

        const hasProducts = await Product.findOne({ category: categoryId });

        if (hasProducts)
            return res.status(400).json({
                success: false,
                message: "Cannot delete category with products.",
            });

        const category = await Category.findByIdAndDelete(categoryId);

        if (!category)
            return res.status(404).json({
                success: false,
                message: "Category not found.",
            });

        res.status(200).json({
            success: true,
            message: "Category deleted.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {createCategory, getCategories, getCategory, updateCategory, deleteCategory};
