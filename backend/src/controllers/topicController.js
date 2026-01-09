const db = require('../db');

const getTopics = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM topics WHERE user_id = $1 ORDER BY name ASC',
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
};

const createTopic = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Topic name is required' });
    }

    const result = await db.query(
      'INSERT INTO topics (user_id, name) VALUES ($1, $2) RETURNING * ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
      [req.userId, name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
};

module.exports = {
  getTopics,
  createTopic,
};
