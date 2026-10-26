const express = require("express");
const {
  createSale,
  createReturn,
  getSales,
  getSaleById,
  getSalesSummary,
} = require("../controllers/sale.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

// reports: managers and above
router.get(
  "/summary",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  getSalesSummary,
);
router.get("/", authProtect, getSales);
router.get("/:id", authProtect, getSaleById);

// selling: any authenticated role (cashiers included)
router.post("/", authProtect, createSale);

// returns/refunds: cashiers can process returns, managers can too
router.post(
  "/:id/return",
  authProtect,
  isAllowed("super_admin", "branch_manager", "cashier"),
  createReturn,
);

module.exports = router;
