const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity cannot be negative']
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative']
    },
    reserved: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative']
    }
  },
  {
    timestamps: true,
    collection: 'inventories',
    indexes: [
      { product_id: 1, branch_id: 1, unique: true }
    ]
  }
);

module.exports = mongoose.model('Inventory', inventorySchema);
