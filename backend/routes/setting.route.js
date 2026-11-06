const express = require("express");
const {
  getGeneralSettings,
  updateGeneralSettings,
} = require("../controllers/setting.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

// read: any authenticated role (settings drive shared UI like POS tax)
router.get("/general", authProtect, getGeneralSettings);

// write: super_admin only
router.put("/general", authProtect, isAllowed("super_admin"), updateGeneralSettings);

module.exports = router;
