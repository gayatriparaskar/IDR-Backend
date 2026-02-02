const Annexure = require('../models/Annexure');
const { generatePdf } = require('../services/pdfService');
const path = require('path');

// @desc    Generate Annexure PDF
// @route   POST /api/generate-annexure
// @access  Public
exports.generateAnnexure = async (req, res, next) => {
  try {
    const data = req.body;

    // Generate PDF
    const { pdfPath, fileName, pdfBuffer } = await generatePdf(data);

    // Save to database
    const annexure = await Annexure.create({
      ...data,
      pdfPath
    });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF buffer directly
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Controller Error:', error);
    next(error);
  }
};

// @desc    Download Annexure PDF
// @route   GET /api/download/:id
// @access  Public
exports.downloadAnnexure = async (req, res, next) => {
  try {
    const annexure = await Annexure.findById(req.params.id);
    
    if (!annexure) {
      return res.status(404).json({
        success: false,
        error: 'Annexure not found'
      });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Annexure_${annexure.investorName.replace(/\s+/g, '_')}.pdf`);
    
    // Send the file
    res.sendFile(path.resolve(annexure.pdfPath));

  } catch (error) {
    console.error('Download Error:', error);
    next(error);
  }
};