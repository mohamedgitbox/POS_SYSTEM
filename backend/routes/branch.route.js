const express = require("express");
const { root } = require("../controllers/branch.controller");
const router = express.Router();

router.get("/", root);

module.exports = router;
