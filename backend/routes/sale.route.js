const express = require("express");
const { createSale } = require("../controllers/sale.controller");
const authProtect = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authProtect, createSale);
module.exports = router;
