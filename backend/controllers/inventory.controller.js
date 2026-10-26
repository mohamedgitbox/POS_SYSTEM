const mongoose = require("mongoose");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Branch = require("../models/Branch");

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
    const { productId, branchId, reason } = req.body;
    let adjustment = req.body.adjustment;

    if (!productId || !branchId || !reason || adjustment === undefined) {
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

module.exports = {
  getInventoryByBranch,
  getLowStock,
  adjustInventory,
};
