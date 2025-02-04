const estimateModel = require("../models/estimateModel");
const estimateHistoryModel = require("../models/estimateHistoryModel");
const ReceivePayment = require("../models/receivePaymentModel");

const addEstimateController = async (req, res) => {
  try {
    // const {created}
    const estimate = await estimateModel.findOne({
      estimateId: req.body.estimateId,
    });
    if (estimate) {
      return res
        .status(201)
        .send({ success: false, message: "Estimate Id Already Found" });
    }

    if (req.body.status === "paid") {
      req.body.advancePayment = req.body.grandTotal - req.body.discount;
      req.body.balancePayment = 0;
    }

    let iLength = await estimateModel.findOne().sort({ createdAt: -1 });
    iLength = iLength.estimateId;
    const newId = `ES${parseInt(iLength.replace("ES", ""), 10) + 1}`
    const newInvoice = new estimateModel({
      ...req.body,
      estimateId: newId,
    });
    await newInvoice.save();
    const newEstimateHistory = new estimateHistoryModel({
      ...req.body,
      discount: req.body.discount,
      paymentGiven: req.body.advancePayment,
      estimateId: newId,
    });
    await newEstimateHistory.save();

    if (newInvoice.advancePayment > 0) {
      const payment = await ReceivePayment.create({
        estimateId: newInvoice.id,
        paymentAmount: newInvoice.advancePayment,
        paymentMethod,
        paymentDate: newInvoice.createdAt,
      });
    }
    return res
      .status(200)
      .send({ success: true, message: "Estimate Added Successful" });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      success: false,
    });
  }
};

const updateEsimateController = async (req, res) => {
  try {
    const invoice = await estimateModel.findOne({
      estimateId: req.body.estimateId,
    });
    if (!invoice) {
      return res
        .status(201)
        .send({ success: false, message: "Estimate Not Found" });
    }

    if (req.body.status === "paid") {
      req.body.advancePayment = invoice.totalValue - req.body.discount;
      req.body.balancePayment = 0;
    }
    const updateInvoice = await estimateModel.findOneAndUpdate(
      {
        estimateId: req.body.estimateId,
      },
      { $set: req.body },
      { new: true }
    );
    if (!updateInvoice) {
      return res
        .status(202)
        .send({ success: false, message: "Failed to update" });
    }

    const paid =
      parseInt(req.body.advancePayment) - parseInt(invoice.advancePayment);

    const newEstimateHistory = new estimateHistoryModel({
      ...req.body,
      discount: req.body.discount,
      paymentGiven: paid,
      updatedAt: req.body.invoice.createdAt,
    });
    await newEstimateHistory.save();

    return res
      .status(200)
      .send({ success: true, message: "Invoice Updated Successfull" });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      success: false,
    });
  }
};

const getAllEsimateController = async (req, res) => {
  try {
    const invoices = await estimateModel.find({});
    if (invoices.length === 0) {
      return res
        .status(201)
        .send({ success: false, message: "No Estimate Found" });
    }
    return res.status(200).send({
      success: true,
      message: "Invoice Fetched Success",
      data: invoices,
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      success: false,
    });
  }
};

const getEsimateByIdController = async (req, res) => {
  try {
    const invoice = await estimateModel.findOne({
      estimateId: req.body.estimateId,
    });
    if (!invoice) {
      return res
        .status(201)
        .send({ success: false, message: "No Estimate Found" });
    }
    return res.status(200).send({
      success: true,
      message: "Estimate Fetched Success",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      success: false,
    });
  }
};

const getAllEstimateHistoryController = async (req, res) => {
  try {
    const invoice = await estimateHistoryModel.find({});
    if (invoice.length === 0) {
      return res
        .status(201)
        .send({ success: false, message: "No Estimate History Found" });
    }
    return res.status(200).send({
      success: true,
      message: "Estimate History Fetched Success",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      success: false,
    });
  }
};

const deleteEstimateHistoryController = async (req, res) => {
  try {
    const invoice = await estimateHistoryModel.findOne({ _id: req.body.id });
    if (!invoice) {
      return res
        .status(201)
        .send({ success: false, message: "No Estimate History Found" });
    }
    const deleteHistory = await estimateHistoryModel.findOneAndDelete({
      _id: req.body.id,
    });
    if (!deleteHistory) {
      return res.status(202).send({
        success: false,
        message: "Failed to delete",
      });
    }
    return res.status(200).send({
      success: true,
      message: "Estimate History Deleted",
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      success: false,
    });
  }
};


module.exports = {
  addEstimateController,
  updateEsimateController,
  getAllEsimateController,
  getEsimateByIdController,
  getAllEstimateHistoryController,
  deleteEstimateHistoryController,
};
