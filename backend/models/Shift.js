const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
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
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    openingBalance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Opening balance cannot be negative"],
    },
    closingBalance: {
      type: Number,
      default: null,
      min: [0, "Closing balance cannot be negative"],
    },
    // expected = opening + cash sales - refunds (cash portion)
    expectedBalance: {
      type: Number,
      default: null,
    },
    // closingBalance - expectedBalance, set at close time
    discrepancy: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  {
    timestamps: true,
    collection: "shifts",
  },
);

// at most one open shift per cashier per branch
shiftSchema.index(
  { cashierId: 1, branchId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "open" },
  },
);

shiftSchema.index({ branchId: 1, status: 1 });

module.exports = mongoose.model("Shift", shiftSchema);
