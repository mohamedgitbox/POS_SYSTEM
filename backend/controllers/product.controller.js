const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

const getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    console.error('Get All Products Error:', error);
    res.status(500).json({
      status: 'failed',
      msg: 'Failed to fetch products',
      error: error.message
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        status: 'failed',
        msg: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'failed',
        msg: 'Invalid product ID format'
      });
    }

    console.error('Get Product By ID Error:', error);
    res.status(500).json({
      status: 'failed',
      msg: 'Failed to fetch product',
      error: error.message
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, sku, barcode, category, price, cost, description, image, unit } = req.body;

    if (!name || !category || price == null || cost == null) {
      return res.status(400).json({
        status: 'failed',
        msg: 'Please provide name, category, price, and cost'
      });
    }

    if (sku) {
      const existingSku = await Product.findOne({ sku });
      if (existingSku) {
        return res.status(409).json({
          status: 'failed',
          msg: 'SKU already exists'
        });
      }
    }

    if (barcode) {
      const existingBarcode = await Product.findOne({ barcode });
      if (existingBarcode) {
        return res.status(409).json({
          status: 'failed',
          msg: 'Barcode already exists'
        });
      }
    }

    const product = await Product.create({
      name,
      sku,
      barcode,
      category,
      price,
      cost,
      description,
      image,
      unit,
      createdBy: req.user ? req.user._id : null,
    });

    res.status(201).json({
      status: 'success',
      msg: 'Product created successfully',
      data: product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'failed',
        msg: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        status: 'failed',
        msg: 'SKU or Barcode already exists'
      });
    }

    console.error('Create Product Error:', error);
    res.status(500).json({
      status: 'failed',
      msg: 'Failed to create product',
      error: error.message
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        status: 'failed',
        msg: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      msg: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'failed',
        msg: 'Invalid product ID format'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'failed',
        msg: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        status: 'failed',
        msg: 'SKU or Barcode already exists'
      });
    }

    console.error('Update Product Error:', error);
    res.status(500).json({
      status: 'failed',
      msg: 'Failed to update product',
      error: error.message
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        status: 'failed',
        msg: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      msg: 'Product deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'failed',
        msg: 'Invalid product ID format'
      });
    }

    console.error('Delete Product Error:', error);
    res.status(500).json({
      status: 'failed',
      msg: 'Failed to delete product',
      error: error.message
    });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const products = await Product.find({ category });

    res.status(200).json({
      status: 'success',
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get Products By Category Error:', error);
    res.status(500).json({
      status: 'failed',
      msg: 'Failed to fetch products by category',
      error: error.message
    });
  }
};

/**
 * lookupProduct
 * POS-scanning fast path: resolve a product by barcode or SKU and include the
 * live stock count for a branch in a single round-trip. Both parameters are
 * optional; at least one must be supplied.
 */
const lookupProduct = async (req, res) => {
  try {
    const { barcode, sku, branchId } = req.query;

    if (!barcode && !sku) {
      return res.status(400).json({
        status: 'failed',
        msg: 'Provide at least one of: barcode, sku',
      });
    }

    const filter = {};
    if (barcode) filter.barcode = barcode;
    if (sku) filter.sku = sku.toUpperCase();

    const product = await Product.findOne(filter);

    if (!product) {
      return res.status(404).json({
        status: 'failed',
        msg: 'Product not found',
      });
    }

    let stock = null;
    if (branchId) {
      stock = await Inventory.findOne({
        productId: product._id,
        branchId,
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        product,
        stock: stock
          ? { quantity: stock.quantity, reserved: stock.reserved, available: stock.quantity - stock.reserved }
          : { quantity: 0, available: 0 },
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'failed',
        msg: 'Invalid branch ID format',
      });
    }

    console.error('Lookup Product Error:', error);
    res.status(500).json({
      status: 'failed',
      msg: 'Failed to look up product',
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  lookupProduct,
};