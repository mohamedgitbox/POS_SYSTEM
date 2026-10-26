const mongoose = require("mongoose");
const Transfer = require("../models/Transfer");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Branch = require("../models/Branch");

const getAllTransfers = async (req, res) => {
  try {
    const filter = {};

    const { status, sourceBranchId, destinationBranchId, page = 1, limit = 10 } = req.query;

    if (status) filter.status = status;
    if (sourceBranchId) filter.sourceBranchId = sourceBranchId;
    if (destinationBranchId) filter.destinationBranchId = destinationBranchId;

    const skip = (page - 1) * limit;

    const transfers = await Transfer.find(filter)
      .populate("sourceBranchId", "name code")
      .populate("destinationBranchId", "name code")
      .populate("requestedBy", "name email")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Transfer.countDocuments(filter);

    res.status(200).json({
      status: "success",
      count: transfers.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: transfers,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid filter ID format",
      });
    }

    console.error("Get All Transfers Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch transfers",
      error: error.message,
    });
  }
};

const getTransferById = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate("sourceBranchId", "name code")
      .populate("destinationBranchId", "name code")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email");

    if (!transfer) {
      return res.status(404).json({
        status: "failed",
        msg: "Transfer not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: transfer,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid transfer ID format",
      });
    }

    console.error("Get Transfer By ID Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch transfer",
      error: error.message,
    });
  }
};

const createTransfer = async (req, res) => {
  try {
    const { sourceBranchId, destinationBranchId, items } = req.body;

    if (!sourceBranchId || !destinationBranchId) {
      return res.status(400).json({
        status: "failed",
        msg: "Please provide sourceBranchId and destinationBranchId",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "failed",
        msg: "Please provide a non-empty items array",
      });
    }

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({
          status: "failed",
          msg: "Each item must include productId and quantity",
        });
      }
    }

    const [source, destination] = await Promise.all([
      Branch.findById(sourceBranchId),
      Branch.findById(destinationBranchId),
    ]);

    if (!source || !destination) {
      return res.status(404).json({
        status: "failed",
        msg: "Source or destination branch not found",
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

    const transferItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      return {
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
      };
    });

    // totalItems computed server-side instead of trusting the client
    const totalItems = transferItems.length;

    const transferNumber = `TRF-${Date.now()}`;

    const transfer = await Transfer.create({
      transferNumber,
      sourceBranchId,
      destinationBranchId,
      requestedBy: req.user._id,
      items: transferItems,
      totalItems,
      status: "pending",
    });

    res.status(201).json({
      status: "success",
      msg: "Transfer requested successfully",
      data: transfer,
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

    console.error("Create Transfer Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to create transfer",
      error: error.message,
    });
  }
};

const updateTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({
        status: "failed",
        msg: "Transfer not found",
      });
    }

    // only status transitions are editable, and only through legal paths
    const { status } = req.body;

    const allowedTransitions = {
      pending: ["in_transit", "rejected"],
      in_transit: ["received", "rejected"],
      rejected: [],
      received: [],
    };

    if (status) {
      if (!allowedTransitions[transfer.status]?.includes(status)) {
        return res.status(400).json({
          status: "failed",
          msg: `Invalid status transition from '${transfer.status}' to '${status}'`,
        });
      }

      // 'received' must go through /receive to keep inventory in sync
      if (status === "received") {
        return res.status(400).json({
          status: "failed",
          msg: "Use PUT /api/transfers/:id/receive to mark a transfer as received",
        });
      }

      const updates = { status };
      if (status === "rejected" && req.body.rejectionReason) {
        updates.rejectionReason = req.body.rejectionReason;
      }
      if (status === "in_transit") {
        updates.approvedBy = req.user._id;
      }

      await Transfer.findByIdAndUpdate(req.params.id, updates, {
        runValidators: true,
      });

      return res.status(200).json({
        status: "success",
        msg: "Transfer updated successfully",
        data: await Transfer.findById(req.params.id),
      });
    }

    return res.status(400).json({
      status: "failed",
      msg: "Only status transitions are supported",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid transfer ID format",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        status: "failed",
        msg: messages.join(", "),
      });
    }

    console.error("Update Transfer Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to update transfer",
      error: error.message,
    });
  }
};

const receiveTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transfer = await Transfer.findById(req.params.id).session(session);

    if (!transfer) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "failed",
        msg: "Transfer not found",
      });
    }

    if (transfer.status === "received") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: "Transfer has already been received",
      });
    }

    if (transfer.status === "rejected") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: "A rejected transfer cannot be received",
      });
    }

    // mark in-transit within the same transaction if still pending
    if (transfer.status === "pending") {
      transfer.status = "in_transit";
      transfer.approvedBy = req.user._id;
      await transfer.save({ session });
    }

    for (const item of transfer.items) {
      const sourceInventory = await Inventory.findOne({
        productId: item.productId,
        branchId: transfer.sourceBranchId,
      }).session(session);

      if (!sourceInventory) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: `No inventory record for product ${item.productName} at the source branch`,
        });
      }

      if (sourceInventory.quantity < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: `Insufficient stock at source branch for ${item.productName}. Requested: ${item.quantity}, Available: ${sourceInventory.quantity}`,
        });
      }

      await Inventory.updateOne(
        { _id: sourceInventory._id },
        { $inc: { quantity: -item.quantity } },
        { session },
      );

      const destinationInventory = await Inventory.findOne({
        productId: item.productId,
        branchId: transfer.destinationBranchId,
      }).session(session);

      if (destinationInventory) {
        await Inventory.updateOne(
          { _id: destinationInventory._id },
          { $inc: { quantity: item.quantity } },
          { session },
        );
      } else {
        await Inventory.create(
          [
            {
              productId: item.productId,
              branchId: transfer.destinationBranchId,
              quantity: item.quantity,
              reserved: 0,
            },
          ],
          { session },
        );
      }
    }

    transfer.status = "received";
    transfer.approvedBy = req.user._id;
    transfer.receivedAt = new Date();
    await transfer.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      status: "success",
      msg: "Transfer received and stock updated successfully",
      data: transfer,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid transfer ID format",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        status: "failed",
        msg: "Inventory record already exists for this product and branch",
      });
    }

    console.error("Receive Transfer Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to receive transfer",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  getAllTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  receiveTransfer,
};
