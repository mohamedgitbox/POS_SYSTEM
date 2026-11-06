const Setting = require("../models/Setting");

/**
 * getGeneralSettings
 * Any authenticated user can READ the general settings (tax rate, currency,
 * low-stock threshold) because they drive shared UI behavior (POS tax calc).
 * Only super_admin may change them.
 */
const getGeneralSettings = async (req, res) => {
  try {
    const settings = await Setting.getGeneral();
    res.status(200).json({
      status: "success",
      data: { settings },
    });
  } catch (error) {
    console.error("Get General Settings Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch general settings",
      error: error.message,
    });
  }
};

const updateGeneralSettings = async (req, res) => {
  try {
    const { taxRate, currency, currencySymbol, lowStockAlertThreshold, allowNegativeStock } =
      req.body;

    const update = {};

    if (taxRate !== undefined && taxRate !== null && taxRate !== "") {
      const rate = Number(taxRate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return res.status(400).json({
          status: "failed",
          msg: "Tax rate must be a number between 0 and 100 (percentage)",
        });
      }
      update.taxRate = rate;
    }

    if (currency !== undefined) update.currency = String(currency).trim();
    if (currencySymbol !== undefined) {
      update.currencySymbol = String(currencySymbol).trim();
    }

    if (
      lowStockAlertThreshold !== undefined &&
      lowStockAlertThreshold !== null &&
      lowStockAlertThreshold !== ""
    ) {
      const threshold = Number(lowStockAlertThreshold);
      if (!Number.isFinite(threshold) || threshold < 0) {
        return res.status(400).json({
          status: "failed",
          msg: "Low stock alert threshold must be a non-negative number",
        });
      }
      update.lowStockAlertThreshold = threshold;
    }

    if (allowNegativeStock !== undefined) {
      update.allowNegativeStock = Boolean(allowNegativeStock);
    }

    const settings = await Setting.findOneAndUpdate(
      { key: "general" },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.status(200).json({
      status: "success",
      msg: "General settings saved successfully",
      data: { settings },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        status: "failed",
        msg: messages.join(", "),
      });
    }

    console.error("Update General Settings Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to save general settings",
      error: error.message,
    });
  }
};

module.exports = {
  getGeneralSettings,
  updateGeneralSettings,
};
