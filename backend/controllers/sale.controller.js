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

module.exports = { createSale };
