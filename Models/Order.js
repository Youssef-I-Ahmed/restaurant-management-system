const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0,
    },
    line_total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const lifecycleStepSchema = new mongoose.Schema(
  {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    at: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Order must include at least one item.",
      },
    },
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    cancelled_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lifecycle: {
      pending: { type: lifecycleStepSchema, default: () => ({}) },
      preparing: { type: lifecycleStepSchema, default: () => ({}) },
      ready: { type: lifecycleStepSchema, default: () => ({}) },
      completed: { type: lifecycleStepSchema, default: () => ({}) },
      cancelled: { type: lifecycleStepSchema, default: () => ({}) },
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
