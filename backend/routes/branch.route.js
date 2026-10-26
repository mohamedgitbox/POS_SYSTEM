const express = require("express");
const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} = require("../controllers/branch.controller");
const authProtect = require("../middleware/auth.middleware");
const isAllowed = require("../middleware/allowedRole.middleware");

const router = express.Router();

// read endpoints: any authenticated role
router.get("/", authProtect, getAllBranches);
router.get("/:id", authProtect, getBranchById);

// write endpoints: super_admin only
router.post("/", authProtect, isAllowed("super_admin"), createBranch);
router.put("/:id", authProtect, isAllowed("super_admin"), updateBranch);
router.delete("/:id", authProtect, isAllowed("super_admin"), deleteBranch);

module.exports = router;
