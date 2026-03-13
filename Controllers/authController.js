const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const bcrypt = require("bcrypt");

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET);

const register = async (req, res) => {
  try {
    //get  data
    const { name, email, password, role } = req.body;
    // validation
    if (!name || !email || !password)
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });

    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Email is already registered." });

    // Create New User
    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashPassword,
      role,
    });
    // Response

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user },
    });
  } catch (err) {
    console.error(err);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validated Data

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.is_active)
      return res
        .status(400)
        .json({ success: false, message: "Invalid email." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid password." });

    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token: generateToken(user.id),
      data: { user },
    });
  } catch (err) {
    console.error(err);
  }
};

const getMe = (req, res) => {
  res.status(200).json({
    success: true,
    message: "User data retrieved.",
    data: { user: req.user },
  });
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Email is already in use." });

    let updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: { user },
    });
  } catch (err) {
    console.error(err);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({
        success: false,
        message: "Both currentPassword and newPassword are required.",
      });

    if (newPassword.length < 6)
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });

    if (currentPassword === newPassword)
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });

    const user = await User.findById(req.user.id).select("password");
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error(err);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
