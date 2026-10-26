const Customer = require("../models/Customer");
const Branch = require("../models/Branch");

const getAllCustomers = async (req, res) => {
  try {
    const filter = {};

    const { branchId, search } = req.query;

    if (branchId) filter.branchId = branchId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(filter).populate(
      "branchId",
      "name code",
    );

    res.status(200).json({
      status: "success",
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid filter ID format",
      });
    }

    console.error("Get All Customers Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch customers",
      error: error.message,
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      "branchId",
      "name code",
    );

    if (!customer) {
      return res.status(404).json({
        status: "failed",
        msg: "Customer not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: customer,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid customer ID format",
      });
    }

    console.error("Get Customer By ID Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch customer",
      error: error.message,
    });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, branchId } = req.body;

    if (!name || !branchId) {
      return res.status(400).json({
        status: "failed",
        msg: "Please provide customer name and branchId",
      });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(400).json({
        status: "failed",
        msg: "Branch not found",
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      branchId,
      createdBy: req.user._id,
    });

    res.status(201).json({
      status: "success",
      msg: "Customer created successfully",
      data: customer,
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
        msg: "A customer with this phone number already exists in this branch",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
      });
    }

    console.error("Create Customer Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to create customer",
      error: error.message,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const updates = req.body;

    if (updates.branchId) {
      const branch = await Branch.findById(updates.branchId);
      if (!branch) {
        return res.status(400).json({
          status: "failed",
          msg: "Branch not found",
        });
      }
    }

    // createdBy is immutable after creation
    delete updates.createdBy;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );

    if (!customer) {
      return res.status(404).json({
        status: "failed",
        msg: "Customer not found",
      });
    }

    res.status(200).json({
      status: "success",
      msg: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid customer or branch ID format",
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
        msg: "A customer with this phone number already exists in this branch",
      });
    }

    console.error("Update Customer Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to update customer",
      error: error.message,
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        status: "failed",
        msg: "Customer not found",
      });
    }

    res.status(200).json({
      status: "success",
      msg: "Customer deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid customer ID format",
      });
    }

    console.error("Delete Customer Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to delete customer",
      error: error.message,
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
