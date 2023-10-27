require("dotenv").config();
const mongoose = require("mongoose");
const connection = mongoose.connect(
  `mongodb+srv://bhardwajy621:rathee143@cluster0.vx6twnz.mongodb.net/invoice`
);
module.exports = { connection };
