const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: { type: String, default: 'General' },
    durationMinutes: { type: Number, required: true },
    type: {
      type: String,
      enum: ['focus', 'short-break', 'long-break'],
      default: 'focus',
    },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

focusSessionSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('FocusSession', focusSessionSchema);
