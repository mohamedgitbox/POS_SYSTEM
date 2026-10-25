const Branch = require("../models/Branch");

const root = (req, res) => {
    res.send("Hello, From Branch Root");
}

module.exports = {
    root
}