const mongoose = require('mongoose');

const PaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileKey: {
    type: String,
    required: true
  },
  // New fields
  authors: {
    type: [String],
    default: []
  },
  pageCount: {
    type: Number
  },
  extractedDataKey: {
    type: String
  },
  processingJobId: {
    type: String
  },
  processingError: {
    type: String
  },
  processedAt: {
    type: Date
  },
  processedStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
PaperSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
PaperSchema.index({ uploadedBy: 1, createdAt: -1 });
PaperSchema.index({ processedStatus: 1 });

module.exports = mongoose.model('Paper', PaperSchema);
