const express = require('express');
const { getDueCards, submitReview, getStats } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/due', getDueCards);
router.post('/:snippetId', submitReview);
router.get('/stats', getStats);

module.exports = router;
