const { login, Hello, register } = require("../controllers/user.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");
const express = require("express");
const router = express.Router();

router.get(
  "/Hello",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  Hello,
);

router.post("/login", login);

router.post("/register", register);

module.exports = router;
