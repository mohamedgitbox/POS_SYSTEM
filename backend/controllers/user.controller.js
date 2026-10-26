const mongoose = require("mongoose");
const User = require("../models/User");
const Branch = require("../models/Branch");
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
        msg: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        status: "failed",
        msg: "Wrong email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: "failed",
        msg: "Wrong email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: "failed",
        msg: "Account is deactivated. Please contact an administrator.",
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
      msg: "Internal server error",
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

const getAllUsers = async (req, res) => {
  try {
    const filter = {};

    const { role, branchId, isActive } = req.query;

    if (role) filter.role = role;
    if (branchId) filter.branchId = branchId;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const users = await User.find(filter).populate("branchId", "name code");

    res.status(200).json({
      status: "success",
      count: users.length,
      data: users,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid filter ID format",
      });
    }

    console.error("Get All Users Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch users",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "branchId",
      "name code",
    );

    if (!user) {
      return res.status(404).json({
        status: "failed",
        msg: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid user ID format",
      });
    }

    console.error("Get User By ID Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch user",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, branchId, isActive, password } = req.body;

    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(400).json({
          status: "failed",
          msg: "Branch not found",
        });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (branchId !== undefined) updates.branchId = branchId || null;
    if (isActive !== undefined) updates.isActive = isActive;
    if (password) updates.password = password;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({
        status: "failed",
        msg: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      msg: "User updated successfully",
      data: user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid user or branch ID format",
      });
    }

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

    console.error("Update User Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to update user",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: "failed",
        msg: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "failed",
        msg: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      msg: "User deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid user ID format",
      });
    }

    console.error("Delete User Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to delete user",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  register,
  Hello,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
