const { begin, login } = require("../controllers/user.controller");
const express = require("express");
const router = express.Router();

router.get("/", begin);
router.post("/login", login);

module.exports = router;
