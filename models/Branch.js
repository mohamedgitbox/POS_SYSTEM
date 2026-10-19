const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      maxlength: [100, 'Branch name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [10, 'Branch code cannot exceed 10 characters']
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true }
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'branches'
  }
);

module.exports = mongoose.model('Branch', branchSchema);
