const express = require("express");
const {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  receivePurchaseOrder,
} = require("../controllers/purchaseOrder.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

router.get("/", authProtect, isAllowed("super_admin", "branch_manager"), getAllPurchaseOrders);
router.get("/:id", authProtect, getPurchaseOrderById);
router.post(
  "/",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  createPurchaseOrder,
);
router.put(
  "/:id",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  updatePurchaseOrder,
);
router.delete(
  "/:id",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  deletePurchaseOrder,
);
router.put(
  "/:id/receive",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  receivePurchaseOrder,
);

module.exports = router;
