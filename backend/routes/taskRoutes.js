const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getTasks).post(createTask);
router.post('/reorder', reorderTasks);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;
