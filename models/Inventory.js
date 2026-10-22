const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    branchId: {
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
      min: [0, 'Reserved quantity cannot be negative'],
      validate: {
        validator: function (value) {
          return value <= this.quantity;
        },
        message: 'Reserved quantity cannot exceed stock quantity'
      }
    }
  },
  {
    timestamps: true,
    collection: 'inventories'
  }
);

inventorySchema.index(
  { productId: 1, branchId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);