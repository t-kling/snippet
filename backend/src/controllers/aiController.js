const { extractTextFromImage, suggestTopics, searchSnippets, suggestClozeKeywords, cleanupFormatting } = require('../services/aiService');
const db = require('../db');

const performOCR = async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const extractedText = await extractTextFromImage(imageData);

    res.json({ text: extractedText });
  } catch (error) {
    console.error('OCR endpoint error:', error);

    if (error.message.includes('API key not configured')) {
      return res.status(503).json({
        error: 'AI features are not configured. Please add your OpenAI API key to enable OCR.',
      });
    }

    res.status(500).json({ error: 'Failed to extract text from image' });
  }
};

const getTopicSuggestions = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get existing topics for the user
    const topicsResult = await db.query(
      'SELECT DISTINCT name FROM topics WHERE user_id = $1 ORDER BY name',
      [req.userId]
    );

    const existingTopics = topicsResult.rows.map(row => row.name);

    const suggestions = await suggestTopics(content, existingTopics);

    res.json({ suggestions });
  } catch (error) {
    console.error('Topic suggestion endpoint error:', error);

    if (error.message.includes('API key not configured')) {
      return res.status(503).json({
        error: 'AI features are not configured. Please add your OpenAI API key to enable topic suggestions.',
      });
    }

    res.status(500).json({ error: 'Failed to generate topic suggestions' });
  }
};

const performSearch = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Get all user's snippets
    const snippetsResult = await db.query(
      `SELECT s.id, s.title, s.content, s.type,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as topics
       FROM snippets s
       LEFT JOIN snippet_topics st ON s.id = st.snippet_id
       LEFT JOIN topics t ON st.topic_id = t.id
       WHERE s.user_id = $1
       GROUP BY s.id`,
      [req.userId]
    );

    const snippets = snippetsResult.rows;

    if (snippets.length === 0) {
      return res.json({ results: [] });
    }

    const rankedIds = await searchSnippets(query, snippets);

    // Return snippets in ranked order
    const rankedSnippets = rankedIds
      .map(id => snippets.find(s => s.id === id))
      .filter(s => s !== undefined);

    res.json({ results: rankedSnippets });
  } catch (error) {
    console.error('Search endpoint error:', error);

    if (error.message.includes('API key not configured')) {
      return res.status(503).json({
        error: 'AI features are not configured. Please add your OpenAI API key to enable search.',
      });
    }

    res.status(500).json({ error: 'Failed to perform search' });
  }
};

const getClozeSuggestions = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const suggestions = await suggestClozeKeywords(content);

    res.json({ suggestions });
  } catch (error) {
    console.error('Cloze suggestion endpoint error:', error);

    if (error.message.includes('API key not configured')) {
      return res.status(503).json({
        error: 'AI features are not configured. Please add your OpenAI API key to enable cloze suggestions.',
      });
    }

    res.status(500).json({ error: 'Failed to generate cloze suggestions' });
  }
};

const cleanupText = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const cleanedText = await cleanupFormatting(content);

    res.json({ cleanedText });
  } catch (error) {
    console.error('Text cleanup endpoint error:', error);

    if (error.message.includes('API key not configured')) {
      return res.status(503).json({
        error: 'AI features are not configured. Please add your OpenAI API key to enable text cleanup.',
      });
    }

    res.status(500).json({ error: 'Failed to clean up text' });
  }
};

module.exports = {
  performOCR,
  getTopicSuggestions,
  performSearch,
  getClozeSuggestions,
  cleanupText,
};
