const express = require("express");
const {
  getAllTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  receiveTransfer,
} = require("../controllers/transfer.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

router.get("/", authProtect, isAllowed("super_admin", "branch_manager"), getAllTransfers);
router.get("/:id", authProtect, getTransferById);
router.post(
  "/",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  createTransfer,
);
router.put(
  "/:id",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  updateTransfer,
);
router.put(
  "/:id/receive",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  receiveTransfer,
);

module.exports = router;
