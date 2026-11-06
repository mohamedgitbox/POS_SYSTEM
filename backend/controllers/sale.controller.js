const mongoose = require("mongoose");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
const Shift = require("../models/Shift");
const Refund = require("../models/Refund");
const InventoryLog = require("../models/InventoryLog");
const assertBranchAccess = require("../utils/assertBranchAccess");
const resolveBranchScope = require("../utils/resolveBranchScope");
const {
  normalizeNonNegativeMoney,
  computeSaleTotal,
} = require("../utils/saleTotals");

/**
 * createSale
 * - Branch scope: cashier/branch_manager can only sell from their assigned
 *   branch; super_admin can sell from any branch. The effective branchId is
 *   therefore derived server-side, never trusted from the client for scoped roles.
 * - customerInfo is snapshotted from the Customer document so receipts remain
 *   accurate even if the customer record is later edited or deleted.
 * - Every stock decrement is written to InventoryLog for the audit trail.
 * - If a cash/card shift is open for this user + branch, the sale is linked to it
 *   so the register can reconcile at close time.
 */
const createSale = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      status: "failed",
      msg: "Unauthorized: No user found. Please check your token.",
    });
  }

  // resolve the effective branch (server-side, role-aware)
  let effectiveBranchId;
  try {
    effectiveBranchId = assertBranchAccess(req.user, req.body.branchId);
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      status: "failed",
      msg: err.message,
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
        const {
      customerId,
      items,
      paymentMethod,
    } = req.body;

    const { tax: normalizedTax, error: taxError } = normalizeNonNegativeMoney(req.body.tax, "Tax");
    if (taxError) {
      await session.abortTransaction();
      return res.status(400).json({ status: "failed", msg: taxError });
    }

    const { value: discount, error: discountError } = normalizeNonNegativeMoney(
      req.body.discount,
      "Discount",
    );
    if (discountError) {
      await session.abortTransaction();
      return res.status(400).json({ status: "failed", msg: discountError });
    }

    const tax = normalizedTax;

    const branchId = effectiveBranchId;
    const cashierId = req.user._id;

    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: "Please provide a non-empty items array",
      });
    }

    // snapshot customer info into the sale document
    let customerInfo = { name: "Walk-in Customer", phone: "" };
    if (customerId) {
      const customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        await session.abortTransaction();
        return res.status(404).json({
          status: "failed",
          msg: "Customer not found",
        });
      }
      customerInfo = { name: customer.name, phone: customer.phone || "" };
    }

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(
      session,
    );

    if (products.length !== productIds.length) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ status: "failed", msg: "One or more products not found" });
    }

    const saleItems = [];
    let subtotal = 0;

    const seenProducts = new Set();
    for (const item of items) {
      if (seenProducts.has(item.productId)) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: `Duplicate product ${item.productId} in items array. Merge quantities into a single line.`,
        });
      }
      seenProducts.add(item.productId);

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: "Each item quantity must be a positive integer",
        });
      }

      const product = products.find((p) => p._id.toString() === item.productId);
      const inventory = await Inventory.findOne({
        productId: item.productId,
        branchId: branchId,
      }).session(session);

      if (!inventory) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: `No inventory found for product ${product.name} in this branch`,
        });
      }

      if (inventory.quantity < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: `Insufficient stock for ${product.name}. Available: ${inventory.quantity}`,
        });
      }

      const unitPrice = product.price;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      saleItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

        const updatedInventories = [];
    for (const item of items) {
      const result = await Inventory.updateOne(
        { productId: item.productId, branchId: branchId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { session },
      );
      if (result.matchedCount === 0) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: `Insufficient stock or concurrent modification for product in this branch`,
        });
      }
      const updated = await Inventory.findOne({ productId: item.productId, branchId: branchId }).session(session);
      updatedInventories.push({ productId: item.productId, quantity: updated ? updated.quantity : null });
    }

    const totalResult = computeSaleTotal(subtotal, tax, discount);
    if (!totalResult.ok) {
      await session.abortTransaction();
      return res.status(400).json({ status: "failed", msg: totalResult.error });
    }

    const total = totalResult.total;

    const saleNumber = `SALE-${Date.now()}`;

    const activeShift = await Shift.findOne({
      branchId: branchId,
      cashierId: cashierId,
      status: "open",
    }).session(session);

    const newSale = await Sale.create(
      [
        {
          saleNumber,
          branchId,
          cashierId,
          customerId: customerId || null,
          customerInfo,
          items: saleItems,
          subtotal,
          tax,
          discount,
          total,
          paymentMethod: paymentMethod || "cash",
          status: "completed",
          shiftId: activeShift ? activeShift._id : null,
        },
      ],
      { session },
    );

    await InventoryLog.insertMany(
      saleItems.map((item) => {
        const inv = updatedInventories.find((u) => u.productId.toString() === item.productId.toString());
        return {
          productId: item.productId,
          branchId,
          type: "sale",
          change: -item.quantity,
          quantityAfter: inv ? inv.quantity : null,
          referenceId: newSale[0]._id,
          userId: cashierId,
          reason: `Sale ${newSale[0].saleNumber}`,
        };
      }),
      { session },
    );

    await session.commitTransaction();

    res.status(201).json({
      status: "success",
      msg: "Sale completed successfully",
      data: { sale: newSale[0] },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Sale Error:", error);

    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ status: "failed", msg: "Invalid ID format" });
    }

    res.status(500).json({
      status: "failed",
      msg: "Failed to complete sale",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * createReturn
 * - Accepts a subset of items from a completed sale and refunds them.
 * - Marks the original sale "returned" (or keeps it "completed" for partial
 *   returns), creates a Refund record, and restores inventory transactionally.
 * - Only allows returning up to the original quantity per product.
 */
const createReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const originalSale = await Sale.findById(req.params.id).session(session);

    if (!originalSale) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "failed",
        msg: "Original sale not found",
      });
    }

    try {
      assertBranchAccess(req.user, originalSale.branchId.toString());
    } catch (err) {
      await session.abortTransaction();
      return res.status(err.statusCode || 403).json({
        status: "failed",
        msg: err.message,
      });
    }

    if (originalSale.status === "cancelled") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: "A cancelled sale cannot be returned",
      });
    }

    if (originalSale.status !== "completed") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: "Only completed sales can be returned",
      });
    }

    const { items, reason } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "failed",
        msg: "Please provide a non-empty items array (productId + quantity)",
      });
    }

    const existingRefunds = await Refund.find({ saleId: originalSale._id, status: "completed" }).session(session);
    const alreadyReturned = {};
    for (const refund of existingRefunds) {
      for (const ri of refund.items) {
        const pid = ri.productId.toString();
        alreadyReturned[pid] = (alreadyReturned[pid] || 0) + ri.quantity;
      }
    }

    const returnLines = [];
    let refundTotal = 0;
    const seenProducts = new Set();

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: "Each returned item must include productId and quantity",
        });
      }

      if (seenProducts.has(item.productId)) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: `Duplicate product ${item.productId} in return items. Merge quantities into a single line.`,
        });
      }
      seenProducts.add(item.productId);

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: "Each return quantity must be a positive integer",
        });
      }

      const originalItem = originalSale.items.find(
        (o) => o.productId.toString() === item.productId,
      );

      if (!originalItem) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: `Product ${item.productId} was not part of this sale`,
        });
      }

      const prevReturned = alreadyReturned[item.productId] || 0;
      const remainingReturnable = originalItem.quantity - prevReturned;

      if (item.quantity > remainingReturnable) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "failed",
          msg: `Cannot return ${item.quantity} of ${originalItem.productName}. Only ${remainingReturnable} remain returnable (${prevReturned} already returned)`,
        });
      }

      const lineRefund = originalItem.unitPrice * item.quantity;
      refundTotal += lineRefund;

      returnLines.push({
        productId: originalItem.productId,
        productName: originalItem.productName,
        quantity: item.quantity,
        unitPrice: originalItem.unitPrice,
        totalPrice: lineRefund,
      });
    }

    for (const line of returnLines) {
      await Inventory.updateOne(
        { productId: line.productId, branchId: originalSale.branchId },
        { $inc: { quantity: line.quantity } },
        { session },
      );
    }

    const totalOriginalQty = originalSale.items.reduce(
      (sum, i) => sum + i.quantity,
      0,
    );
    const totalReturnedQty = Object.values(alreadyReturned).reduce((s, v) => s + v, 0) + returnLines.reduce((sum, i) => sum + i.quantity, 0);
    const isFullReturn = totalReturnedQty >= totalOriginalQty;

    if (isFullReturn) {
      originalSale.status = "returned";
      await originalSale.save({ session });
    }

    const refundNumber = `RFND-${Date.now()}`;

    // Attach the refund to the shift whose drawer is actually being adjusted:
    // the open shift of the cashier processing the return in this branch.
    // Fall back to the original sale's shift when none is open (non-cash
    // refunds never touch the drawer, and cash refunds processed without an
    // open shift cannot be reconciled anyway).
    const currentShift = await Shift.findOne({
      branchId: originalSale.branchId,
      cashierId: req.user._id,
      status: "open",
    }).session(session);

    const refund = await Refund.create(
      [
        {
          refundNumber,
          saleId: originalSale._id,
          branchId: originalSale.branchId,
          cashierId: req.user._id,
          items: returnLines,
          total: refundTotal,
          reason: reason || "",
          status: "completed",
          shiftId: (currentShift ? currentShift._id : originalSale.shiftId) || null,
          paymentMethod: originalSale.paymentMethod || "cash",
        },
      ],
      { session },
    );

    await InventoryLog.insertMany(
      returnLines.map((line) => ({
        productId: line.productId,
        branchId: originalSale.branchId,
        type: "return",
        change: line.quantity,
        referenceId: refund[0]._id,
        userId: req.user._id,
        reason: reason || `Return for sale ${originalSale.saleNumber}`,
      })),
      { session },
    );

    await session.commitTransaction();

    res.status(201).json({
      status: "success",
      msg: isFullReturn
        ? "Return completed - original sale marked as returned"
        : "Partial return completed",
      data: {
        refund: refund[0],
        originalSale: {
          _id: originalSale._id,
          saleNumber: originalSale.saleNumber,
          status: originalSale.status,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Create Return Error:", error);

    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ status: "failed", msg: "Invalid sale ID format" });
    }

    res.status(500).json({
      status: "failed",
      msg: "Failed to process return",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

const getSales = async (req, res) => {
  try {
    const {
      branchId: requestedBranchId,
      from,
      to,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // consistent scope rules: scoped roles are locked to their own branch,
    // super_admin may filter a specific branch or view all branches
    let branchId;
    try {
      branchId = resolveBranchScope(req.user, requestedBranchId);
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        status: "failed",
        msg: err.message,
      });
    }

    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { saleNumber: { $regex: search, $options: "i" } },
        { "customerInfo.name": { $regex: search, $options: "i" } },
      ];
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (
      (from && isNaN(new Date(from).getTime())) ||
      (to && isNaN(new Date(to).getTime()))
    ) {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid date format. Use ISO 8601 (e.g. 2024-01-01)",
      });
    }

    const skip = (page - 1) * limit;

    const sales = await Sale.find(filter)
      .populate("branchId", "name code")
      .populate("cashierId", "name email")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Sale.countDocuments(filter);

    res.status(200).json({
      status: "success",
      count: sales.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: sales,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid filter ID format",
      });
    }

    console.error("Get Sales Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch sales",
      error: error.message,
    });
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("branchId", "name code")
      .populate("cashierId", "name email")
      .populate("customerId", "name phone email");

    if (!sale) {
      return res.status(404).json({
        status: "failed",
        msg: "Sale not found",
      });
    }

    try {
      assertBranchAccess(req.user, sale.branchId._id ? sale.branchId._id.toString() : sale.branchId.toString());
    } catch (err) {
      return res.status(err.statusCode || 403).json({
        status: "failed",
        msg: err.message,
      });
    }

    res.status(200).json({
      status: "success",
      data: sale,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid sale ID format",
      });
    }

    console.error("Get Sale By ID Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch sale",
      error: error.message,
    });
  }
};

const getSalesSummary = async (req, res) => {
  try {
    const { branchId: requestedBranchId, from, to } = req.query;

    // branch access control: scoped roles can only summarize their own branch,
    // super_admin can filter a specific branch or see the org-wide summary
    let branchId;
    try {
      branchId = resolveBranchScope(req.user, requestedBranchId);
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        status: "failed",
        msg: err.message,
      });
    }

    const filter = { status: "completed" };

    if (branchId) filter.branchId = branchId;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (
      (from && isNaN(new Date(from).getTime())) ||
      (to && isNaN(new Date(to).getTime()))
    ) {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid date format. Use ISO 8601 (e.g. 2024-01-01)",
      });
    }

    const [summary] = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalTax: { $sum: "$tax" },
          totalDiscount: { $sum: "$discount" },
          totalTransactions: { $sum: 1 },
          totalItemsSold: {
            $sum: {
              $sum: "$items.quantity",
            },
          },
        },
      },
    ]);

    const byPaymentMethod = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$paymentMethod",
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        totalRevenue: summary ? summary.totalRevenue : 0,
        totalTax: summary ? summary.totalTax : 0,
        totalDiscount: summary ? summary.totalDiscount : 0,
        totalTransactions: summary ? summary.totalTransactions : 0,
        totalItemsSold: summary ? summary.totalItemsSold : 0,
        averageTransactionValue:
          summary && summary.totalTransactions > 0
            ? (summary.totalRevenue / summary.totalTransactions).toFixed(2)
            : 0,
        byPaymentMethod,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid branch ID format",
      });
    }

    console.error("Get Sales Summary Error:", error);
    res.status(500).json({
      status: "failed",
      msg: "Failed to fetch sales summary",
      error: error.message,
    });
  }
};

module.exports = {
  createSale,
  createReturn,
  getSales,
  getSaleById,
  getSalesSummary,
};
