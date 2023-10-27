const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { InvoiceModel } = require("./model/invoice.model");
const { connection } = require("./config/db");
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://effulgent-axolotl-e21d3d.netlify.app",
    ],
  })
);
app.get("/invoices", async (req, res) => {
  try {
    const { financialYear, invoiceNumber, startDate, endDate } = req.query;
    const filter = {};

    if (financialYear) {
      filter.financialYear = financialYear;
    }

    if (invoiceNumber) {
      filter.invoiceNumber = invoiceNumber;
    }

    if (startDate && endDate) {
      filter.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const invoices = await InvoiceModel.find(filter);
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/invoice", async (req, res) => {
  try {
    const { invoiceDate, invoiceNumber, invoiceAmount } = req.body;
    const financialYear = categorizeFinancialYear(invoiceDate);
    const isInvoiceNumberUnique = await checkInvoiceNumberUniqueness(
      invoiceNumber,
      financialYear
    );

    const isInvoiceDateValid = await checkInvoiceDateValidity(
      invoiceDate,
      invoiceNumber
    );

    if (isInvoiceNumberUnique && isInvoiceDateValid) {
      const newInvoice = new InvoiceModel({
        invoiceDate,
        invoiceNumber,
        invoiceAmount,
        financialYear,
      });
      await newInvoice.save();
      res.status(200).json({ message: "Invoice saved successfully" });
    } else {
      res.status(400).json({
        message:
          "Invoice number already used for this financial year or invalid invoice date",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});
app.put("/invoices/:invoiceNumber", async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const { invoiceDate, invoiceAmount } = req.body;

    const updatedInvoice = await InvoiceModel.findOneAndUpdate(
      { invoiceNumber: invoiceNumber },
      { invoiceDate, invoiceAmount },
      { new: true }
    );

    if (updatedInvoice) {
      res.status(200).json(updatedInvoice);
    } else {
      res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});
app.delete("/invoices/:invoiceNumber", async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const deletedInvoice = await InvoiceModel.findOneAndDelete({
      invoiceNumber: invoiceNumber,
    });

    if (deletedInvoice) {
      res.status(200).json({ message: "Invoice deleted successfully" });
    } else {
      res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

function categorizeFinancialYear(invoiceDate) {
  const date = new Date(invoiceDate);
  const year = date.getFullYear();
  const nextYear = year + 1;
  const financialYear = `${year}-${nextYear.toString().slice(2)}`;
  return financialYear;
}
async function checkInvoiceNumberUniqueness(invoiceNumber, financialYear) {
  const existingInvoice = await InvoiceModel.findOne({
    invoiceNumber: invoiceNumber,
    financialYear: financialYear,
  });
  return !existingInvoice;
}

async function checkInvoiceDateValidity(invoiceDate, invoiceNumber) {
  const currentInvoice = await InvoiceModel.findOne({
    invoiceNumber: invoiceNumber,
  });

  if (!currentInvoice) {
    return true;
  }

  const previousInvoiceDate = currentInvoice.invoiceDate;
  const nextInvoice = await InvoiceModel.findOne({
    invoiceDate: { $gt: currentInvoice.invoiceDate },
  }).sort({ invoiceDate: 1 });

  if (nextInvoice) {
    const nextInvoiceDate = nextInvoice.invoiceDate;
    const date = new Date(invoiceDate);
    return date > previousInvoiceDate && date < nextInvoiceDate;
  }

  return invoiceDate > previousInvoiceDate;
}

app.listen(8081, async () => {
  try {
    await connection;
    console.log("Server is running on port 8081");
  } catch (error) {
    console.error("Error starting the server: ", error);
  }
  console.log("pot runing");
});
