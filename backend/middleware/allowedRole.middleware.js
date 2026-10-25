const isAllowed = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ status: "failed", msg: "Not Login" });
    }
    const isAllow = allowedRoles.includes(req.user.role);
    if (!isAllow) {
      console.log(allowedRoles, `user role : ${req.user.role}`);
      return res
        .status(403)
        .json({ status: "failed", msg: "Not allowed role" });
    }
    next();
  };
};

module.exports = isAllowed;
