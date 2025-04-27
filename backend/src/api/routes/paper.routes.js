// backend/src/api/routes/paper.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const Paper = require('../../models/Paper');
const {
  queuePaperProcessing,
  getJobStatus
} = require('../../services/queue/queueService');
const s3Service = require('../../services/storage/s3Service');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configure multer for memory storage
const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paperexplainer-'));
      cb(null, tempDir);
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Get all papers for current user
router.get('/', auth, async (req, res, next) => {
  try {
    const papers = await Paper.find({ uploadedBy: req.user.userId }).sort({
      createdAt: -1
    });

    res.status(200).json(papers);
  } catch (error) {
    next(error);
  }
});

// Upload a new paper
router.post('/upload', auth, upload.single('pdf'), async (req, res, next) => {
  try {
    // File should be available in req.file
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload file to S3
    const fileKey = `papers/${req.user.userId}/${Date.now()}-${req.file
      .originalname}`;
    const s3Url = await s3Service.uploadFile(req.file.path, fileKey);

    // Create a new paper document
    const paper = new Paper({
      title: req.file.originalname.replace('.pdf', ''),
      uploadedBy: req.user.userId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileKey: fileKey,
      processedStatus: 'pending'
    });

    await paper.save();

    // Queue paper for processing
    const job = await queuePaperProcessing(paper._id);

    // Store job ID for tracking
    paper.processingJobId = job.id;
    await paper.save();

    // Clean up temp file
    fs.unlinkSync(req.file.path);
    fs.rmdirSync(path.dirname(req.file.path));

    res.status(201).json({
      ...paper.toObject(),
      jobId: job.id
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific paper
router.get('/:id', auth, async (req, res, next) => {
  try {
    const paper = await Paper.findOne({
      _id: req.params.id,
      uploadedBy: req.user.userId
    });

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // If paper is completed, also generate a presigned URL for viewing
    if (paper.processedStatus === 'completed') {
      paper.viewUrl = await s3Service.generatePresignedUrl(paper.fileKey);
    }

    res.status(200).json(paper);
  } catch (error) {
    next(error);
  }
});

// Get processing status
router.get('/:id/status', auth, async (req, res, next) => {
  try {
    const paper = await Paper.findOne({
      _id: req.params.id,
      uploadedBy: req.user.userId
    });

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    let jobStatus = null;
    if (paper.processingJobId) {
      jobStatus = await getJobStatus(paper.processingJobId);
    }

    res.status(200).json({
      paperId: paper._id,
      status: paper.processedStatus,
      jobId: paper.processingJobId,
      jobStatus: jobStatus,
      error: paper.processingError
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
