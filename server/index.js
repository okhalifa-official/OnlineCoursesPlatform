const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./database");
const User = require("./Models/user");
const announcementRouter = require("./Routers/announcement");
const authRouter = require("./Routers/Auth");
const dashboardRouter = require("./Routers/dashboard");
const userRouter = require("./Routers/user");
const adminRouter = require("./Routers/Admin");
const courseRouter = require("./Routers/course");
const reportRouter = require("./Routers/Report");
const lectureRouter = require("./Routers/lecture");
const userSideRouter = require("./Routers/userAuth");
const educationalCenterRouter = require("./Routers/educationalCenter");
const systemLogRouter = require("./Routers/systemLog");
const paymentRouter = require("./Routers/payment");
const settingRouter = require("./Routers/setting");
const supportRequestRoutes = require("./Routers/supportRequestRoutes");

const auditLogMiddleware = require("./middleware/auditLogMiddleware");

const {
  protect,
  requireAdmin,
} = require("./middleware/authMiddleware");

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.use(auditLogMiddleware);

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/announcements", protect, requireAdmin, announcementRouter);
app.patch(
  "/api/fix-super-admin/me",
  protect,
  requireAdmin,
  async function (req, res) {
    try {
      const authUser = req.user || req.admin || req.auth || {};

      const userId =
        authUser._id ||
        authUser.id ||
        authUser.userId ||
        authUser.adminId;

      const email = authUser.email;
      const username = authUser.username;

      const filter = {};

      if (userId) {
        filter._id = userId;
      } else if (email) {
        filter.email = String(email).toLowerCase();
      } else if (username) {
        filter.username = String(username).toLowerCase();
      } else {
        return res.status(400).json({
          message: "Cannot identify logged in admin",
          authUser,
        });
      }

      const updatedUser = await User.findOneAndUpdate(
        filter,
        {
          $set: {
            role: "admin",
            adminLevel: "super_admin",
            accessLevel: "Super Admin",
            permissionsLevel: "full",
          },
        },
        {
          new: true,
        }
      ).select(
        "fullName name email username role adminLevel accessLevel permissionsLevel"
      );

      if (!updatedUser) {
        return res.status(404).json({
          message: "Logged in admin not found",
        });
      }

      return res.status(200).json({
        message: "Current admin is now super admin",
        user: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to fix super admin",
        error: error.message,
      });
    }
  }
);

app.use("/api/dashboard", protect, requireAdmin, dashboardRouter);
app.use("/api/users", protect, requireAdmin, userRouter);

app.use(
  "/api/educational-centers",
  protect,
  requireAdmin,
  educationalCenterRouter
);

app.use("/api/courses", protect, requireAdmin, courseRouter);
app.use("/api/payments", protect, requireAdmin, paymentRouter);
app.use("/api/settings", protect, requireAdmin, settingRouter);
app.use("/api/reports", protect, requireAdmin, reportRouter);
app.use("/api/lectures", protect, requireAdmin, lectureRouter);
app.use("/api/system-logs", protect, requireAdmin, systemLogRouter);
app.use("/api/support-requests", protect, requireAdmin, supportRequestRoutes);

app.use("/api/user", userSideRouter);

app.get("/", function (req, res) {
  res.send("Backend is running");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, function () {
  console.log(`Server running on port ${PORT}`);
});