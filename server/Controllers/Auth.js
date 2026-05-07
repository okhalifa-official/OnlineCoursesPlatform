const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/user");

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      adminLevel: user.adminLevel,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
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

    const user = await User.findOne({
      $or: [
        { username: String(loginValue).toLowerCase().trim() },
        { email: String(loginValue).toLowerCase().trim() },
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

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: new Date().toLocaleString("en-US"),
        },
      },
      {
        runValidators: false,
      },
    );

    const token = createToken(user);
    const safeUser = await User.findById(user._id);

    res.json({
      token,
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Admin login failed",
      error: error.message,
    });
  }
};

const getMe = async function (req, res) {
  res.json(req.user);
};

module.exports = {
  loginAdmin,
  getMe,
};
