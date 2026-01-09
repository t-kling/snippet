const express = require('express');
const { getTopics, createTopic } = require('../controllers/topicController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', getTopics);
router.post('/', createTopic);

module.exports = router;
