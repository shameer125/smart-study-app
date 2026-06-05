const Task = require('../models/Task');
const Schedule = require('../models/Schedule');
const Note = require('../models/Note');
const FocusSession = require('../models/FocusSession');
const asyncHandler = require('../middleware/asyncHandler');

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const overview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = startOfDay(new Date());
  const sevenAgo = new Date(today);
  sevenAgo.setDate(sevenAgo.getDate() - 6);

  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    notesCount,
    schedulesThisWeek,
    focusToday,
    focusLast7,
  ] = await Promise.all([
    Task.countDocuments({ userId }),
    Task.countDocuments({ userId, status: 'completed' }),
    Task.countDocuments({ userId, status: 'pending' }),
    Task.countDocuments({ userId, status: 'in-progress' }),
    Note.countDocuments({ userId }),
    Schedule.countDocuments({ userId, date: { $gte: sevenAgo } }),
    FocusSession.aggregate([
      { $match: { userId, type: 'focus', completedAt: { $gte: today } } },
      { $group: { _id: null, minutes: { $sum: '$durationMinutes' } } },
    ]),
    FocusSession.aggregate([
      { $match: { userId, type: 'focus', completedAt: { $gte: sevenAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          minutes: { $sum: '$durationMinutes' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const series = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const match = focusLast7.find((x) => x._id === key);
    series.push({
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: match ? match.minutes : 0,
      hours: match ? +(match.minutes / 60).toFixed(2) : 0,
    });
  }

  const focusTodayMinutes = focusToday?.[0]?.minutes || 0;

  res.json({
    success: true,
    stats: {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      notesCount,
      schedulesThisWeek,
      focusTodayMinutes,
      focusTodayHours: +(focusTodayMinutes / 60).toFixed(2),
      streak: req.user.streak,
    },
    series,
  });
});

const subjectBreakdown = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [tasksBySubject, sessionsBySubject] = await Promise.all([
    Task.aggregate([
      { $match: { userId } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    FocusSession.aggregate([
      { $match: { userId, type: 'focus' } },
      { $group: { _id: '$subject', minutes: { $sum: '$durationMinutes' } } },
      { $sort: { minutes: -1 } },
    ]),
  ]);

  res.json({ success: true, tasksBySubject, sessionsBySubject });
});

const logFocusSession = asyncHandler(async (req, res) => {
  const { subject, durationMinutes, type } = req.body;
  if (!durationMinutes || durationMinutes < 1) {
    return res.status(400).json({ success: false, message: 'durationMinutes is required' });
  }
  const session = await FocusSession.create({
    userId: req.user._id,
    subject: subject || 'General',
    durationMinutes,
    type: type || 'focus',
  });

  // Update streak
  const today = startOfDay(new Date());
  const user = req.user;
  const last = user.streak?.lastActive ? startOfDay(user.streak.lastActive) : null;
  if (!last || last.getTime() !== today.getTime()) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (last && last.getTime() === yesterday.getTime()) {
      user.streak.current = (user.streak.current || 0) + 1;
    } else {
      user.streak.current = 1;
    }
    user.streak.best = Math.max(user.streak.best || 0, user.streak.current);
    user.streak.lastActive = today;
    await user.save();
  }

  res.status(201).json({ success: true, session, streak: user.streak });
});

const recentFocus = asyncHandler(async (req, res) => {
  const sessions = await FocusSession.find({ userId: req.user._id })
    .sort({ completedAt: -1 })
    .limit(20);
  res.json({ success: true, sessions });
});

module.exports = { overview, subjectBreakdown, logFocusSession, recentFocus };
