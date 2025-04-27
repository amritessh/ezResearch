// backend/src/api/controllers/paperProcessingController.js
const Paper = require('../../models/Paper');
const { extractTextFromPDF } = require('../../services/pdf/extractor');
const {
  identifySections,
  analyzeCitations,
  identifyFigureReferences
} = require('../../services/pdf/structureAnalyzer');
const { createChunks } = require('../../services/pdf/chunker');
const s3Service = require('../../services/storage/s3Service');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Process a paper that has been uploaded
const processPaper = async paperId => {
  try {
    // Find paper in database
    const paper = await Paper.findById(paperId);
    if (!paper) {
      throw new Error(`Paper not found: ${paperId}`);
    }

    // Update status to processing
    paper.processedStatus = 'processing';
    await paper.save();

    // Create temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paperexplainer-'));
    const pdfPath = path.join(tempDir, `${paperId}.pdf`);

    // Download PDF from S3
    await s3Service.downloadFile(paper.fileKey, pdfPath);

    // Extract text and structure
    const extractedData = await extractTextFromPDF(pdfPath);

    // Analyze sections if not already provided by extractor
    if (!extractedData.sections || extractedData.sections.length === 0) {
      extractedData.sections = identifySections(extractedData.text);
    }

    // Identify citations and figures
    extractedData.citations = analyzeCitations(extractedData.text);
    extractedData.figures = identifyFigureReferences(extractedData.text);

    // Create chunks for further processing
    extractedData.chunks = createChunks(extractedData);

    // Save extracted data to S3
    const extractedDataPath = path.join(tempDir, `${paperId}-extracted.json`);
    fs.writeFileSync(extractedDataPath, JSON.stringify(extractedData, null, 2));

    const extractedDataKey = `extracted/${paperId}.json`;
    await s3Service.uploadFile(extractedDataPath, extractedDataKey);

    // Update paper record with extracted information
    paper.title = extractedData.metadata.title || paper.title;
    paper.authors = extractedData.metadata.author
      ? extractedData.metadata.author.split(',').map(a => a.trim())
      : [];
    paper.pageCount = extractedData.pageCount || 0;
    paper.extractedDataKey = extractedDataKey;
    paper.processedStatus = 'completed';
    paper.processedAt = new Date();

    await paper.save();

    // Clean up temp files
    fs.unlinkSync(pdfPath);
    fs.unlinkSync(extractedDataPath);
    fs.rmdirSync(tempDir);

    return {
      success: true,
      paperId,
      pageCount: paper.pageCount,
      sections: extractedData.sections.map(s => s.name)
    };
  } catch (error) {
    console.error(`Error processing paper ${paperId}:`, error);

    // Update paper status to failed
    const paper = await Paper.findById(paperId);
    if (paper) {
      paper.processedStatus = 'failed';
      paper.processingError = error.message;
      await paper.save();
    }

    throw error;
  }
};

// Get processed paper data
const getPaperData = async paperId => {
  try {
    // Find paper in database
    const paper = await Paper.findById(paperId);
    if (!paper) {
      throw new Error(`Paper not found: ${paperId}`);
    }

    // Check if paper has been processed
    if (paper.processedStatus !== 'completed') {
      return {
        success: false,
        paperId,
        status: paper.processedStatus,
        error: paper.processingError
      };
    }

    // Create temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paperexplainer-'));
    const extractedDataPath = path.join(tempDir, `${paperId}-extracted.json`);

    // Download extracted data from S3
    await s3Service.downloadFile(paper.extractedDataKey, extractedDataPath);

    // Read extracted data
    const extractedData = JSON.parse(
      fs.readFileSync(extractedDataPath, 'utf8')
    );

    // Generate presigned URL for PDF download
    const pdfUrl = await s3Service.generatePresignedUrl(paper.fileKey);

    // Clean up
    fs.unlinkSync(extractedDataPath);
    fs.rmdirSync(tempDir);

    return {
      success: true,
      paperId,
      title: paper.title,
      authors: paper.authors,
      pageCount: paper.pageCount,
      sections: extractedData.sections,
      pdfUrl
    };
  } catch (error) {
    console.error(`Error getting paper data ${paperId}:`, error);
    throw error;
  }
};

module.exports = {
  processPaper,
  getPaperData
};
