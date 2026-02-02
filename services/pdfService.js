const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');
const ejs = require('ejs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const OUTPUT_DIR = path.join(__dirname, '../public/documents');
const TEMPLATE_PATH = path.join(__dirname, '../templates/template.ejs');

// Ensure output directory exists
const ensureDirExists = async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }
};

// PDF options
const pdfOptions = {
  format: 'A4',
  border: {
    top: '1in',
    right: '0.5in',
    bottom: '1in',
    left: '0.5in'
  }
};

// Generate PDF from template and data
const generatePdf = async (data) => {
  try {
    await ensureDirExists();

    // Read the EJS template
    const template = await readFile(TEMPLATE_PATH, 'utf8');
    
    // Render template with data
    const html = ejs.render(template, { 
      ...data,
      date: data.date || new Date().toLocaleDateString('en-IN')
    });

    // Generate PDF
    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
        if (err) return reject(err);
        resolve(buffer);
      });
    });

    // Save PDF to file
    const fileName = `annexure_${Date.now()}.pdf`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    await writeFile(filePath, pdfBuffer);

    return {
      pdfPath: filePath,
      fileName: fileName,
      pdfBuffer: pdfBuffer  // Return buffer for direct download
    };

  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

module.exports = {
  generatePdf
};