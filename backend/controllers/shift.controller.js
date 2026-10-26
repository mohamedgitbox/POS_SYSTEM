const Shift = require("../models/Shift");
const Sale = require("../models/Sale");
const Refund = require("../models/Refund");
const Branch = require("../models/Branch");
const assertBranchAccess = require("../utils/assertBranchAccess");

/**
 * openShift
 * A cashier opens a register shift by declaring the cash they started with.
 * Only one open shift per cashier per branch is allowed (enforced by a
 * partial unique index on the Shift model).
 */
const openShift = async (req, res) => {
  try {
    const { branchId: requestedBranchId, openingBalance } = req.body;

    let branchId;
    try {
      branchId = assertBranchAccess(req.user, requestedBranchId);
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        status: "failed",
        msg: err.message,
      });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        status: "failed",
        msg: "Branch not found",
      });
    }

    const balance = openingBalance === undefined ? 0 : Number(openingBalance);
    if (isNaN(balance) || balance < 0) {
      return res.status(400).json({
        status: "failed",
        msg: "openingBalance must be a non-negative number",
      });
    }

    const existing = await Shift.findOne({
      branchId: branchId,
      cashierId: req.user._id,
      status: "open",
    });

    if (existing) {
      return res.status(409).json({
        status: "failed",
        msg: "You already have an open shift in this branch. Close it first.",
      });
    }

    const shift = await Shift.create({
      branchId,
      cashierId: req.user._id,
      openingBalance: balance,
      status: "open",
    });

    res.status(201).json({
      status: "success",
      msg: "Shift opened successfully",
      data: shift,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "failed",
        msg: "You already have an open shift in this branch",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
      });
    }

    console.error("Open Shift Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to open shift",
      error: error.message,
    });
  }
};

/**
 * closeShift
 * Closes an open shift and reconciles the cash drawer:
 *   expected = openingBalance + cash sales - cash refunds
 *   discrepancy = closingBalance - expected
 * The cashier counts the drawer and reports the actual closing balance.
 */
const closeShift = async (req, res) => {
  try {
    const { closingBalance } = req.body;

    const shift = await Shift.findOne({
      _id: req.params.id,
      status: "open",
    });

    if (!shift) {
      return res.status(404).json({
        status: "failed",
        msg: "No open shift found",
      });
    }

    // only the cashier who opened the shift (or a manager) may close it
    const isOwner = shift.cashierId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role === "cashier") {
      return res.status(403).json({
        status: "failed",
        msg: "Only the cashier who opened the shift can close it",
      });
    }

    const balance = Number(closingBalance);
    if (isNaN(balance) || balance < 0) {
      return res.status(400).json({
        status: "failed",
        msg: "closingBalance is required and must be a non-negative number",
      });
    }

    // sales and refunds that belong to this shift, since it opened
    const since = shift.openedAt;

    const [cashSales, cashRefunds] = await Promise.all([
      Sale.aggregate([
        {
          $match: {
            shiftId: shift._id,
            status: "completed",
            paymentMethod: "cash",
            createdAt: { $gte: since },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Refund.aggregate([
        {
          $match: {
            branchId: shift.branchId,
            status: "completed",
            createdAt: { $gte: since },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    const cashSalesTotal = cashSales[0] ? cashSales[0].total : 0;
    const cashRefundsTotal = cashRefunds[0] ? cashRefunds[0].total : 0;

    const expectedBalance = shift.openingBalance + cashSalesTotal - cashRefundsTotal;
    const discrepancy = balance - expectedBalance;

    shift.closingBalance = balance;
    shift.expectedBalance = expectedBalance;
    shift.discrepancy = discrepancy;
    shift.closedAt = new Date();
    shift.status = "closed";
    await shift.save();

    res.status(200).json({
      status: "success",
      msg: "Shift closed successfully",
      data: shift,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid shift ID format",
      });
    }

    console.error("Close Shift Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to close shift",
      error: error.message,
    });
  }
};

/**
 * getShiftSummary
 * Reports the running totals for a shift: all sales and refunds booked to it,
 * plus the expected drawer balance if it is still open.
 */
const getShiftSummary = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id).populate(
      "branchId",
      "name code",
    );

    if (!shift) {
      return res.status(404).json({
        status: "failed",
        msg: "Shift not found",
      });
    }

    const sales = await Sale.find({ shiftId: shift._id }).select(
      "total paymentMethod status",
    );

    const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const salesCount = sales.length;
    const cashSales = sales
      .filter((s) => s.paymentMethod === "cash" && s.status === "completed")
      .reduce((sum, s) => sum + s.total, 0);

    const refunds = await Refund.find({
      branchId: shift.branchId,
      createdAt: { $gte: shift.openedAt },
    }).select("total status");

    const totalRefunds = refunds
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + r.total, 0);

    const expectedBalance =
      shift.openingBalance + cashSales - totalRefunds;

    res.status(200).json({
      status: "success",
      data: {
        shift: {
          id: shift._id,
          status: shift.status,
          branch: shift.branchId,
          openedAt: shift.openedAt,
          closedAt: shift.closedAt,
          openingBalance: shift.openingBalance,
        },
        totals: {
          totalSales,
          salesCount,
          cashSales,
          totalRefunds,
          expectedBalance,
          closingBalance: shift.closingBalance,
          discrepancy:
            shift.status === "closed" ? shift.discrepancy : null,
        },
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid shift ID format",
      });
    }

    console.error("Get Shift Summary Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch shift summary",
      error: error.message,
    });
  }
};

/**
 * getActiveShift
 * Returns the currently open shift for a branch (scoped by the caller's
 * role for non-admin users).
 */
const getActiveShift = async (req, res) => {
  try {
    let branchId;
    try {
      branchId = assertBranchAccess(
        req.user,
        req.query.branchId || req.params.branchId,
      );
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        status: "failed",
        msg: err.message,
      });
    }

    const shifts = await Shift.find({
      branchId,
      status: "open",
    }).populate("cashierId", "name email role");

    res.status(200).json({
      status: "success",
      count: shifts.length,
      data: shifts,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
      });
    }

    console.error("Get Active Shift Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch active shifts",
      error: error.message,
    });
  }
};

module.exports = {
  openShift,
  closeShift,
  getShiftSummary,
  getActiveShift,
};
