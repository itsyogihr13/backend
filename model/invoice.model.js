const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  invoiceDate: Date,
  invoiceNumber: String,
  invoiceAmount: Number,
  financialYear: String,
});

const InvoiceModel = mongoose.model("invoice", invoiceSchema);

module.exports = { InvoiceModel };
