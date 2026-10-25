const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Branch = require('../models/Branch');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const PurchaseOrder = require('../models/PurchaseOrder');
const Transfer = require('../models/Transfer');

// Safety check to ensure all models are properly exported
const models = { User, Branch, Product, Inventory, Customer, Sale, PurchaseOrder, Transfer };
for (const [name, model] of Object.entries(models)) {
  if (typeof model.deleteMany !== 'function') {
    console.error(`Critical error: Model ${name} was not properly exported from its file.`);
    console.error(`Make sure to include: module.exports = mongoose.model('${name}', ...schema);`);
    process.exit(1);
  }
}

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pos_system');
    console.log('Successfully connected to the database...');
  } catch (err) {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  }
};

// Seed database function
const seedDatabase = async () => {
  try {
    console.log('Clearing old data and indexes to ensure no conflicts...');
    
    // Helper function to drop collection completely (better than deleteMany as it removes old indexes too)
    const dropCollection = async (model) => {
      try {
        await model.collection.drop();
      } catch (err) {
        // Ignore error if collection doesn't exist yet in the database
        if (err.codeName !== 'NamespaceNotFound') {
          console.warn(`Warning when clearing collection ${model.modelName}:`, err.message);
        }
      }
    };

    // Deletion order is important due to relationships (delete dependent tables first)
    await dropCollection(Transfer);
    await dropCollection(Sale);
    await dropCollection(PurchaseOrder);
    await dropCollection(Inventory);
    await dropCollection(Customer);
    await dropCollection(Product);
    await dropCollection(User);
    await dropCollection(Branch);
    
    console.log('Successfully cleared old data and indexes.');


    // 1. Create branches
    console.log('Creating branches...');
    const branch1 = await Branch.create({
      name: 'Main Branch',
      code: 'MAIN01',
      address: { street: '123 Liberation Street', city: 'Cairo', state: 'Cairo', country: 'Egypt', postalCode: '11511' },
      phone: '02-12345678',
      email: 'main@pos.com',
      isActive: true
    });

    const branch2 = await Branch.create({
      name: 'Downtown Branch',
      code: 'DOWN02',
      address: { street: '456 Victory Street', city: 'Alexandria', state: 'Alexandria', country: 'Egypt', postalCode: '21500' },
      phone: '03-87654321',
      email: 'downtown@pos.com',
      isActive: true
    });

    // 2. Create users
    console.log('Creating users...');
    const superAdmin = await User.create({
      name: 'General Manager',
      email: 'admin@pos.com',
      password: "password123",
      role: 'super_admin',
      isActive: true
    });

    const manager1 = await User.create({
      name: 'Main Branch Manager',
      email: 'manager1@pos.com',
      password: "password123",
      role: 'branch_manager',
      branchId: branch1._id,
      isActive: true
    });

    const cashier1 = await User.create({
      name: 'Cashier 1',
      email: 'cashier1@pos.com',
      password: "password123",
      role: 'cashier',
      branchId: branch1._id,
      isActive: true
    });

    // Update branch manager in branch record
    branch1.managerId = manager1._id;
    await branch1.save();

    // 3. Create products
    console.log('Creating products...');
    const product1 = await Product.create({
      name: 'HP Laptop 15',
      sku: 'LAP-HP-15',
      barcode: '1234567890123',
      category: 'electronics',
      price: 15000,
      cost: 12000,
      description: '15-inch laptop, 8GB RAM, 512GB SSD',
      unit: 'pcs',
      createdBy: superAdmin._id
    });

    const product2 = await Product.create({
      name: 'Wireless Mouse',
      sku: 'MOUSE-WL-01',
      barcode: '9876543210987',
      category: 'electronics',
      price: 250,
      cost: 150,
      description: 'Comfortable wireless mouse for daily use',
      unit: 'pcs',
      createdBy: superAdmin._id
    });

    const product3 = await Product.create({
      name: 'Office Chair',
      sku: 'CHR-OFF-01',
      barcode: '5555555555555',
      category: 'furniture',
      price: 1200,
      cost: 800,
      description: 'Comfortable office chair with back support',
      unit: 'pcs',
      createdBy: superAdmin._id
    });

    // 4. Create inventory records
    console.log('Creating inventory records...');
    await Inventory.create([
      { productId: product1._id, branchId: branch1._id, quantity: 50, reorderLevel: 10, reserved: 0 },
      { productId: product2._id, branchId: branch1._id, quantity: 200, reorderLevel: 20, reserved: 5 },
      { productId: product3._id, branchId: branch1._id, quantity: 30, reorderLevel: 5, reserved: 0 },
      { productId: product1._id, branchId: branch2._id, quantity: 20, reorderLevel: 10, reserved: 0 },
      { productId: product2._id, branchId: branch2._id, quantity: 100, reorderLevel: 20, reserved: 0 }
    ]);

    // 5. Create customers
    console.log('Creating customers...');
    const customer1 = await Customer.create({
      name: 'Ahmed Mohamed',
      phone: '01012345678',
      email: 'ahmed@example.com',
      address: '789 Customer Street, Cairo',
      branchId: branch1._id,
      createdBy: cashier1._id,
      isActive: true
    });

    // 6. Create purchase orders
    console.log('Creating purchase orders...');
    await PurchaseOrder.create({
      poNumber: 'PO-2023-001',
      supplierName: 'Tech Supplies Company',
      branchId: branch1._id,
      createdBy: manager1._id,
      items: [
        { productId: product1._id, orderedQty: 20, unitCost: 12000 },
        { productId: product2._id, orderedQty: 100, unitCost: 150 }
      ],
      totalCost: 255000,
      status: 'received'
    });

    // 7. Create sales
    console.log('Creating sales transactions...');
    await Sale.create({
      saleNumber: 'SALE-2023-001',
      branchId: branch1._id,
      cashierId: cashier1._id,
      customerId: customer1._id,
      customerInfo: { name: customer1.name, phone: customer1.phone },
      items: [
        { productId: product1._id, productName: product1.name, quantity: 1, unitPrice: 15000, totalPrice: 15000 },
        { productId: product2._id, productName: product2.name, quantity: 2, unitPrice: 250, totalPrice: 500 }
      ],
      subtotal: 15500,
      tax: 2170, // 14% tax as example
      discount: 0,
      total: 17670,
      paymentMethod: 'card',
      status: 'completed'
    });

    // 8. Create inventory transfers
    console.log('Creating inventory transfers...');
    await Transfer.create({
      transferNumber: 'TRF-2023-001',
      sourceBranchId: branch1._id,
      destinationBranchId: branch2._id,
      requestedBy: manager1._id,
      items: [
        { productId: product1._id, productName: product1.name, quantity: 5 },
        { productId: product2._id, productName: product2.name, quantity: 20 }
      ],
      totalItems: 2,
      status: 'in_transit',
      approvedBy: superAdmin._id
    });

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error occurred while seeding data:', error);
    process.exit(1);
  }
};

// Run the function
connectDB().then(() => {
  seedDatabase();
});