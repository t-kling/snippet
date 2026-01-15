const express = require('express');
const { performOCR, getTopicSuggestions, performSearch, getClozeSuggestions, cleanupText } = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/ocr', authMiddleware, performOCR);
router.post('/suggest-topics', authMiddleware, getTopicSuggestions);
router.post('/search', authMiddleware, performSearch);
router.post('/suggest-cloze', authMiddleware, getClozeSuggestions);
router.post('/cleanup-text', authMiddleware, cleanupText);

module.exports = router;
