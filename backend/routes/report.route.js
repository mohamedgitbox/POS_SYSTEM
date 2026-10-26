const express = require("express");
const { getDashboard } = require("../controllers/report.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

router.get("/dashboard", authProtect, isAllowed("super_admin", "branch_manager"), getDashboard);

module.exports = router;
