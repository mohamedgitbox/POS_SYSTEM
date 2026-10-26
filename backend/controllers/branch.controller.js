const Branch = require("../models/Branch");
const User = require("../models/User");

const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res.status(200).json({
      status: "success",
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    console.error("Get All Branches Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch branches",
      error: error.message,
    });
  }
};

const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        status: "failed",
        msg: "Branch not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: branch,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
      });
    }

    console.error("Get Branch By ID Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch branch",
      error: error.message,
    });
  }
};

const createBranch = async (req, res) => {
  try {
    const { name, code, address, phone, email, managerId } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        status: "failed",
        msg: "Please provide branch name and code",
      });
    }

    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(400).json({
          status: "failed",
          msg: "Manager user not found",
        });
      }
    }

    const branch = await Branch.create({
      name,
      code,
      address,
      phone,
      email,
      managerId,
    });

    res.status(201).json({
      status: "success",
      msg: "Branch created successfully",
      data: branch,
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
        msg: "Branch code already exists",
      });
    }

    console.error("Create Branch Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to create branch",
      error: error.message,
    });
  }
};

const updateBranch = async (req, res) => {
  try {
    const updates = req.body;

    if (updates.managerId) {
      const manager = await User.findById(updates.managerId);
      if (!manager) {
        return res.status(400).json({
          status: "failed",
          msg: "Manager user not found",
        });
      }
    }

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );

    if (!branch) {
      return res.status(404).json({
        status: "failed",
        msg: "Branch not found",
      });
    }

    res.status(200).json({
      status: "success",
      msg: "Branch updated successfully",
      data: branch,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
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
        msg: "Branch code already exists",
      });
    }

    console.error("Update Branch Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to update branch",
      error: error.message,
    });
  }
};

const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);

    if (!branch) {
      return res.status(404).json({
        status: "failed",
        msg: "Branch not found",
      });
    }

    res.status(200).json({
      status: "success",
      msg: "Branch deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
      });
    }

    console.error("Delete Branch Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to delete branch",
      error: error.message,
    });
  }
};

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
};
