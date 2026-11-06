const mongoose = require("mongoose");

/**
 * Application settings, stored as a single "general" document.
 * Created on first read so the API always returns a complete config.
 *
 * taxRate is a percentage (0-100, e.g. 14 = 14%). The POS frontend sends the
 * computed tax *amount* on each sale and the backend validates it, so this
 * setting and the sale records stay consistent with each other.
 */
const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "general",
      enum: ["general"],
    },
    taxRate: {
      type: Number,
      default: 14,
      min: [0, "Tax rate cannot be negative"],
      max: [100, "Tax rate cannot exceed 100%"],
    },
    currency: {
      type: String,
      default: "EGP",
      trim: true,
      maxlength: [10, "Currency code cannot exceed 10 characters"],
    },
    currencySymbol: {
      type: String,
      default: "ج.م",
      trim: true,
      maxlength: [5, "Currency symbol cannot exceed 5 characters"],
    },
    lowStockAlertThreshold: {
      type: Number,
      default: 10,
      min: [0, "Low stock alert threshold cannot be negative"],
    },
    allowNegativeStock: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "settings",
  },
);

// keep exactly one document per key
settingSchema.index({ key: 1 }, { unique: true });

settingSchema.statics.getGeneral = async function () {
  let settings = await this.findOne({ key: "general" });
  if (!settings) {
    settings = await this.create({ key: "general" });
  }
  return settings;
};

module.exports = mongoose.model("Setting", settingSchema);
