const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../Models/Admin");

function createToken(adminId) {
  return jwt.sign(
    {
      adminId,
      role: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

async function createDefaultAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await Admin.create({
    firstName: "Admin",
    lastName: "User",
    email,
    username: "admin_user",
    jobTitle: "System Administrator",
    accessLevel: "Super Admin",
    accountStatus: "Active",
    passwordHash,
  });

  return admin;
}

const loginAdmin = async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    let admin = await Admin.findOne({ email }).select("+passwordHash");

    const adminsCount = await Admin.countDocuments();

    if (!admin && adminsCount === 0) {
      if (
        email !== process.env.ADMIN_EMAIL ||
        password !== process.env.ADMIN_PASSWORD
      ) {
        return res.status(401).json({
          message: "Invalid admin credentials",
        });
      }

      admin = await createDefaultAdmin();
      admin = await Admin.findById(admin._id).select("+passwordHash");
    }

    if (!admin) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    if (!admin.passwordHash) {
      return res.status(401).json({
        message: "Admin password is not configured. Delete old admin from DB and login again.",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    admin.lastLogin = new Date().toLocaleString("en-US");
    await admin.save();

    const token = createToken(admin._id);
    const safeAdmin = await Admin.findById(admin._id);

    res.json({
      token,
      admin: safeAdmin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

const getLoggedInAdmin = async function (req, res) {
  res.json(req.admin);
};

module.exports = {
  loginAdmin,
  getLoggedInAdmin,
};