const mongoose = require("mongoose");
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const { Inventory } = require("../Models/Inventory");

const buildRequestedQuantities = (items) => {
  const quantityMap = new Map();

  for (const item of items) {
    const key = String(item.product);
    const existingQty = quantityMap.get(key) || 0;
    quantityMap.set(key, existingQty + item.quantity);
  }

  return quantityMap;
};

const getDayRange = (inputDate = new Date()) => {
  const start = new Date(inputDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(inputDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

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

const applyOrderPopulates = (query) =>
  query
    .populate("cashier", "name email role")
    .populate("items.product", "name price is_available")
    .populate("cancelled_by", "name email role")
    .populate("lifecycle.pending.by", "name email role")
    .populate("lifecycle.preparing.by", "name email role")
    .populate("lifecycle.ready.by", "name email role")
    .populate("lifecycle.completed.by", "name email role")
    .populate("lifecycle.cancelled.by", "name email role");

const listOrders = async (req, res) => {
  try {
    const {
      scope,
      orderId,
      cashier,
      status,
      minTotal,
      maxTotal,
      dateFrom,
      dateTo,
    } = req.query;
    const filter = {};
    const isAdminOrManager = ["admin", "manager"].includes(req.user.role);

    if (orderId) {
      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID filter.",
        });
      }

      filter._id = orderId;
    }

    if (isAdminOrManager && cashier) {
      filter.cashier = cashier;
    }

    if (req.user.role === "cashier") {
      const { start, end } = getDayRange();
      filter.createdAt = { $gte: start, $lte: end };
    } else if (req.user.role === "kitchen") {
      filter.status = { $in: ["pending", "preparing", "ready"] };
    }

    if (scope === "today" && isAdminOrManager) {
      const { start, end } = getDayRange();
      filter.createdAt = { $gte: start, $lte: end };
    }

    if ((dateFrom || dateTo) && isAdminOrManager) {
      filter.createdAt = {};

      if (dateFrom) {
        const start = new Date(dateFrom);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date filter.",
          });
        }

        filter.createdAt.$gte = start;
      }

      if (dateTo) {
        const end = new Date(dateTo);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date filter.",
          });
        }

        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (status) {
      const normalizedStatus = String(status).toLowerCase();

      if (req.user.role === "kitchen") {
        if (!["pending", "preparing", "ready"].includes(normalizedStatus)) {
          return res.status(403).json({
            success: false,
            message: "Kitchen can only view active workflow orders.",
          });
        }
      }

      filter.status = normalizedStatus;
    }

    if (minTotal || maxTotal) {
      filter.total_amount = {};

      if (minTotal) {
        filter.total_amount.$gte = Number(minTotal);
      }

      if (maxTotal) {
        filter.total_amount.$lte = Number(maxTotal);
      }
    }

    const orders = await applyOrderPopulates(Order.find(filter).sort({ createdAt: -1 }));

    res.status(200).json({
      success: true,
      data: { orders, count: orders.length },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await applyOrderPopulates(Order.findById(req.params.id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (req.user.role === "cashier") {
      const { start, end } = getDayRange();
      const isToday = order.createdAt >= start && order.createdAt <= end;

      if (!isToday) {
        return res.status(403).json({
          success: false,
          message: "Cashier can only view today's orders.",
        });
      }
    }

    if (
      req.user.role === "kitchen" &&
      !["pending", "preparing", "ready"].includes(order.status)
    ) {
      return res.status(403).json({
        success: false,
        message: "Kitchen can only view active workflow orders.",
      });
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { items } = req.body;
    const quantityMap = buildRequestedQuantities(items);

    session.startTransaction();

    const productIds = [...quantityMap.keys()];
    const products = await Product.find({
      _id: { $in: productIds },
      is_deleted: false,
    }).session(session);

    if (products.length !== productIds.length) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "One or more products are invalid.",
      });
    }

    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const inventories = await Inventory.find({
      product: { $in: productIds },
    }).session(session);
    const inventoryMap = new Map(inventories.map((inv) => [String(inv.product), inv]));

    const orderItems = [];
    let totalAmount = 0;

    for (const [productId, requestedQty] of quantityMap.entries()) {
      const product = productMap.get(productId);
      if (!product || !product.is_available) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Product ${product ? product.name : productId} is unavailable.`,
        });
      }

      const inventory = inventoryMap.get(productId);
      if (!inventory || inventory.quantity < requestedQty) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}.`,
        });
      }

      inventory.quantity -= requestedQty;
      inventory.updated_by = req.user._id;
      await inventory.save({ session });

      const lineTotal = product.price * requestedQty;
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: requestedQty,
        unit_price: product.price,
        line_total: lineTotal,
      });
      totalAmount += lineTotal;
    }

    const [order] = await Order.create(
      [
        {
          cashier: req.user._id,
          items: orderItems,
          total_amount: totalAmount,
          status: "pending",
          lifecycle: {
            pending: {
              by: req.user._id,
              at: new Date(),
            },
          },
        },
      ],
      { session }
    );

    if (orderItems.length > 0) {
      for (const item of orderItems) {
        const inventory = inventoryMap.get(String(item.product));
        const qtyAfter = inventory.quantity;
        const qtyBefore = qtyAfter + item.quantity;

        appendInventoryLog(inventory, {
          type: "deduction",
          quantity_change: -item.quantity,
          quantity_before: qtyBefore,
          quantity_after: qtyAfter,
          reason: "Order created",
          order: order._id,
          performed_by: req.user._id,
        });

        await inventory.save({ session });
      }
    }

    await session.commitTransaction();

    const orderWithDetails = await applyOrderPopulates(Order.findById(order._id));

    res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: { order: orderWithDetails },
    });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    session.endSession();
  }
};

const updateOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { items } = req.body;

    session.startTransaction();

    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const isAdmin = req.user.role === "admin";

    if (!isAdmin && String(order.cashier) !== String(req.user._id)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "You can only modify your own orders.",
      });
    }

    if (order.status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Order cannot be edited after preparation starts.",
      });
    }

    const currentQuantities = buildRequestedQuantities(order.items);
    const currentProductIds = [...currentQuantities.keys()];

    if (currentProductIds.length > 0) {
      const currentInventories = await Inventory.find({
        product: { $in: currentProductIds },
      }).session(session);

      for (const inventory of currentInventories) {
        const restoredQty = currentQuantities.get(String(inventory.product)) || 0;
        const before = inventory.quantity;
        inventory.quantity += restoredQty;
        inventory.updated_by = req.user._id;

        appendInventoryLog(inventory, {
          type: "return",
          quantity_change: restoredQty,
          quantity_before: before,
          quantity_after: inventory.quantity,
          reason: "Order updated - restore previous items",
          order: order._id,
          performed_by: req.user._id,
        });

        await inventory.save({ session });
      }
    }

    const requestedQuantities = buildRequestedQuantities(items);
    const productIds = [...requestedQuantities.keys()];

    const products = await Product.find({
      _id: { $in: productIds },
      is_deleted: false,
    }).session(session);

    if (products.length !== productIds.length) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "One or more products are invalid.",
      });
    }

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const inventories = await Inventory.find({ product: { $in: productIds } }).session(session);
    const inventoryMap = new Map(inventories.map((inv) => [String(inv.product), inv]));

    const orderItems = [];
    let totalAmount = 0;

    for (const [productId, requestedQty] of requestedQuantities.entries()) {
      const product = productMap.get(productId);
      if (!product || !product.is_available) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Product ${product ? product.name : productId} is unavailable.`,
        });
      }

      const inventory = inventoryMap.get(productId);
      if (!inventory || inventory.quantity < requestedQty) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}.`,
        });
      }

      const before = inventory.quantity;
      inventory.quantity -= requestedQty;
      inventory.updated_by = req.user._id;

      appendInventoryLog(inventory, {
        type: "deduction",
        quantity_change: -requestedQty,
        quantity_before: before,
        quantity_after: inventory.quantity,
        reason: "Order updated",
        order: order._id,
        performed_by: req.user._id,
      });

      await inventory.save({ session });

      const lineTotal = product.price * requestedQty;
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: requestedQty,
        unit_price: product.price,
        line_total: lineTotal,
      });
      totalAmount += lineTotal;
    }

    order.items = orderItems;
    order.total_amount = totalAmount;
    await order.save({ session });

    await session.commitTransaction();

    const updatedOrder = await Order.findById(order._id)
      .populate("cashier", "name email role")
      .populate("items.product", "name price is_available");

    res.status(200).json({
      success: true,
      message: "Order updated successfully.",
      data: { order: updatedOrder },
    });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    session.endSession();
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const nextStatus = String(status || "").toLowerCase();

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const currentStatus = order.status;
    const userRole = req.user.role;
    const lifecycleEntry = {
      by: req.user._id,
      at: new Date(),
    };

    if (userRole === "kitchen") {
      if (currentStatus === "pending" && nextStatus === "preparing") {
        order.status = "preparing";
        order.lifecycle.preparing = lifecycleEntry;
      } else if (currentStatus === "preparing" && nextStatus === "ready") {
        order.status = "ready";
        order.lifecycle.ready = lifecycleEntry;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid status transition for kitchen role.",
        });
      }
    } else if (userRole === "admin") {
      const allowedTransitions = {
        pending: ["preparing"],
        preparing: ["ready"],
        ready: ["completed"],
      };

      if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status transition.",
        });
      }

      order.status = nextStatus;
      order.lifecycle[nextStatus] = lifecycleEntry;
    } else if (userRole === "cashier") {
      if (currentStatus === "ready" && nextStatus === "completed") {
        order.status = "completed";
        order.lifecycle.completed = lifecycleEntry;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid status transition for cashier role.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    await order.save();

    const populatedOrder = await applyOrderPopulates(Order.findById(order._id));

    res.status(200).json({
      success: true,
      message: "Order status updated.",
      data: { order: populatedOrder },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager";
    const isOwnerCashier =
      req.user.role === "cashier" && String(order.cashier) === String(req.user._id);

    if (!isAdmin && !isManager && !isOwnerCashier) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this order.",
      });
    }

    if (order.status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled.",
      });
    }

    const quantities = buildRequestedQuantities(order.items);
    const productIds = [...quantities.keys()];

    const inventories = await Inventory.find({
      product: { $in: productIds },
    }).session(session);

    const inventoryMap = new Map(inventories.map((inv) => [String(inv.product), inv]));

    for (const [productId, quantity] of quantities.entries()) {
      const inventory = inventoryMap.get(productId);
      if (!inventory) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Inventory data missing for one or more products.",
        });
      }

      const before = inventory.quantity;
      inventory.quantity += quantity;
      inventory.updated_by = req.user._id;

      appendInventoryLog(inventory, {
        type: "return",
        quantity_change: quantity,
        quantity_before: before,
        quantity_after: inventory.quantity,
        reason: "Order cancelled",
        order: order._id,
        performed_by: req.user._id,
      });

      await inventory.save({ session });
    }

    order.status = "cancelled";
    order.cancelled_by = req.user._id;
    order.lifecycle.cancelled = {
      by: req.user._id,
      at: new Date(),
    };
    await order.save({ session });

    await session.commitTransaction();

    const populatedOrder = await applyOrderPopulates(Order.findById(order._id));

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: { order: populatedOrder },
    });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    session.endSession();
  }
};

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
};
