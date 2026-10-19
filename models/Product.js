const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    sku: {
      type: String,
      // unique: true,
      uppercase: true,
      trim: true
    },
    barcode: {
      type: String,
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: ['electronics', 'clothing', 'food', 'furniture', 'sports', 'books', 'beauty', 'toys', 'other']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative']
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost must be non-negative']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    image: {
      type: String,
      trim: true
    },
    unit: {
      type: String,
      default: 'pcs',
      enum: ['pcs', 'kg', 'L', 'ml', 'boxes', 'packs']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    collection: 'products'
  }
);

module.exports = mongoose.model('Product', productSchema);
