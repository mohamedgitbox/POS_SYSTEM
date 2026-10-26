const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} = require("../controllers/product.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

// read endpoints: any authenticated role
router.get("/", authProtect, getAllProducts);
router.get("/category/:category", authProtect, getProductsByCategory);
router.get("/:id", authProtect, getProductById);

// write endpoints: super_admin or branch_manager
router.post(
  "/",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  createProduct,
);
router.put(
  "/:id",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  updateProduct,
);
router.delete(
  "/:id",
  authProtect,
  isAllowed("super_admin", "branch_manager"),
  deleteProduct,
);

module.exports = router;
