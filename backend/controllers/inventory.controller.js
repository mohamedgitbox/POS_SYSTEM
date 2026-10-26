const mongoose = require("mongoose");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Branch = require("../models/Branch");
const InventoryLog = require("../models/InventoryLog");
const assertBranchAccess = require("../utils/assertBranchAccess");

const getInventoryByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        status: "failed",
        msg: "Branch not found",
      });
    }

    const inventory = await Inventory.find({ branchId })
      .populate("productId", "name sku barcode category unit")
      .sort({ quantity: 1 });

    res.status(200).json({
      status: "success",
      branchId,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
      });
    }

    console.error("Get Inventory By Branch Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch branch inventory",
      error: error.message,
    });
  }
};

const getLowStock = async (req, res) => {
  try {
    const filter = {
      $expr: { $lte: ["$quantity", "$reorderLevel"] },
    };

    const { branchId } = req.query;
    if (branchId) filter.branchId = branchId;

    const inventory = await Inventory.find(filter).populate(
      "productId",
      "name sku category unit",
    );

    res.status(200).json({
      status: "success",
      count: inventory.length,
      msg: "Inventory items at or below reorder level",
      data: inventory,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
      });
    }

    console.error("Get Low Stock Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch low stock items",
      error: error.message,
    });
  }
};

const adjustInventory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, branchId: requestedBranchId, reason } = req.body;
    let adjustment = req.body.adjustment;

    // resolve the effective branch (server-side, role-aware)
    let branchId;
    try {
      branchId = assertBranchAccess(req.user, requestedBranchId);
    } catch (err) {
      await session.abortTransaction();
      return res.status(err.statusCode || 400).json({
        status: "failed",
        msg: err.message,
      });
    }

    if (!productId || !reason || adjustment === undefined) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: "Please provide productId, branchId, adjustment, and reason",
      });
    }

    adjustment = Number(adjustment);
    if (!Number.isInteger(adjustment) || adjustment === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: "Adjustment must be a non-zero integer",
      });
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "failed",
        msg: "Product not found",
      });
    }

    let inventory = await Inventory.findOne({
      productId,
      branchId,
    }).session(session);

    if (!inventory) {
      if (adjustment < 0) {
        await session.abortTransaction();
        return res.status(404).json({
          status: "failed",
          msg: "No inventory record found for this product in this branch",
        });
      }

      inventory = await Inventory.create(
        [
          {
            productId,
            branchId,
            quantity: adjustment,
            reserved: 0,
          },
        ],
        { session },
      )[0];
    } else if (adjustment < 0 && inventory.quantity + adjustment < 0) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: `Insufficient stock for adjustment. Available: ${inventory.quantity}`,
      });
    }

    const updated = await Inventory.findOneAndUpdate(
      { productId, branchId },
      { $inc: { quantity: adjustment } },
      { new: true, session },
    );

    // write the audit entry inside the same transaction
    await InventoryLog.create(
      [
        {
          productId,
          branchId,
          type: "adjustment",
          change: adjustment,
          quantityAfter: updated ? updated.quantity : null,
          referenceId: null,
          userId: req.user._id,
          reason,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    res.status(200).json({
      status: "success",
      msg: "Inventory adjusted successfully",
      data: {
        inventory: updated,
        productId: product._id,
        productName: product.name,
        branchId,
        adjustment,
        reason,
        adjustedBy: req.user._id,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid product or branch ID format",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        status: "failed",
        msg: "Inventory record already exists for this product and branch",
      });
    }

    console.error("Adjust Inventory Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to adjust inventory",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * getInventoryHistory
 * Chronological audit trail of every stock change for a product,
 * optionally scoped to a branch and paginated.
 */
const getInventoryHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { branchId, from, to, page = 1, limit = 50 } = req.query;

    const filter = { productId };
    if (branchId) filter.branchId = branchId;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (
      (from && isNaN(new Date(from).getTime())) ||
      (to && isNaN(new Date(to).getTime()))
    ) {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid date format. Use ISO 8601",
      });
    }

    const skip = (page - 1) * limit;

    const logs = await InventoryLog.find(filter)
      .populate("userId", "name email")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: 1 });

    const total = await InventoryLog.countDocuments(filter);

    res.status(200).json({
      status: "success",
      count: logs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid product or branch ID format",
      });
    }

    console.error("Get Inventory History Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch inventory history",
      error: error.message,
    });
  }
};

module.exports = {
  getInventoryByBranch,
  getLowStock,
  adjustInventory,
  getInventoryHistory,
};
