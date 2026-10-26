require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

// DB Connect
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

//  API Routes
app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/users", require("./routes/user.route"));
app.use("/api/branches", require("./routes/branch.route"));
app.use("/api/products", require("./routes/product.route"));
app.use("/api/customers", require("./routes/customer.route"));
app.use("/api/inventory", require("./routes/inventory.route"));
app.use("/api/purchase-orders", require("./routes/purchaseOrder.route"));
app.use("/api/transfers", require("./routes/transfer.route"));
app.use("/api/sales", require("./routes/sale.route"));
app.use("/api/reports", require("./routes/report.route"));
app.use("/api/shifts", require("./routes/shift.route"));

// the main route
app.get("/", (req, res) => {
  res.send("POS API is running...");
});

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});
