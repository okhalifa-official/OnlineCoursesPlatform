const jwt = require("jsonwebtoken");
const Admin = require("../Models/Admin");

const protectAdmin = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. Admin token required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      return res.status(401).json({
        message: "Invalid admin token.",
      });
    }

    if (admin.accountStatus !== "Active") {
      return res.status(403).json({
        message: "Admin account is not active.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token.",
      error: error.message,
    });
  }
};

module.exports = {
  protectAdmin,
};