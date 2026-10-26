const express = require("express");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

// read endpoints: super_admin or branch_manager
router.get("/", authProtect, isAllowed("super_admin", "branch_manager"), getAllUsers);
router.get("/:id", authProtect, getUserById);

// write endpoints: super_admin only
router.put("/:id", authProtect, isAllowed("super_admin"), updateUser);
router.delete("/:id", authProtect, isAllowed("super_admin"), deleteUser);

module.exports = router;
