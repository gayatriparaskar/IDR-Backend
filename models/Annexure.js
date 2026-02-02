const mongoose = require('mongoose');

const annexureSchema = new mongoose.Schema({
  investorName: { type: String, required: true },
  investorId: { type: String, required: true },
  panAadhaar: { type: String, required: true },
  propertyId: { type: String, required: true },
  propertyName: { type: String, required: true },
  propertyType: { type: String, required: true },
  propertyAddress: { type: String, required: true },
  cityState: { type: String, required: true },
  llpName: { type: String, required: true },
  llpin: { type: String, required: true },
  totalValuation: { type: String, required: true },
  totalTokens: { type: String, required: true },
  investorTokens: { type: String, required: true },
  investAmount: { type: String, required: true },
  date: { type: Date, default: Date.now },
  pdfPath: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Annexure', annexureSchema);