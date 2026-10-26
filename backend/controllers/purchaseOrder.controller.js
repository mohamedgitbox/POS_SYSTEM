const mongoose = require("mongoose");
const PurchaseOrder = require("../models/PurchaseOrder");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Branch = require("../models/Branch");

const getAllPurchaseOrders = async (req, res) => {
  try {
    const filter = {};

    const { status, branchId, page = 1, limit = 10 } = req.query;

    if (status) filter.status = status;
    if (branchId) filter.branchId = branchId;

    const skip = (page - 1) * limit;

    const orders = await PurchaseOrder.find(filter)
      .populate("branchId", "name code")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await PurchaseOrder.countDocuments(filter);

    res.status(200).json({
      status: "success",
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid filter ID format",
      });
    }

    console.error("Get All Purchase Orders Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch purchase orders",
      error: error.message,
    });
  }
};

const getPurchaseOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate("branchId", "name code")
      .populate("createdBy", "name email");

    if (!order) {
      return res.status(404).json({
        status: "failed",
        msg: "Purchase order not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid purchase order ID format",
      });
    }

    console.error("Get Purchase Order By ID Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch purchase order",
      error: error.message,
    });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const { supplierName, branchId, items, status } = req.body;

    if (!supplierName || !branchId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "failed",
        msg: "Please provide supplierName, branchId, and a non-empty items array",
      });
    }

    for (const item of items) {
      if (!item.productId || !item.orderedQty || item.unitCost === undefined) {
        return res.status(400).json({
          status: "failed",
          msg: "Each item must include productId, orderedQty, and unitCost",
        });
      }
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        status: "failed",
        msg: "Branch not found",
      });
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return res.status(400).json({
        status: "failed",
        msg: "One or more products not found",
      });
    }

    // compute totalCost server-side instead of trusting the client
    const totalCost = items.reduce((sum, item) => {
      return sum + item.orderedQty * item.unitCost;
    }, 0);

    const poNumber = `PO-${Date.now()}`;

    const order = await PurchaseOrder.create({
      poNumber,
      supplierName,
      branchId,
      createdBy: req.user._id,
      items,
      totalCost,
      status,
    });

    res.status(201).json({
      status: "success",
      msg: "Purchase order created successfully",
      data: order,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        status: "failed",
        msg: messages.join(", "),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch or product ID format",
      });
    }

    console.error("Create Purchase Order Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to create purchase order",
      error: error.message,
    });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "failed",
        msg: "Purchase order not found",
      });
    }

    if (order.status === "received") {
      return res.status(400).json({
        status: "failed",
        msg: "A received purchase order cannot be modified",
      });
    }

    const updates = {};
    const { supplierName, items, status, branchId } = req.body;

    if (supplierName) updates.supplierName = supplierName;
    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(404).json({
          status: "failed",
          msg: "Branch not found",
        });
      }
      updates.branchId = branchId;
    }
    if (Array.isArray(items) && items.length > 0) updates.items = items;
    if (status) updates.status = status;

    if (updates.items) {
      const totalCost = updates.items.reduce(
        (sum, item) => sum + item.orderedQty * item.unitCost,
        0,
      );
      updates.totalCost = totalCost;
    }

    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );

    res.status(200).json({
      status: "success",
      msg: "Purchase order updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid purchase order or branch ID format",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        status: "failed",
        msg: messages.join(", "),
      });
    }

    console.error("Update Purchase Order Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to update purchase order",
      error: error.message,
    });
  }
};

const deletePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "failed",
        msg: "Purchase order not found",
      });
    }

    if (order.status === "received") {
      return res.status(400).json({
        status: "failed",
        msg: "A received purchase order cannot be deleted",
      });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      msg: "Purchase order deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid purchase order ID format",
      });
    }

    console.error("Delete Purchase Order Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to delete purchase order",
      error: error.message,
    });
  }
};

const receivePurchaseOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await PurchaseOrder.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "failed",
        msg: "Purchase order not found",
      });
    }

    if (order.status === "received") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: "Purchase order has already been received",
      });
    }

    if (order.status === "cancelled") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: "A cancelled purchase order cannot be received",
      });
    }

    // increment (or create) inventory records inside the same transaction
    for (const item of order.items) {
      const inventory = await Inventory.findOne({
        productId: item.productId,
        branchId: order.branchId,
      }).session(session);

      if (inventory) {
        await Inventory.updateOne(
          { _id: inventory._id },
          { $inc: { quantity: item.orderedQty } },
          { session },
        );
      } else {
        await Inventory.create(
          [
            {
              productId: item.productId,
              branchId: order.branchId,
              quantity: item.orderedQty,
              reserved: 0,
            },
          ],
          { session },
        );
      }
    }

    order.status = "received";
    await order.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      status: "success",
      msg: "Purchase order received and stock updated successfully",
      data: order,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid purchase order ID format",
      });
    }

    console.error("Receive Purchase Order Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to receive purchase order",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  receivePurchaseOrder,
};
