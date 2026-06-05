const fs = require('fs');
const path = require('path');
const Note = require('../models/Note');
const asyncHandler = require('../middleware/asyncHandler');

const buildFileMeta = (req, file) => {
  if (!file) return null;
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: `/uploads/${file.filename}`,
  };
};

const getNotes = asyncHandler(async (req, res) => {
  const { subject, search, sort = '-pinned -updatedAt' } = req.query;
  const filter = { userId: req.user._id };
  if (subject) filter.subject = subject;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }
  const notes = await Note.find(filter).sort(sort);
  res.json({ success: true, count: notes.length, notes });
});

const getNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  res.json({ success: true, note });
});

const createNote = asyncHandler(async (req, res) => {
  const { title, content, subject, tags, color, pinned } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const note = await Note.create({
    userId: req.user._id,
    title,
    content: content || '',
    subject: subject || 'General',
    tags: Array.isArray(tags) ? tags : tags ? String(tags).split(',').map((t) => t.trim()) : [],
    color: color || 'indigo',
    pinned: pinned === true || pinned === 'true',
    file: buildFileMeta(req, req.file) || undefined,
  });

  res.status(201).json({ success: true, note });
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

  const { title, content, subject, tags, color, pinned, removeFile } = req.body;

  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  if (subject !== undefined) note.subject = subject;
  if (color !== undefined) note.color = color;
  if (pinned !== undefined) note.pinned = pinned === true || pinned === 'true';
  if (tags !== undefined) {
    note.tags = Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim()).filter(Boolean);
  }

  if (removeFile === 'true' || removeFile === true) {
    if (note.file?.filename) {
      const p = path.join(__dirname, '..', 'uploads', note.file.filename);
      fs.existsSync(p) && fs.unlinkSync(p);
    }
    note.file = undefined;
  }

  if (req.file) {
    if (note.file?.filename) {
      const p = path.join(__dirname, '..', 'uploads', note.file.filename);
      fs.existsSync(p) && fs.unlinkSync(p);
    }
    note.file = buildFileMeta(req, req.file);
  }

  await note.save();
  res.json({ success: true, note });
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  if (note.file?.filename) {
    const p = path.join(__dirname, '..', 'uploads', note.file.filename);
    fs.existsSync(p) && fs.unlinkSync(p);
  }
  res.json({ success: true, message: 'Note removed' });
});

module.exports = { getNotes, getNote, createNote, updateNote, deleteNote };
