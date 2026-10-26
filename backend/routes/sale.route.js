const express = require("express");
const {
  createSale,
  getSales,
  getSaleById,
  getSalesSummary,
} = require("../controllers/sale.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

// reports: managers and above
router.get("/summary", authProtect, isAllowed("super_admin", "branch_manager"), getSalesSummary);
router.get("/", authProtect, getSales);
router.get("/:id", authProtect, getSaleById);

// selling: any authenticated role (cashiers included)
router.post("/", authProtect, createSale);

module.exports = router;
