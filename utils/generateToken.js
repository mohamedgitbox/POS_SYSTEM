const path = require('path')
require("dotenv").config({path: path.join(__dirname, '../.env')});
const jwt = require("jsonwebtoken");



const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;