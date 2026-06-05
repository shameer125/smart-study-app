const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: 'General',
      trim: true,
    },
    tags: [{ type: String, trim: true }],
    color: {
      type: String,
      default: 'indigo',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    file: {
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      url: String,
    },
  },
  { timestamps: true }
);

noteSchema.index({ userId: 1, subject: 1 });
noteSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
