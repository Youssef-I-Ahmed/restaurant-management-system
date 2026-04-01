const User = require("../Models/User");
const bcrypt = require("bcrypt");


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      message: "Users retrieved.",
      data: { users, count: users.length },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, role, is_active, phone, password } = req.body;
    const targetId = req.params.id;
    const isSelf = targetId === req.user._id.toString();

    if (isSelf && (role !== undefined || is_active !== undefined))
      return res.status(400).json({
        success: false,
        message: "You cannot modify your own role or status",
      });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (password !== undefined) {
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }

    if (!isSelf) {
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;
    }

    const user = await User.findByIdAndUpdate(targetId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    res.status(200).json({
      success: true,
      message: "User updated.",
      data: { user },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const targetId = req.params.id;

    if (targetId === req.user._id.toString())
      return res
        .status(400)
        .json({ success: false, message: "You cannot change your own role." });

  
    const user = await User.findByIdAndUpdate(
      targetId,
      { role },
      { new: true },
    );

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    res
      .status(200)
      .json({ success: true, message: "User role updated.", data: { user } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user._id.toString())
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });

    const user = await User.findByIdAndUpdate(
      targetId,
      { is_active: false },
      { new: true },
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    res.status(200).json({
      success: true,
      message: "User account deactivated.",
      data: { user },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deactivateUser,
};
