const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(400).json({ msg: "Token Not Found!! Unauthorized" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.is_active)
      return res.status(400).json({
        success: false,
        message: "User not found or account deactivated.",
      });

    req.user = user;
    next();
  } catch (err) {
    res.status(400).json({ success: false, message: "Unauthorized." });
  }
};
const roleAuthorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res
        .status(400)
        .json({ success: false, message: "Access denied." });
    next();
  };
};



module.exports = { authMiddleware, roleAuthorize };
