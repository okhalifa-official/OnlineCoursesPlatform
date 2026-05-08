const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./database");

const authRouter = require("./Routers/Auth");
const dashboardRouter = require("./Routers/dashboard");
const userRouter = require("./Routers/user");
const adminRouter = require("./Routers/Admin");
const courseRouter = require("./Routers/course");
const reportRouter = require("./Routers/Report");
const lectureRouter = require("./Routers/lecture");
const userSideRouter = require("./Routers/userAuth");

const {
  protect,
  requireAdmin,
} = require("./middleware/authMiddleware");

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.use("/api/auth", authRouter);

app.use("/api/dashboard", protect, requireAdmin, dashboardRouter);
app.use("/api/users", protect, requireAdmin, userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/courses", protect, requireAdmin, courseRouter);
app.use("/api/reports", protect, requireAdmin, reportRouter);
app.use("/api/lectures", protect, requireAdmin, lectureRouter);
app.use("/api/user", userSideRouter);

app.get("/", function (req, res) {
  res.send("Backend is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, function () {
  console.log(`Server running on port ${PORT}`);
});