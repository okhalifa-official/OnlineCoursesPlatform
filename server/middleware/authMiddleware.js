const jwt = require("jsonwebtoken");
const User = require("../Models/user");

const protect = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. Token required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUserId = decoded.userId || decoded.id;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Invalid token payload.",
      });
    }

    const user = await User.findById(currentUserId).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Invalid token.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Account is not active.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
      error: error.message,
    });
  }
};

const requireAdmin = function (req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access only.",
    });
  }

  next();
};

const requireSuperAdmin = function (req, res, next) {
  if (
    !req.user ||
    req.user.role !== "admin" ||
    req.user.adminLevel !== "super_admin"
  ) {
    return res.status(403).json({
      message: "Super admin access only.",
    });
  }

  next();
};

module.exports = {
  protect,
  requireAdmin,
  requireSuperAdmin,
};