const mongoose = require("mongoose");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const begin = (req, res) => {
  res.json({ status: "success", msg: "auth route running" });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if ((!email, !password)) {
      return res.status(400);
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ status: "failed", msg: "wrong email or password" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: "failed", msg: "wrong email or password" });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          branch: user.branchId, 
        },
      },
    });
  } catch (error) {
    res.send(error);
  }
};


// const register = (req, res) => {
//     const {}
// }

module.exports = {
  begin,
  login,
};
