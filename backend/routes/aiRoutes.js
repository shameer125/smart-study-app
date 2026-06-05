const express = require('express');
const router = express.Router();
const {
  chat,
  getConversations,
  getConversation,
  deleteConversation,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/chat', chat);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);

module.exports = router;
