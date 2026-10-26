const express = require("express");
const {
  openShift,
  closeShift,
  getShiftSummary,
  getActiveShift,
} = require("../controllers/shift.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

// any authenticated role can open/close/summarize their own shifts
router.post("/open", authProtect, openShift);
router.get("/active", authProtect, getActiveShift);
router.get("/:id/summary", authProtect, getShiftSummary);
router.post(
  "/:id/close",
  authProtect,
  isAllowed("super_admin", "branch_manager", "cashier"),
  closeShift,
);

module.exports = router;
