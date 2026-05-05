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
} = require("../Controllers/User");

// Special routes لازم تيجي قبل /:id
router.get("/pending-instructors", getPendingInstructors);
router.patch("/:id/approve-instructor", approveInstructor);
router.patch("/:id/reject-instructor", rejectInstructor);

// CRUD routes
router.get("/", getUsers);
router.post("/", createUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;