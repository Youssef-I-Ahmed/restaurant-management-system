const mongoose = require("mongoose");

const INVENTORY_LOG_TYPES = ["deduction", "restock", "adjustment", "return"];

const inventoryLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: INVENTORY_LOG_TYPES,
      required: true,
    },
    quantity_change: {
      type: Number,
      required: true,
    },
    quantity_before: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity_after: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      default: "",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    low_stock_threshold: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    logs: {
      type: [inventoryLogSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = {
  Inventory,
  INVENTORY_LOG_TYPES,
};
