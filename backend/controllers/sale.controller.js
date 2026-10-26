const mongoose = require("mongoose");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Sale = require("../models/Sale");

const createSale = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      status: "failed",
      msg: "Unauthorized: No user found. Please check your token.",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      branchId,
      customerId,
      items,
      paymentMethod,
      tax = 0,
      discount = 0,
    } = req.body;
    const cashierId = req.user._id;

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

    for (const item of items) {
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

    for (const item of items) {
      await Inventory.findOneAndUpdate(
        { productId: item.productId, branchId: branchId },
        { $inc: { quantity: -item.quantity } },
        { session },
      );
    }

    const total = subtotal + tax - discount;
    const saleNumber = `SALE-${Date.now()}`;

    const newSale = await Sale.create(
      [
        {
          saleNumber,
          branchId,
          cashierId,
          customerId: customerId || null,
          items: saleItems,
          subtotal,
          tax,
          discount,
          total,
          paymentMethod: paymentMethod || "cash",
          status: "completed",
        },
      ],
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

const getSales = async (req, res) => {
  try {
    const { branchId, from, to, status, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

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
    const { branchId, from, to } = req.query;

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
  getSales,
  getSaleById,
  getSalesSummary,
};
