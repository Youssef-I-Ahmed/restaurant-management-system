const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'cashier', 'kitchen'],
      default: 'cashier',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;