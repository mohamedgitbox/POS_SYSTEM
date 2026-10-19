const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null 
    },
    items: [saleItemSchema], 
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'MIXED'],
      default: 'CASH'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);