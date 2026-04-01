const Product = require('../Models/Product')
const Category = require("../Models/Category");
const Order = require("../Models/Order");
const { Inventory } = require("../Models/Inventory");

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const parseAvailabilityFilter = (value) => {
    if (value === undefined) return undefined;

    if (["true", "1", "in-stock", "available"].includes(String(value).toLowerCase())) {
        return true;
    }

    if (["false", "0", "out-of-stock", "unavailable"].includes(String(value).toLowerCase())) {
        return false;
    }

    return undefined;
};

const ensureInventoryRecord = (productId, userId) =>
    Inventory.findOneAndUpdate(
        { product: productId },
        {
            $setOnInsert: {
                product: productId,
                quantity: 0,
                low_stock_threshold: DEFAULT_LOW_STOCK_THRESHOLD,
                updated_by: userId || null,
            },
        },
        { upsert: true, new: true }
    );

const buildInventorySnapshot = (product, inventory) => {
    const quantity = Number(inventory?.quantity ?? 0);
    const lowStockThreshold = Number(
        inventory?.low_stock_threshold ?? DEFAULT_LOW_STOCK_THRESHOLD
    );

    const canOrder = product.is_available && quantity > 0;

    let stockStatus = "out_of_stock";
    if (!product.is_available) {
        stockStatus = "disabled";
    } else if (quantity > 0) {
        stockStatus = quantity <= lowStockThreshold ? "low_stock" : "available";
    }

    return {
        inventory: {
            quantity,
            low_stock_threshold: lowStockThreshold,
        },
        can_order: canOrder,
        stock_status: stockStatus,
    };
};

// Create a new product

const createProduct = async (req, res) => {
    try {
        const { name, category, price, cost, description, is_available } = req.body;

        //  check category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists)
            return res.status(400).json({
                success: false,
                message: "Invalid category.",
            });

        //  check duplicate name
        const existing = await Product.findOne({ name });
        if (existing)
            return res.status(400).json({
                success: false,
                message: "Product already exists.",
            });

        const product = await Product.create({
            name,
            category,
            price,
            cost,
            description,
            is_available: is_available !== undefined ? is_available : true,
        });

        await ensureInventoryRecord(product._id, req.user?._id);

        res.status(201).json({
            success: true,
            message: "Product created.",
            data: { product },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Get all products or filter by category
const getProducts = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, availability, includeDeleted } = req.query;

        let filter = {};

        if (!["true", "1"].includes(String(includeDeleted).toLowerCase())) {
            filter.is_deleted = false;
        }

        if (category) filter.category = category;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        const availabilityValue = parseAvailabilityFilter(availability);
        if (availabilityValue !== undefined) {
            filter.is_available = availabilityValue;
        }

        const products = await Product.find(filter).populate("category").lean();
        const productIds = products.map((product) => product._id);
        const inventories = productIds.length
            ? await Inventory.find({ product: { $in: productIds } }).lean()
            : [];
        const inventoryMap = new Map(
            inventories.map((inventory) => [String(inventory.product), inventory])
        );

        const enrichedProducts = products.map((product) => ({
            ...product,
            ...buildInventorySnapshot(
                product,
                inventoryMap.get(String(product._id))
            ),
        }));

        res.status(200).json({
            success: true,
            data: { products: enrichedProducts, count: enrichedProducts.length },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
// Get a single product by ID
const getProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            is_deleted: false,
        })
            .populate("category")
            .lean();

        if (!product)
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });

        const inventory = await Inventory.findOne({ product: product._id }).lean();

        res.status(200).json({
            success: true,
            data: {
                product: {
                    ...product,
                    ...buildInventorySnapshot(product, inventory),
                },
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
// Update a product by ID
const updateProduct = async (req, res) => {
    try {
        const { category, price, cost } = req.body;

        // لو بيغير category
        if (category) {
            const exists = await Category.findById(category);
            if (!exists)
                return res.status(400).json({
                    success: false,
                    message: "Invalid category.",
                });
        }

        const updateData = { ...req.body };

        if (price !== undefined || cost !== undefined) {
            const existingProduct = await Product.findOne({
                _id: req.params.id,
                is_deleted: false,
            });

            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found.",
                });
            }

            const nextPrice = price !== undefined ? price : existingProduct.price;
            const nextCost = cost !== undefined ? cost : existingProduct.cost;
            updateData.profit_margin = nextPrice - nextCost;
        }

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, is_deleted: false },
            updateData,
            { new: true }
        );

        if (!product)
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });

        res.status(200).json({
            success: true,
            message: "Product updated.",
            data: { product },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
// Delete a product by ID
const deleteProduct = async (req, res) => {
    try {
        const hasLinkedOrders = await Order.exists({ "items.product": req.params.id });

        if (hasLinkedOrders) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete product linked to orders.",
            });
        }

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, is_deleted: false },
            { is_deleted: true, is_available: false },
            { new: true }
        );

        if (!product)
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });

        res.status(200).json({
            success: true,
            message: "Product soft-deleted.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            is_deleted: false,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        product.is_available = !product.is_available;
        await product.save();

        res.status(200).json({
            success: true,
            message: "Product availability updated.",
            data: { product },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct, toggleProductStatus };
