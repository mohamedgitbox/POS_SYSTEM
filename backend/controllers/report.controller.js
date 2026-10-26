const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const assertBranchAccess = require("../utils/assertBranchAccess");

/**
 * getDashboard
 * A single aggregated snapshot for a branch (or the whole organization):
 * revenue, transactions, top products, per-branch revenue, payment mix,
 * and a low-stock alert count. Optional branchId + from/to filters.
 */
const getDashboard = async (req, res) => {
  try {
    const { branchId: requestedBranchId, from, to } = req.query;

    // scoped roles can only view their own branch's dashboard
    let branchId;
    try {
      branchId = assertBranchAccess(req.user, requestedBranchId);
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        status: "failed",
        msg: err.message,
      });
    }

    if (
      (from && isNaN(new Date(from).getTime())) ||
      (to && isNaN(new Date(to).getTime()))
    ) {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid date format. Use ISO 8601",
      });
    }

    const match = { status: "completed" };
    if (branchId) match.branchId = branchId;
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    // overall figures
    const [totals] = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalTransactions: { $sum: 1 },
          totalProductsSold: { $sum: { $sum: "$items.quantity" } },
        },
      },
    ]);

    // top 5 products by units sold
    const topSellingProducts = await Sale.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.productName" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 },
    ]);

    // revenue grouped by branch (ignored when a branch filter is applied,
    // the aggregation still groups by branchId so super_admin sees the split)
    const revenueByBranch = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$branchId",
          revenue: { $sum: "$total" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // payment method mix
    const salesByPaymentMethod = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // low stock count (scoped to the branch when set)
    const lowStockFilter = {
      $expr: { $lte: ["$quantity", "$reorderLevel"] },
    };
    if (branchId) lowStockFilter.branchId = branchId;
    const lowStockCount = await Inventory.countDocuments(lowStockFilter);

    res.status(200).json({
      status: "success",
      data: {
        totalRevenue: totals ? totals.totalRevenue : 0,
        totalTransactions: totals ? totals.totalTransactions : 0,
        totalProductsSold: totals ? totals.totalProductsSold : 0,
        topSellingProducts,
        revenueByBranch,
        salesByPaymentMethod,
        lowStockAlert: lowStockCount,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
      });
    }

    console.error("Get Dashboard Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to build dashboard",
      error: error.message,
    });
  }
};

module.exports = { getDashboard };
