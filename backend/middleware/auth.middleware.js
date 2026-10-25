const jwt = require("jsonwebtoken");
const User = require("../models/User");


const authProtect = async (req, res, next) => {
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
        success: false,
        message: "Invalid Credentials: No Bearer Token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials: The user belonging to this token no longer exists",
      });
    }

    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials: User recently changed password. Please log in again.",
      });
    }

    req.user = currentUser;
    next();
    
  } catch (error) {
    let errorMessage = "Invalid Credentials: Token verification failed";
    
    if (error.name === "TokenExpiredError") {
      errorMessage = "Invalid Credentials: Token has expired";
    } else if (error.name === "JsonWebTokenError") {
      errorMessage = "Invalid Credentials: Invalid token signature";
    }

    console.error("Auth Middleware Error:", error.message);

    return res.status(401).json({
      success: false,
      message: errorMessage,
    });
  }
};

module.exports = authProtect;