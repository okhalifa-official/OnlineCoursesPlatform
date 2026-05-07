const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/user");

function createToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      userId: user._id.toString(),
      role: user.role,
      adminLevel: user.adminLevel,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

const loginAdmin = async function (req, res) {
  try {
    const { username, email, password } = req.body;

    const loginValue = username || email;

    if (!loginValue || !password) {
      return res.status(400).json({
        message: "Username/email and password are required",
      });
    }

    const normalizedLogin = String(loginValue).toLowerCase().trim();

    const user = await User.findOne({
      $or: [
        { username: normalizedLogin },
        { email: normalizedLogin },
      ],
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "This login is for admins only",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Admin account is not active",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    await User.findByIdAndUpdate(
      user._id,
      {
        lastLogin: new Date(),
      },
      {
        runValidators: false,
      }
    );

    const token = createToken(user);

    const safeUser = await User.findById(user._id).select("-passwordHash");

    console.log("ADMIN LOGIN SUCCESS:", {
      id: safeUser._id.toString(),
      username: safeUser.username,
      email: safeUser.email,
      role: safeUser.role,
      adminLevel: safeUser.adminLevel,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Admin login failed",
      error: error.message,
    });
  }
};

const getMe = async function (req, res) {
  try {
    const currentUserId = req.user?._id || req.user?.id || req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const user = await User.findById(currentUserId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get current user",
      error: error.message,
    });
  }
};

module.exports = {
  loginAdmin,
  getMe,
};