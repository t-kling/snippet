const express = require('express');
const {
  createSnippet,
  getSnippets,
  getSnippet,
  updateSnippet,
  deleteSnippet,
  toggleQueue,
  toggleNeedsWork,
  getSources,
  exportLibrary,
  importLibrary,
  bulkUpdatePriority,
} = require('../controllers/snippetController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', createSnippet);
router.get('/', getSnippets);
router.get('/sources', getSources);
router.get('/export', exportLibrary);
router.post('/import', importLibrary);
router.post('/bulk-priority', bulkUpdatePriority);
router.get('/:id', getSnippet);
router.put('/:id', updateSnippet);
router.delete('/:id', deleteSnippet);
router.patch('/:id/queue', toggleQueue);
router.patch('/:id/needs-work', toggleNeedsWork);

module.exports = router;
