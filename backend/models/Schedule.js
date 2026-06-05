const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
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
      maxlength: 160,
    },
    subject: {
      type: String,
      default: 'General',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    color: {
      type: String,
      default: 'indigo',
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

scheduleSchema.index({ userId: 1, date: 1 });

scheduleSchema.virtual('durationMinutes').get(function () {
  if (!this.startTime || !this.endTime) return 0;
  const [sh, sm] = this.startTime.split(':').map(Number);
  const [eh, em] = this.endTime.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
});

scheduleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
