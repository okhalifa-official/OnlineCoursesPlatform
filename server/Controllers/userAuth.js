const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/user");

function createToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

const registerUser = async (req, res) => {
  try {
    const {
      fullName, email, password, role,
      phone, gender, dateOfBirth, city,
      specialty, educationalCenter, department, enrollmentType,
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName,
      email,
      password: hashed,
      role: role === "instructor" ? "instructor" : "student",
      status: role === "instructor" ? "pending" : "active",
      phone: phone || "",
      gender: gender || "",
      dateOfBirth: dateOfBirth || "",
      city: city || "",
      specialty: specialty || "",
      educationalCenter: educationalCenter || "",
      department: department || "",
      enrollmentType: enrollmentType || "online",
    });

    const token = createToken(user._id, user.role);

    res.status(201).json({ token, user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, status: user.status } });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user._id, user.role);

    res.json({ token, user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, status: user.status } });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { registerUser, loginUser, getMe };
