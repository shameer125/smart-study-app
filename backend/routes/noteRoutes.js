const express = require('express');
const router = express.Router();
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/').get(getNotes).post(upload.single('file'), createNote);
router
  .route('/:id')
  .get(getNote)
  .put(upload.single('file'), updateNote)
  .delete(deleteNote);

module.exports = router;
