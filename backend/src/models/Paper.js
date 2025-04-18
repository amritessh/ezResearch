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

  pageCount: {
    type: Number
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

PaperSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Paper', PaperSchema);
