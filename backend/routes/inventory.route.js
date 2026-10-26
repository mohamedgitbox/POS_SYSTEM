const express = require("express");
const {
  getInventoryByBranch,
  getLowStock,
  adjustInventory,
  getInventoryHistory,
} = require("../controllers/inventory.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

router.get("/low-stock", authProtect, getLowStock);
router.get("/:productId/history", authProtect, getInventoryHistory);
router.get("/:branchId", authProtect, getInventoryByBranch);
router.post(
  "/adjust",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  adjustInventory,
);

module.exports = router;
