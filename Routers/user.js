const express = require('express');
const router = express.Router();
const userController = require('../Controllers/user');

router.post("/signup", userController.signup);
router.get("/login", userController.login);
router.get("/getallusers", userController.getAllUsers);
router.get("/getuser/:id", userController.getUserById);

module.exports = router;