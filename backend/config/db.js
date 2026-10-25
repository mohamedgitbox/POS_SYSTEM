require("dotenv").config();

const mongoose = require("mongoose");
const mongo_uri = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongo_uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
