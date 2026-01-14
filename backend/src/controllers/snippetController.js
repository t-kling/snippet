const db = require('../db');

const createSnippet = async (req, res) => {
  try {
    const { title, type, source, content, clozeData, topics, inQueue, toEdit, imageData, imageClozes, author, url, page, timestamp, whyMadeThis, parentSnippet, priority } = req.body;

    // Require either content or imageData
    if (!type || (!content && !imageData)) {
      return res.status(400).json({ error: 'Type and either content or image are required' });
    }

    if (!['excerpt', 'revised', 'original'].includes(type)) {
      return res.status(400).json({ error: 'Invalid snippet type' });
    }

    // Validate image size (300KB max for base64)
    if (imageData) {
      const sizeInBytes = Buffer.byteLength(imageData, 'utf8');
      const sizeInKB = sizeInBytes / 1024;
      if (sizeInKB > 400) { // Base64 is ~33% larger, so 400KB base64 ≈ 300KB binary
        return res.status(400).json({ error: 'Image size exceeds 300KB limit' });
      }
    }

    // Auto-generate title if not provided
    let snippetTitle = title;
    if (!snippetTitle) {
      if (content) {
        snippetTitle = content.substring(0, 50).trim() + (content.length > 50 ? '...' : '');
      } else {
        // For image-only cards, generate a simple numbered title
        const countResult = await db.query(
          'SELECT COUNT(*) as count FROM snippets WHERE user_id = $1 AND image_data IS NOT NULL',
          [req.userId]
        );
        const imageCount = parseInt(countResult.rows[0].count) + 1;
        snippetTitle = `Image ${imageCount}`;
      }
    }

    // Create snippet
    const snippetResult = await db.query(
      `INSERT INTO snippets (user_id, title, type, source, content, cloze_data, in_queue, to_edit, image_data, image_clozes, author, url, page, timestamp, why_made_this, parent_snippet, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [req.userId, snippetTitle, type, source || null, content || '', JSON.stringify(clozeData || []), inQueue !== false, toEdit || false, imageData || null, JSON.stringify(imageClozes || []), author || null, url || null, page || null, timestamp || null, whyMadeThis || null, parentSnippet || null, priority || 'medium']
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
    const { sortBy = 'created_at', order = 'desc', inQueue, toEdit, topic, source } = req.query;

    const validSortFields = ['created_at', 'updated_at', 'title', 'priority'];
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

    if (toEdit !== undefined) {
      query += ` AND s.to_edit = $${paramIndex}`;
      params.push(toEdit === 'true');
      paramIndex++;
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

    // Special handling for priority sorting
    if (sortField === 'priority') {
      query += ` GROUP BY s.id, r.next_review_date ORDER BY
        CASE COALESCE(s.priority, 'medium')
          WHEN 'low' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'high' THEN 3
        END ${sortOrder}`;
    } else {
      query += ` GROUP BY s.id, r.next_review_date ORDER BY s.${sortField} ${sortOrder}`;
    }

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
    const { title, type, source, content, clozeData, topics, inQueue, toEdit, imageData, imageClozes, author, url, page, timestamp, whyMadeThis, parentSnippet, priority } = req.body;

    // Check ownership
    const existing = await db.query(
      'SELECT * FROM snippets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    const oldSnippet = existing.rows[0];

    // Validate image size (300KB max for base64)
    if (imageData) {
      const sizeInBytes = Buffer.byteLength(imageData, 'utf8');
      const sizeInKB = sizeInBytes / 1024;
      if (sizeInKB > 400) { // Base64 is ~33% larger, so 400KB base64 ≈ 300KB binary
        return res.status(400).json({ error: 'Image size exceeds 300KB limit' });
      }
    }

    // Update snippet
    const result = await db.query(
      `UPDATE snippets
       SET title = $1, type = $2, source = $3, content = $4, cloze_data = $5, in_queue = $6, to_edit = $7, image_data = $8, image_clozes = $9, author = $10, url = $11, page = $12, timestamp = $13, why_made_this = $14, parent_snippet = $15, priority = $16
       WHERE id = $17 AND user_id = $18
       RETURNING *`,
      [
        title !== undefined ? title : oldSnippet.title,
        type !== undefined ? type : oldSnippet.type,
        source !== undefined ? source : oldSnippet.source,
        content !== undefined ? content : oldSnippet.content,
        clozeData !== undefined ? JSON.stringify(clozeData) : oldSnippet.cloze_data,
        inQueue !== undefined ? inQueue : oldSnippet.in_queue,
        toEdit !== undefined ? toEdit : oldSnippet.to_edit,
        imageData !== undefined ? imageData : oldSnippet.image_data,
        imageClozes !== undefined ? JSON.stringify(imageClozes) : oldSnippet.image_clozes,
        author !== undefined ? author : oldSnippet.author,
        url !== undefined ? url : oldSnippet.url,
        page !== undefined ? page : oldSnippet.page,
        timestamp !== undefined ? timestamp : oldSnippet.timestamp,
        whyMadeThis !== undefined ? whyMadeThis : oldSnippet.why_made_this,
        parentSnippet !== undefined ? parentSnippet : oldSnippet.parent_snippet,
        priority !== undefined ? priority : oldSnippet.priority,
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
    const { toEdit } = req.body;

    const result = await db.query(
      'UPDATE snippets SET to_edit = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [toEdit, req.params.id, req.userId]
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

const getSources = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT source
       FROM snippets
       WHERE user_id = $1 AND source IS NOT NULL AND source != ''
       ORDER BY source ASC`,
      [req.userId]
    );

    res.json(result.rows.map(row => row.source));
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
};

const exportLibrary = async (req, res) => {
  try {
    // Get all snippets with topics
    const snippetsResult = await db.query(
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
       WHERE s.user_id = $1
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [req.userId]
    );

    // Get all unique topics for reference
    const topicsResult = await db.query(
      `SELECT DISTINCT name FROM topics WHERE user_id = $1 ORDER BY name ASC`,
      [req.userId]
    );

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      snippets: snippetsResult.rows,
      topics: topicsResult.rows.map(r => r.name),
    };

    res.json(exportData);
  } catch (error) {
    console.error('Export library error:', error);
    res.status(500).json({ error: 'Failed to export library' });
  }
};

const importLibrary = async (req, res) => {
  try {
    const { snippets, topics } = req.body;

    if (!snippets || !Array.isArray(snippets)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    let importedCount = 0;
    const topicMap = new Map(); // Map topic names to IDs

    // First, create all topics
    if (topics && Array.isArray(topics)) {
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
        topicMap.set(topicName, topicId);
      }
    }

    // Import each snippet
    for (const snippet of snippets) {
      try {
        // Create snippet
        const snippetResult = await db.query(
          `INSERT INTO snippets (user_id, title, type, source, content, cloze_data, in_queue, to_edit, image_data, image_clozes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            req.userId,
            snippet.title,
            snippet.type,
            snippet.source || null,
            snippet.content || '',
            snippet.cloze_data || '[]',
            snippet.in_queue !== false,
            snippet.to_edit || false,
            snippet.image_data || null,
            snippet.image_clozes || '[]',
          ]
        );

        const newSnippet = snippetResult.rows[0];

        // Create review entry if in queue
        if (newSnippet.in_queue) {
          await db.query(
            `INSERT INTO reviews (snippet_id, user_id) VALUES ($1, $2)`,
            [newSnippet.id, req.userId]
          );
        }

        // Link topics
        if (snippet.topics && Array.isArray(snippet.topics)) {
          for (const topic of snippet.topics) {
            const topicName = typeof topic === 'string' ? topic : topic.name;
            let topicId = topicMap.get(topicName);

            if (!topicId) {
              // Create topic if it doesn't exist
              let topicResult = await db.query(
                'SELECT id FROM topics WHERE user_id = $1 AND name = $2',
                [req.userId, topicName]
              );

              if (topicResult.rows.length === 0) {
                const newTopic = await db.query(
                  'INSERT INTO topics (user_id, name) VALUES ($1, $2) RETURNING id',
                  [req.userId, topicName]
                );
                topicId = newTopic.rows[0].id;
              } else {
                topicId = topicResult.rows[0].id;
              }
              topicMap.set(topicName, topicId);
            }

            await db.query(
              'INSERT INTO snippet_topics (snippet_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [newSnippet.id, topicId]
            );
          }
        }

        importedCount++;
      } catch (snippetError) {
        console.error('Error importing snippet:', snippetError);
        // Continue with next snippet
      }
    }

    res.json({
      message: 'Library imported successfully',
      importedCount,
      totalAttempted: snippets.length
    });
  } catch (error) {
    console.error('Import library error:', error);
    res.status(500).json({ error: 'Failed to import library' });
  }
};

const bulkUpdatePriority = async (req, res) => {
  try {
    const { snippetIds, priority } = req.body;

    if (!snippetIds || !Array.isArray(snippetIds) || snippetIds.length === 0) {
      return res.status(400).json({ error: 'Snippet IDs array is required' });
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    // Update priority for all specified snippets that belong to the user
    const result = await db.query(
      `UPDATE snippets
       SET priority = $1
       WHERE id = ANY($2) AND user_id = $3
       RETURNING id`,
      [priority, snippetIds, req.userId]
    );

    res.json({
      message: 'Priority updated successfully',
      updatedCount: result.rows.length
    });
  } catch (error) {
    console.error('Bulk update priority error:', error);
    res.status(500).json({ error: 'Failed to update priority' });
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
  getSources,
  exportLibrary,
  importLibrary,
  bulkUpdatePriority,
};
