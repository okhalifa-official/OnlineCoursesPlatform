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
      passwordHash: hashed,
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

    res.status(201).json({
      token,
      user: {
        _id: user._id, fullName: user.fullName, email: user.email,
        role: user.role, status: user.status,
        profileImage: user.profileImage || "",
        specialty: user.specialty || "",
        jobTitle: user.jobTitle || "",
        notes: user.notes || "",
        gradeLevel: user.gradeLevel || "",
      },
    });
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

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user._id, user.role);

    res.json({
      token,
      user: {
        _id: user._id, fullName: user.fullName, email: user.email,
        role: user.role, status: user.status,
        profileImage: user.profileImage || "",
        specialty: user.specialty || "",
        jobTitle: user.jobTitle || "",
        notes: user.notes || "",
        gradeLevel: user.gradeLevel || "",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

const updateUserProfile = async (req, res) => {
  try {
    const {
      firstName, lastName, phone, specialty, yearsOfPractice,
      hospital, bio, pocusLevel, jobTitle, profileImage,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (specialty !== undefined) updates.specialty = specialty;
    if (yearsOfPractice !== undefined) updates.gradeLevel = String(yearsOfPractice);
    if (hospital !== undefined) updates.educationalCenter = hospital;
    if (bio !== undefined) updates.bio = bio;
    if (pocusLevel !== undefined) updates.notes = pocusLevel;
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (profileImage !== undefined) updates.profileImage = profileImage;

    if (firstName !== undefined || lastName !== undefined) {
      const fn = firstName !== undefined ? firstName : (user.firstName || user.fullName?.split(" ")[0] || "");
      const ln = lastName !== undefined ? lastName : (user.lastName || user.fullName?.split(" ").slice(1).join(" ") || "");
      updates.fullName = `${fn} ${ln}`.trim();
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect." });

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user._id, { passwordHash: hashed });
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to change password.", error: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe, updateUserProfile, changePassword };
