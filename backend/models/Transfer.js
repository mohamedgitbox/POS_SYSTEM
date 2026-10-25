const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    }
  },
  {
    _id: false
  }
);

const transferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    sourceBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    destinationBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [transferItemSchema],
    totalItems: {
      type: Number,
      required: true,
      default: 0,
      min: [0]
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'in_transit', 'received'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    receivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'transfers'
  }
);

transferSchema.pre('validate', function () {
  if (
    this.sourceBranchId &&
    this.destinationBranchId &&
    this.sourceBranchId.equals(this.destinationBranchId)
  ) {
    this.invalidate(
      'destinationBranchId',
      'Source and destination branches must be different'
    );
  }
});

transferSchema.index({ status: 1 });

module.exports = mongoose.model('Transfer', transferSchema);
