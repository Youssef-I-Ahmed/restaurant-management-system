const { Inventory } = require("../Models/Inventory");
const Product = require("../Models/Product");

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const appendInventoryLog = (inventory, payload) => {
  inventory.logs.push({
    type: payload.type,
    quantity_change: payload.quantity_change,
    quantity_before: payload.quantity_before,
    quantity_after: payload.quantity_after,
    reason: payload.reason || "",
    order: payload.order || null,
    performed_by: payload.performed_by,
  });
};

const buildInventoryRow = (product, inventory) => {
  const quantity = Number(inventory?.quantity ?? 0);
  const lowStockThreshold = Number(
    inventory?.low_stock_threshold ?? DEFAULT_LOW_STOCK_THRESHOLD
  );

  let stockStatus = "out_of_stock";
  if (quantity > 0) {
    stockStatus = quantity <= lowStockThreshold ? "low_stock" : "in_stock";
  }

  return {
    _id: inventory?._id || `virtual-${product._id}`,
    product,
    quantity,
    low_stock_threshold: lowStockThreshold,
    updated_by: inventory?.updated_by || null,
    updatedAt: inventory?.updatedAt || product.createdAt,
    stock_status: stockStatus,
  };
};

const loadInventoryRows = async () => {
  const products = await Product.find({ is_deleted: false })
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .lean();

  const productIds = products.map((product) => product._id);
  const inventories = productIds.length
    ? await Inventory.find({ product: { $in: productIds } })
      .populate("updated_by", "name email role")
      .lean()
    : [];

  const inventoryMap = new Map(
    inventories.map((inventory) => [String(inventory.product), inventory])
  );

  return products.map((product) =>
    buildInventoryRow(product, inventoryMap.get(String(product._id)))
  );
};

const listInventory = async (req, res) => {
  try {
    const inventoryRows = await loadInventoryRows();

    res.status(200).json({
      success: true,
      data: { inventory: inventoryRows, count: inventoryRows.length },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getInventoryByProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      is_deleted: false,
    })
      .populate("category", "name")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const inventory = await Inventory.findOne({ product: req.params.productId })
      .populate("updated_by", "name email role");
    const inventoryRow = buildInventoryRow(product, inventory?.toObject?.() || inventory);

    res.status(200).json({
      success: true,
      data: { inventory: inventoryRow },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateInventoryQuantity = async (req, res) => {
  try {
    const { quantity, low_stock_threshold } = req.body;

    const product = await Product.findOne({
      _id: req.params.productId,
      is_deleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    let inventory = await Inventory.findOne({ product: req.params.productId });

    if (!inventory) {
      inventory = await Inventory.create({
        product: req.params.productId,
        quantity: 0,
        low_stock_threshold: DEFAULT_LOW_STOCK_THRESHOLD,
        updated_by: req.user._id,
      });
    }

    const before = inventory.quantity;
    inventory.quantity = quantity;

    if (low_stock_threshold !== undefined) {
      inventory.low_stock_threshold = low_stock_threshold;
    }

    inventory.updated_by = req.user._id;

    appendInventoryLog(inventory, {
      type: "adjustment",
      quantity_change: quantity - before,
      quantity_before: before,
      quantity_after: inventory.quantity,
      reason: "Manual quantity update",
      performed_by: req.user._id,
    });

    await inventory.save();

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully.",
      data: { inventory },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const restockInventory = async (req, res) => {
  try {
    const productId = req.body.product || req.body.productId;
    const { quantity, reason } = req.body;

    const productExists = await Product.findOne({
      _id: productId,
      is_deleted: false,
    });
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    let inventory = await Inventory.findOne({ product: productId });
    if (!inventory) {
      inventory = await Inventory.create({
        product: productId,
        quantity: 0,
        low_stock_threshold: DEFAULT_LOW_STOCK_THRESHOLD,
        updated_by: req.user._id,
      });
    }

    const before = inventory.quantity;
    inventory.quantity += quantity;
    inventory.updated_by = req.user._id;

    appendInventoryLog(inventory, {
      type: "restock",
      quantity_change: quantity,
      quantity_before: before,
      quantity_after: inventory.quantity,
      reason: reason || "Stock restocked",
      performed_by: req.user._id,
    });

    await inventory.save();

    res.status(200).json({
      success: true,
      message: "Inventory restocked successfully.",
      data: { inventory },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const listLowStock = async (req, res) => {
  try {
    const lowStockItems = (await loadInventoryRows()).filter(
      (item) => item.stock_status !== "in_stock"
    );

    res.status(200).json({
      success: true,
      data: { inventory: lowStockItems, count: lowStockItems.length },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const listInventoryLogs = async (req, res) => {
  try {
    const { product, type, dateFrom, dateTo } = req.query;
    const inventoryFilter = {};
    let startDate = null;
    let endDate = null;

    if (product) {
      inventoryFilter.product = product;
    }

    if (dateFrom) {
      const start = new Date(dateFrom);
      if (Number.isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date.",
        });
      }

      startDate = start;
    }

    if (dateTo) {
      const end = new Date(dateTo);
      if (Number.isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date.",
        });
      }

      end.setHours(23, 59, 59, 999);
      endDate = end;
    }

    const inventories = await Inventory.find(inventoryFilter)
      .populate("product", "name")
      .populate("logs.performed_by", "name email role")
      .populate("logs.order", "status total_amount");

    const logs = inventories
      .flatMap((inventory) =>
        inventory.logs.map((log) => ({
          ...log.toObject(),
          product: inventory.product,
        }))
      )
      .filter((log) => {
        if (type && log.type !== type) {
          return false;
        }

        if (startDate && new Date(log.createdAt) < startDate) {
          return false;
        }

        if (endDate && new Date(log.createdAt) > endDate) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: { logs, count: logs.length },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  listInventory,
  getInventoryByProduct,
  updateInventoryQuantity,
  restockInventory,
  listLowStock,
  listInventoryLogs,
};
