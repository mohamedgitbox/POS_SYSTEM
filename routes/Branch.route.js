const express = require("express");
const { root } = require("../controllers/Branch.controller");
const router = express.Router();

router.get("/", root);

module.exports = router;
