const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPendingInstructors,
  approveInstructor,
  rejectInstructor,
} = require("../Controllers/user");
const {
  getStudentPermissions,
  updateStudentPermissions,
} = require("../Controllers/studentPermissions");
const {
  getAdminPermissions,
  updateAdminPermissions,
} = require("../Controllers/adminPermissions");
router.get("/pending-instructors", getPendingInstructors);
router.patch("/:id/approve-instructor", approveInstructor);
router.patch("/:id/reject-instructor", rejectInstructor);
router.get("/:id/permissions", getStudentPermissions);
router.patch("/:id/permissions", updateStudentPermissions);
router.get("/:id/admin-permissions", getAdminPermissions);
router.patch("/:id/admin-permissions", updateAdminPermissions);
// CRUD routes
router.get("/", getUsers);
router.post("/", createUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;