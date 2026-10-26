const express = require("express");
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customer.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

router.get("/", authProtect, getAllCustomers);
router.get("/:id", authProtect, getCustomerById);
router.post(
  "/",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  createCustomer,
);
router.put(
  "/:id",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  updateCustomer,
);
router.delete(
  "/:id",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  deleteCustomer,
);

module.exports = router;
