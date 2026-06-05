const Task = require('../models/Task');
const asyncHandler = require('../middleware/asyncHandler');

const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, subject, search, sort = '-createdAt' } = req.query;
  const filter = { userId: req.user._id };

  if (status && status !== 'all') filter.status = status;
  if (priority && priority !== 'all') filter.priority = priority;
  if (subject) filter.subject = subject;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const tasks = await Task.find(filter).sort(sort);
  res.json({ success: true, count: tasks.length, tasks });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.json({ success: true, task });
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, subject, deadline, priority, status, order } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const task = await Task.create({
    userId: req.user._id,
    title,
    description,
    subject,
    deadline,
    priority,
    status,
    order,
  });

  res.status(201).json({ success: true, task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  const fields = ['title', 'description', 'subject', 'deadline', 'priority', 'status', 'order'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) task[f] = req.body[f];
  });

  if (req.body.status === 'completed' && !task.completedAt) {
    task.completedAt = new Date();
  }
  if (req.body.status && req.body.status !== 'completed') {
    task.completedAt = undefined;
  }

  await task.save();
  res.json({ success: true, task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.json({ success: true, message: 'Task removed' });
});

const reorderTasks = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{id, status, order}, ...]
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'items array required' });
  }

  await Promise.all(
    items.map((item) =>
      Task.updateOne(
        { _id: item.id, userId: req.user._id },
        { $set: { order: item.order, status: item.status } }
      )
    )
  );

  res.json({ success: true, message: 'Order updated' });
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
};
