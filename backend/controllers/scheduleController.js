const Schedule = require('../models/Schedule');
const asyncHandler = require('../middleware/asyncHandler');

const getSchedules = asyncHandler(async (req, res) => {
  const { from, to, subject } = req.query;
  const filter = { userId: req.user._id };
  if (subject) filter.subject = subject;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const schedules = await Schedule.find(filter).sort({ date: 1, startTime: 1 });
  res.json({ success: true, count: schedules.length, schedules });
});

const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findOne({ _id: req.params.id, userId: req.user._id });
  if (!schedule) return res.status(404).json({ success: false, message: 'Session not found' });
  res.json({ success: true, schedule });
});

const createSchedule = asyncHandler(async (req, res) => {
  const { title, subject, date, startTime, endTime, color, notes } = req.body;
  if (!title || !date || !startTime || !endTime) {
    return res
      .status(400)
      .json({ success: false, message: 'title, date, startTime, endTime are required' });
  }

  const schedule = await Schedule.create({
    userId: req.user._id,
    title,
    subject: subject || 'General',
    date,
    startTime,
    endTime,
    color: color || 'indigo',
    notes: notes || '',
  });

  res.status(201).json({ success: true, schedule });
});

const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findOne({ _id: req.params.id, userId: req.user._id });
  if (!schedule) return res.status(404).json({ success: false, message: 'Session not found' });

  const fields = ['title', 'subject', 'date', 'startTime', 'endTime', 'color', 'notes', 'completed'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) schedule[f] = req.body[f];
  });

  await schedule.save();
  res.json({ success: true, schedule });
});

const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!schedule) return res.status(404).json({ success: false, message: 'Session not found' });
  res.json({ success: true, message: 'Session removed' });
});

module.exports = {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
