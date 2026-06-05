const express = require('express');
const router = express.Router();
const {
  overview,
  subjectBreakdown,
  logFocusSession,
  recentFocus,
} = require('../controllers/statsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/overview', overview);
router.get('/subjects', subjectBreakdown);
router.post('/focus', logFocusSession);
router.get('/focus', recentFocus);

module.exports = router;
