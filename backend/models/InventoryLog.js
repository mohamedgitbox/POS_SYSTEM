const mongoose = require("mongoose");

/**
 * InventoryLog — append-only audit trail of every inventory mutation.
 * One row per (product, branch, change) event. The referenceId points to the
 * originating document (Sale, PurchaseOrder, Transfer, Refund, or a manual
 * adjustment) so the full chain of custody can be reconstructed.
 */
const inventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    // what kind of event mutated the stock
    type: {
      type: String,
      required: true,
      enum: [
        "sale",
        "purchase_order",
        "transfer_out",
        "transfer_in",
        "adjustment",
        "return",
      ],
    },
    // signed change applied to quantity (negative = out, positive = in)
    change: {
      type: Number,
      required: true,
    },
    // quantity AFTER the change (null for events where it was not captured)
    quantityAfter: {
      type: Number,
      default: null,
    },
    // the document that caused this change (Sale / PO / Transfer / Refund / adjustment)
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // who triggered the change
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // free-form reason / note
    reason: {
      type: String,
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "inventory_logs",
  },
);

inventoryLogSchema.index({ productId: 1, branchId: 1, createdAt: -1 });
inventoryLogSchema.index({ type: 1 });

module.exports = mongoose.model("InventoryLog", inventoryLogSchema);
