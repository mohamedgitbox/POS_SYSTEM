const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    product_id: {
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
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price must be non-negative']
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price must be non-negative']
    }
  },
  {
    _id: false
  }
);

const saleSchema = new mongoose.Schema(
  {
    saleNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customerInfo: {
      name: { type: String, trim: true, default: 'Walk-in Customer' },
      phone: { type: String, trim: true }
    },
    items: [saleItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: [0]
    },
    tax: {
      type: Number,
      default: 0,
      min: [0]
    },
    discount: {
      type: Number,
      default: 0,
      min: [0]
    },
    total: {
      type: Number,
      required: true,
      default: 0,
      min: [0]
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'digital', 'other'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'cancelled'],
      default: 'completed'
    }
  },
  {
    timestamps: true,
    collection: 'sales'
  }
);

module.exports = mongoose.model('Sale', saleSchema);
