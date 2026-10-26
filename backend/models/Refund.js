const mongoose = require("mongoose");

const refundItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price must be non-negative"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price must be non-negative"],
    },
  },
  { _id: false },
);

const refundSchema = new mongoose.Schema(
  {
    refundNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [refundItemSchema],
    total: {
      type: Number,
      required: true,
      default: 0,
      min: [0],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["completed", "pending", "cancelled"],
      default: "completed",
    },
  },
  {
    timestamps: true,
    collection: "refunds",
  },
);

refundSchema.index({ saleId: 1 });
refundSchema.index({ branchId: 1, createdAt: -1 });

module.exports = mongoose.model("Refund", refundSchema);
