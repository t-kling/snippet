const express = require('express');
const { getDueCards, submitReview, getStats, clearSpacedRepetitionData } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/due', getDueCards);
router.get('/stats', getStats);
router.post('/clear-data', clearSpacedRepetitionData);
router.post('/:snippetId', submitReview);

module.exports = router;
