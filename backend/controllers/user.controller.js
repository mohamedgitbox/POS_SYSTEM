const mongoose = require("mongoose");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");


const Hello = (req, res) => {
  res.json({ status: "success", msg: "Hello, World!" });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        status: "failed", 
        msg: "Please provide email and password" 
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ 
        status: "failed", 
        msg: "Wrong email or password" 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        status: "failed", 
        msg: "Wrong email or password" 
      });
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
    console.error("Login Error:", error);
    res.status(500).json({ 
      status: "failed", 
      msg: "Internal server error" 
    });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, role, branchId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: "failed",
        msg: "Please provide name, email, and password",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: "failed",
        msg: "Email already exists",
      });
    }

    
    const newUser = await User.create({
      name,
      email,
      password,
      role: role || "cashier", 
      branchId: branchId || null,
    });

    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      status: "success",
      msg: "User registered successfully",
      token,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          branch: newUser.branchId,
        },
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        status: "failed",
        msg: messages.join(", "),
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        status: "failed",
        msg: "Email already exists",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
      });
    }

    console.error("Register Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Internal server error",
    });
  }
};

module.exports = {
  login,
  register, 
  Hello
};