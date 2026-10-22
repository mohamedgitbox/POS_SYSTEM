const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const Branch = require("../models/Branch");
const User = require("../models/User");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Sale = require("../models/Sale");
const Transfer = require("../models/Transfer");

const seedData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/pos_system",
    );
    console.log("Connected to DB for Seeding...");

    await Branch.deleteMany();
    await User.deleteMany();
    await Product.deleteMany();
    await Inventory.deleteMany();
    await Sale.deleteMany();
    await Transfer.deleteMany();
    console.log("Old data cleared.");

    const branches = await Branch.create([
      {
        name: "Main Branch",
        code: "MAIN-01",
        address: { street: "Tahrir Street", city: "Cairo", country: "Egypt" },
        phone: "01000000000",
        email: "main@pos.com",
      },
      {
        name: "Alex Branch",
        code: "ALEX-02",
        address: { street: "Corniche", city: "Alexandria", country: "Egypt" },
        phone: "01111111111",
        email: "alex@pos.com",
      },
      {
        name: "Mansoura Branch",
        code: "MAN-01",
        address: { street: "any", city: "Mansoura", country: "Egypt" },
        phone: "01211111111",
        email: "man@pos.com",
      },
    ]);

    const mainBranchId = branches[0]._id;
    const alexBranchId = branches[1]._id;

    const users = await User.create([
      {
        name: "System Admin",
        email: "admin@pos.com",
        password: "password123",
        role: "super_admin",
        branchId: mainBranchId,
      },
      {
        name: "Main Cashier",
        email: "cashier1@pos.com",
        password: "password123",
        role: "cashier",
        branchId: mainBranchId,
      },
    ]);

    const adminUser = users[0];

    const products = await Product.create([
      {
        name: "Wireless Bluetooth Earphones",
        sku: "ELEC-BT-01",
        barcode: "6221234567890",
        category: "electronics",
        price: 750,
        cost: 450,
        unit: "pcs",
        createdBy: adminUser._id,
      },
      {
        name: "Mens Cotton T-Shirt",
        sku: "CLTH-TS-02",
        barcode: "6221234567891",
        category: "clothing",
        price: 250,
        cost: 120,
        unit: "pcs",
        createdBy: adminUser._id,
      },
    ]);

    await Inventory.create([
      {
        productId: products[0]._id,
        branchId: mainBranchId,
        quantity: 20,
        reorderLevel: 5,
      },
      {
        productId: products[1]._id,
        branchId: mainBranchId,
        quantity: 50,
        reorderLevel: 10,
      },
      {
        productId: products[0]._id,
        branchId: alexBranchId,
        quantity: 8,
        reorderLevel: 3,
      },
    ]);

    console.log("Database Seeded Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
