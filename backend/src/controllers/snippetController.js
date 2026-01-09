const db = require('../db');

const createSnippet = async (req, res) => {
  try {
    const { title, type, source, content, clozeData, topics, inQueue, needsWork } = req.body;

    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }

    if (!['excerpt', 'revised', 'original'].includes(type)) {
      return res.status(400).json({ error: 'Invalid snippet type' });
    }

    // Auto-generate title if not provided
    let snippetTitle = title;
    if (!snippetTitle) {
      snippetTitle = content.substring(0, 50).trim() + (content.length > 50 ? '...' : '');
    }

    // Create snippet
    const snippetResult = await db.query(
      `INSERT INTO snippets (user_id, title, type, source, content, cloze_data, in_queue, needs_work)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.userId, snippetTitle, type, source || null, content, JSON.stringify(clozeData || []), inQueue !== false, needsWork || false]
    );

    const snippet = snippetResult.rows[0];

    // Create review entry if in queue
    if (snippet.in_queue) {
      await db.query(
        `INSERT INTO reviews (snippet_id, user_id)
         VALUES ($1, $2)`,
        [snippet.id, req.userId]
      );
    }

    // Handle topics
    if (topics && topics.length > 0) {
      for (const topicName of topics) {
        // Get or create topic
        let topicResult = await db.query(
          'SELECT id FROM topics WHERE user_id = $1 AND name = $2',
          [req.userId, topicName]
        );

        let topicId;
        if (topicResult.rows.length === 0) {
          const newTopic = await db.query(
            'INSERT INTO topics (user_id, name) VALUES ($1, $2) RETURNING id',
            [req.userId, topicName]
          );
          topicId = newTopic.rows[0].id;
        } else {
          topicId = topicResult.rows[0].id;
        }

        // Link snippet to topic
        await db.query(
          'INSERT INTO snippet_topics (snippet_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [snippet.id, topicId]
        );
      }
    }

    // Fetch complete snippet with topics
    const completeSnippet = await getSnippetById(snippet.id, req.userId);
    res.status(201).json(completeSnippet);
  } catch (error) {
    console.error('Create snippet error:', error);
    res.status(500).json({ error: 'Failed to create snippet' });
  }
};

const getSnippets = async (req, res) => {
  try {
    const { sortBy = 'created_at', order = 'desc', inQueue, needsWork, topic } = req.query;

    const validSortFields = ['created_at', 'updated_at', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    let query = `
      SELECT s.*,
        COALESCE(
          json_agg(
            jsonb_build_object('id', t.id, 'name', t.name)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as topics,
        r.next_review_date
      FROM snippets s
      LEFT JOIN snippet_topics st ON s.id = st.snippet_id
      LEFT JOIN topics t ON st.topic_id = t.id
      LEFT JOIN reviews r ON s.id = r.snippet_id
      WHERE s.user_id = $1
    `;

    const params = [req.userId];
    let paramIndex = 2;

    if (inQueue !== undefined) {
      query += ` AND s.in_queue = $${paramIndex}`;
      params.push(inQueue === 'true');
      paramIndex++;
    }

    if (needsWork !== undefined) {
      query += ` AND s.needs_work = $${paramIndex}`;
      params.push(needsWork === 'true');
      paramIndex++;
    }

    if (topic) {
      query += ` AND t.name = $${paramIndex}`;
      params.push(topic);
      paramIndex++;
    }

    query += ` GROUP BY s.id, r.next_review_date ORDER BY s.${sortField} ${sortOrder}`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get snippets error:', error);
    res.status(500).json({ error: 'Failed to fetch snippets' });
  }
};

const getSnippetById = async (snippetId, userId) => {
  const result = await db.query(
    `SELECT s.*,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) as topics
     FROM snippets s
     LEFT JOIN snippet_topics st ON s.id = st.snippet_id
     LEFT JOIN topics t ON st.topic_id = t.id
     WHERE s.id = $1 AND s.user_id = $2
     GROUP BY s.id`,
    [snippetId, userId]
  );

  return result.rows[0];
};

const getSnippet = async (req, res) => {
  try {
    const snippet = await getSnippetById(req.params.id, req.userId);

    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    res.json(snippet);
  } catch (error) {
    console.error('Get snippet error:', error);
    res.status(500).json({ error: 'Failed to fetch snippet' });
  }
};

const updateSnippet = async (req, res) => {
  try {
    const { title, type, source, content, clozeData, topics, inQueue, needsWork } = req.body;

    // Check ownership
    const existing = await db.query(
      'SELECT * FROM snippets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    const oldSnippet = existing.rows[0];

    // Update snippet
    const result = await db.query(
      `UPDATE snippets
       SET title = $1, type = $2, source = $3, content = $4, cloze_data = $5, in_queue = $6, needs_work = $7
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        title !== undefined ? title : oldSnippet.title,
        type !== undefined ? type : oldSnippet.type,
        source !== undefined ? source : oldSnippet.source,
        content !== undefined ? content : oldSnippet.content,
        clozeData !== undefined ? JSON.stringify(clozeData) : oldSnippet.cloze_data,
        inQueue !== undefined ? inQueue : oldSnippet.in_queue,
        needsWork !== undefined ? needsWork : oldSnippet.needs_work,
        req.params.id,
        req.userId,
      ]
    );

    const snippet = result.rows[0];

    // Handle queue status change
    if (inQueue !== undefined && inQueue !== oldSnippet.in_queue) {
      if (inQueue) {
        // Add to review queue
        await db.query(
          `INSERT INTO reviews (snippet_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (snippet_id) DO NOTHING`,
          [snippet.id, req.userId]
        );
      } else {
        // Remove from review queue
        await db.query(
          'DELETE FROM reviews WHERE snippet_id = $1',
          [snippet.id]
        );
      }
    }

    // Update topics if provided
    if (topics !== undefined) {
      // Remove existing topic associations
      await db.query('DELETE FROM snippet_topics WHERE snippet_id = $1', [snippet.id]);

      // Add new topics
      for (const topicName of topics) {
        let topicResult = await db.query(
          'SELECT id FROM topics WHERE user_id = $1 AND name = $2',
          [req.userId, topicName]
        );

        let topicId;
        if (topicResult.rows.length === 0) {
          const newTopic = await db.query(
            'INSERT INTO topics (user_id, name) VALUES ($1, $2) RETURNING id',
            [req.userId, topicName]
          );
          topicId = newTopic.rows[0].id;
        } else {
          topicId = topicResult.rows[0].id;
        }

        await db.query(
          'INSERT INTO snippet_topics (snippet_id, topic_id) VALUES ($1, $2)',
          [snippet.id, topicId]
        );
      }
    }

    const completeSnippet = await getSnippetById(snippet.id, req.userId);
    res.json(completeSnippet);
  } catch (error) {
    console.error('Update snippet error:', error);
    res.status(500).json({ error: 'Failed to update snippet' });
  }
};

const deleteSnippet = async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM snippets WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    res.json({ message: 'Snippet deleted successfully' });
  } catch (error) {
    console.error('Delete snippet error:', error);
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
};

const toggleQueue = async (req, res) => {
  try {
    const { inQueue } = req.body;

    const result = await db.query(
      'UPDATE snippets SET in_queue = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [inQueue, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    const snippet = result.rows[0];

    if (inQueue) {
      await db.query(
        `INSERT INTO reviews (snippet_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (snippet_id) DO NOTHING`,
        [snippet.id, req.userId]
      );
    } else {
      await db.query('DELETE FROM reviews WHERE snippet_id = $1', [snippet.id]);
    }

    res.json(snippet);
  } catch (error) {
    console.error('Toggle queue error:', error);
    res.status(500).json({ error: 'Failed to toggle queue status' });
  }
};

const toggleNeedsWork = async (req, res) => {
  try {
    const { needsWork } = req.body;

    const result = await db.query(
      'UPDATE snippets SET needs_work = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [needsWork, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle needs work error:', error);
    res.status(500).json({ error: 'Failed to toggle needs work status' });
  }
};

module.exports = {
  createSnippet,
  getSnippets,
  getSnippet,
  updateSnippet,
  deleteSnippet,
  toggleQueue,
  toggleNeedsWork,
};
