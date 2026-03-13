const User = require("../Models/User");

const VALID_ROLES = ["admin", "manager", "cashier", "kitchen"];

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      success: true,
      message: "Users retrieved.",
      data: { users, count: users.length },
    });
  } catch (err) {
    console.error(err);
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const targetId = req.params.id;

    if (targetId === req.user.id.toString())
      return res
        .status(400)
        .json({ success: false, message: "You cannot change your own role." });

    if (!VALID_ROLES.includes(role))
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${VALID_ROLES.join(", ")}.`,
      });

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
  }
};

const deactivateUser = async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user.id.toString())
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
  }
};

module.exports = { getAllUsers, updateUserRole, deactivateUser };
