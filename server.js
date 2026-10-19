require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// DB Connect
connectDB();

const app = express();

// Middlewares 
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); 

//  API Routes
app.use('/api/auth', require('./routes/authRoutes'));       
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));

// the main route
app.get('/', (req, res) => {
  res.send('POS API is running...');
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
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});