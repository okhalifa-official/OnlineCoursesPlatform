const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./database");

const authRouter = require("./Routers/Auth");
const dashboardRouter = require("./Routers/dashboard");
const userRouter = require("./Routers/User");
const adminRouter = require("./Routers/Admin");
const courseRouter = require("./Routers/Course");
const reportRouter = require("./Routers/Report");

const { protectAdmin } = require("./middleware/authMiddleware");

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.use("/api/auth", authRouter);

app.use("/api/dashboard", protectAdmin, dashboardRouter);
app.use("/api/users", protectAdmin, userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/courses", protectAdmin, courseRouter);
app.use("/api/reports", protectAdmin, reportRouter);

app.get("/", function (req, res) {
  res.send("Backend is running");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, function () {
  console.log(`Server running on port ${PORT}`);
});