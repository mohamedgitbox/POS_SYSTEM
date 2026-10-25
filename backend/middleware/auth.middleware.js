const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const jwt = require("jsonwebtoken");
const User = require("../models/User");


const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid Credential (Not Found Berar Token)",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded._id);
    if (!currentUser) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid Credential (user not found)",
      });
    }

    req.user = currentUser; //todo: ?search 

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid Credential (token is expired)",
      error: error.message,
    });
  }
};

module.exports = protect;
