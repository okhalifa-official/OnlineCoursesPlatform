require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../Models/user");

async function run() {
  await mongoose.connect(process.env.DB);

  const email = String(process.env.ADMIN_EMAIL || "admin@sonoschool.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin12345";
  const username = email.split("@")[0];

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email });

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    existing.adminLevel = "super_admin";
    existing.accessLevel = "Super Admin";
    existing.permissionsLevel = "full";
    existing.status = "active";
    await existing.save();
    console.log("Admin updated:", { email, username: existing.username });
  } else {
    await User.create({
      email,
      username,
      passwordHash,
      fullName: "Super Admin",
      name: "Super Admin",
      role: "admin",
      adminLevel: "super_admin",
      accessLevel: "Super Admin",
      permissionsLevel: "full",
      status: "active",
    });
    console.log("Admin created:", { email, username });
  }

  await mongoose.disconnect();
}

run().catch(function (err) {
  console.error("Seed failed:", err);
  process.exit(1);
});
