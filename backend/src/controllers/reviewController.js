const db = require('../db');
const { calculateNextReview, getNextReviewDate } = require('../utils/sm2');

const getDueCards = async (req, res) => {
  try {
    const { includeToEdit = 'true', topic, source, mode = 'study' } = req.query;
    console.log('getDueCards - mode:', mode, 'topic:', topic, 'source:', source, 'includeToEdit:', includeToEdit);

    let query = `
      SELECT s.*, r.ease_factor, r.interval, r.repetitions, r.next_review_date,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as topics
      FROM snippets s
      INNER JOIN reviews r ON s.id = r.snippet_id
      LEFT JOIN snippet_topics st ON s.id = st.snippet_id
      LEFT JOIN topics t ON st.topic_id = t.id
      WHERE s.user_id = $1
        AND s.in_queue = true
    `;

    // Only filter by due date in study mode
    if (mode === 'study') {
      query += ' AND r.next_review_date <= NOW()';
    }

    const params = [req.userId];
    let paramIndex = 2;

    if (includeToEdit === 'false') {
      query += ' AND s.to_edit = false';
    }

    if (topic) {
      query += ` AND t.name = $${paramIndex}`;
      params.push(topic);
      paramIndex++;
    }

    if (source) {
      query += ` AND s.source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    query += ' GROUP BY s.id, r.ease_factor, r.interval, r.repetitions, r.next_review_date';

    // Order based on mode
    if (mode === 'browse') {
      query += ' ORDER BY r.next_review_date ASC';
    } else if (mode === 'appreciation') {
      query += ' ORDER BY RANDOM()';
    } else {
      query += ' ORDER BY r.next_review_date ASC';
    }

    console.log('Final query:', query);
    console.log('Params:', params);
    const result = await db.query(query, params);
    console.log('getDueCards - returned', result.rows.length, 'cards');
    res.json(result.rows);
  } catch (error) {
    console.error('Get due cards error:', error);
    res.status(500).json({ error: 'Failed to fetch due cards' });
  }
};

const submitReview = async (req, res) => {
  try {
    const { quality } = req.body;
    const snippetId = req.params.snippetId;

    // Quality mapping:
    // unfamiliar: 0, hard: 2, good: 3.5, easy: 5
    const validQualities = [0, 2, 3.5, 5];
    if (!validQualities.includes(quality)) {
      return res.status(400).json({ error: 'Invalid quality rating' });
    }

    // Get current review data
    const reviewResult = await db.query(
      `SELECT r.*, s.user_id
       FROM reviews r
       INNER JOIN snippets s ON r.snippet_id = s.id
       WHERE r.snippet_id = $1`,
      [snippetId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = reviewResult.rows[0];

    // Check ownership
    if (review.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Calculate next review using SM-2
    const nextReview = calculateNextReview(
      quality,
      review.ease_factor,
      review.interval,
      review.repetitions
    );

    const nextReviewDate = getNextReviewDate(nextReview.interval);

    // Update review
    const updateResult = await db.query(
      `UPDATE reviews
       SET ease_factor = $1,
           interval = $2,
           repetitions = $3,
           next_review_date = $4,
           last_reviewed_at = NOW()
       WHERE snippet_id = $5
       RETURNING *`,
      [
        nextReview.easeFactor,
        nextReview.interval,
        nextReview.repetitions,
        nextReviewDate,
        snippetId,
      ]
    );

    res.json({
      review: updateResult.rows[0],
      nextInterval: nextReview.interval,
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

const getStats = async (req, res) => {
  try {
    const statsResult = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE s.in_queue = true) as total_in_queue,
         COUNT(*) FILTER (WHERE s.in_queue = true AND r.next_review_date <= NOW()) as due_today,
         COUNT(*) FILTER (WHERE s.to_edit = true) as to_edit,
         COUNT(*) as total_snippets
       FROM snippets s
       LEFT JOIN reviews r ON s.id = r.snippet_id
       WHERE s.user_id = $1`,
      [req.userId]
    );

    res.json(statsResult.rows[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const clearSpacedRepetitionData = async (req, res) => {
  try {
    // Reset all review data for the user's snippets
    const result = await db.query(
      `UPDATE reviews r
       SET ease_factor = 2.5,
           interval = 0,
           repetitions = 0,
           next_review_date = NOW(),
           last_reviewed_at = NULL
       FROM snippets s
       WHERE r.snippet_id = s.id
         AND s.user_id = $1`,
      [req.userId]
    );

    res.json({
      message: 'Spaced repetition data cleared successfully',
      cardsReset: result.rowCount
    });
  } catch (error) {
    console.error('Clear spaced repetition data error:', error);
    res.status(500).json({ error: 'Failed to clear spaced repetition data' });
  }
};

module.exports = {
  getDueCards,
  submitReview,
  getStats,
  clearSpacedRepetitionData,
};
